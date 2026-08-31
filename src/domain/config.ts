import { z } from 'zod';
import { logError } from '../logging/logger';
import {
  AXIS_ORDER,
  DEFAULT_WEIGHTS,
  type AxisWeights,
} from './scoring/weights';
import {
  DEFAULT_ASSUMPTIONS,
  type GlobalAssumptions,
} from './scoring/assumptions';
import {
  EDITABLE_RATING_FIELDS,
  type RatingOverride,
} from './scoring/overrides';
import {
  isOperatorAllowed,
  RULE_OPERATORS,
  type EliminatoryRule,
} from './eliminatoryRules';
import { FICHA_FIELDS } from './ficha';

/** Sube cuando la forma de `AppConfig` cambia de manera incompatible
 * (product/0012, requisito 2). Una configuración guardada con otra versión
 * se descarta entera: no se intenta adivinar qué campos siguen valiendo.
 * `2` desde `product/0031`, requisito 3.2: `hideOverBudget` se renombra a
 * `hideFailingRules` y `eliminatoryRules` es nuevo — una configuración
 * guardada con `version: 1` cae a los valores por defecto, a propósito.
 *
 * `3` desde `product/0033`, requisito 5.1: `weights.viaje` se parte en
 * `weights.carga` y `weights.habitabilidad`. Este salto **sí** se migra —
 * ver `migrateWeightsV2ToV3` — porque a diferencia del resto de saltos de
 * versión, aquí no hay nada que adivinar: el reparto a partes iguales es
 * una equivalencia aritmética exacta (requisito 4.2 de la spec), no una
 * suposición sobre qué quiso decir el usuario. */
export const CONFIG_VERSION = 3;

export const DEFAULT_BUDGET_EUR = 47000;

/**
 * El único objeto de configuración del usuario (requisito 1): pesos,
 * supuestos, presupuesto, las reglas eliminatorias, el filtro de quién no
 * cumple y las valoraciones sobrescritas. Es el único objeto que se
 * persiste y el único que se comparte por enlace.
 */
export interface AppConfig {
  version: number;
  weights: AxisWeights;
  assumptions: GlobalAssumptions;
  budgetEur: number;
  /** Los imprescindibles sobre cualquier magnitud de la ficha
   * (product/0031). El presupuesto no vive aquí: sigue siendo `budgetEur` +
   * `car.overBudget`, no una `EliminatoryRule` más. */
  eliminatoryRules: EliminatoryRule[];
  /** Oculta el tramo entero de quien no cumple presupuesto o alguna regla
   * (product/0031, requisito 4.3). Sustituye a `hideOverBudget`. */
  hideFailingRules: boolean;
  overrides: Record<string, RatingOverride>;
}

export const DEFAULT_CONFIG: AppConfig = {
  version: CONFIG_VERSION,
  weights: DEFAULT_WEIGHTS,
  assumptions: DEFAULT_ASSUMPTIONS,
  budgetEur: DEFAULT_BUDGET_EUR,
  eliminatoryRules: [],
  hideFailingRules: false,
  overrides: {},
};

const AxisWeightsSchema = z.object({
  carga: z.number().min(0).max(10),
  habitabilidad: z.number().min(0).max(10),
  diario: z.number().min(0).max(10),
  prestaciones: z.number().min(0).max(10),
  fiabilidad: z.number().min(0).max(10),
  estetica: z.number().min(0).max(10),
  coste: z.number().min(0).max(10),
});

const GlobalAssumptionsSchema = z.object({
  kmPorAnio: z.number().min(5000).max(40000),
  precioLitro: z.number().min(1).max(3),
  precioKwh: z.number().min(0.1).max(1),
  mezclaEstetica: z.number().min(0).max(1),
  ponderacionAnchoDiario: z.number().min(0).max(1),
  pensandoVender: z.boolean(),
  cargaEnCasa: z.boolean(),
});

const BudgetSchema = z.number().min(20000).max(100000);
const HideFailingRulesSchema = z.boolean();
const RatingValueSchema = z.number().min(1).max(5);

const EliminatoryRuleSchema = z.object({
  field: z.enum(FICHA_FIELDS),
  operator: z.enum(RULE_OPERATORS),
  value: z.number(),
});

/** Ausente no es inválido: es que la URL o el guardado no lo tocaron y vale
 * el valor por defecto (requisito 8, enlaces cortos). Solo un valor
 * **presente** que no pasa el esquema cuenta como descarte y se registra
 * (requisito 10). */
function restoreField<T>(
  field: string,
  value: unknown,
  schema: z.ZodType<T>,
  fallback: T,
): T {
  if (value === undefined) return fallback;
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    logError('config_field_discarded', { field });
    return fallback;
  }
  return parsed.data;
}

/**
 * Las valoraciones sobrescritas se restauran por coche y por campo
 * (requisitos 11 y 12): una valoración fuera de rango descarta solo esa
 * valoración, no las demás del mismo coche; un coche que ya no está en el
 * catálogo descarta todas las suyas.
 */
function restoreOverrides(
  value: unknown,
  validCarIds: ReadonlySet<string>,
): Record<string, RatingOverride> {
  if (value === undefined) return {};
  if (typeof value !== 'object' || value === null) {
    logError('config_field_discarded', { field: 'overrides' });
    return {};
  }

  const result: Record<string, RatingOverride> = {};
  for (const [carId, rawOverride] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!validCarIds.has(carId)) {
      logError('config_override_discarded', {
        'car.id': carId,
        reason: 'car_not_in_catalog',
      });
      continue;
    }
    if (typeof rawOverride !== 'object' || rawOverride === null) {
      logError('config_override_discarded', {
        'car.id': carId,
        reason: 'not_an_object',
      });
      continue;
    }

    const record = rawOverride as Record<string, unknown>;
    const carOverride: RatingOverride = {};
    for (const field of EDITABLE_RATING_FIELDS) {
      if (!(field in record)) continue;
      const parsed = RatingValueSchema.safeParse(record[field]);
      if (parsed.success) {
        carOverride[field] = parsed.data;
      } else {
        logError('config_rating_discarded', { 'car.id': carId, field });
      }
    }
    if (Object.keys(carOverride).length > 0) {
      result[carId] = carOverride;
    }
  }
  return result;
}

/**
 * Las reglas eliminatorias se restauran regla a regla (product/0031,
 * requisito 3.3): una regla con `field` desconocido, `operator` que no es
 * `'min'`/`'max'`, `value` no numérico, o un `operator` que contradice la
 * polaridad declarada del campo (`isOperatorAllowed`) se descarta sola, sin
 * llevarse las demás. Un `field` repetido conserva solo la primera
 * aparición (requisito 1.3: a lo sumo una regla por magnitud).
 */
function restoreEliminatoryRules(value: unknown): EliminatoryRule[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    logError('config_field_discarded', { field: 'eliminatoryRules' });
    return [];
  }

  const result: EliminatoryRule[] = [];
  const seenFields = new Set<string>();
  for (const rawRule of value) {
    const parsed = EliminatoryRuleSchema.safeParse(rawRule);
    if (!parsed.success) {
      logError('config_rule_discarded', { reason: 'invalid_shape' });
      continue;
    }
    const rule = parsed.data;
    if (!isOperatorAllowed(rule.field, rule.operator)) {
      logError('config_rule_discarded', {
        field: rule.field,
        reason: 'operator_contradicts_polarity',
      });
      continue;
    }
    if (seenFields.has(rule.field)) {
      logError('config_rule_discarded', {
        field: rule.field,
        reason: 'duplicate_field',
      });
      continue;
    }
    seenFields.add(rule.field);
    result.push(rule);
  }
  return result;
}

/**
 * Migra `weights` de la versión 2 a la 3 (product/0033, requisito 5.2):
 * `viaje` se reparte a partes iguales entre `carga` y `habitabilidad`. Un
 * `viaje` no numérico o ausente deja el objeto tal cual, sin inventar un
 * valor — `AxisWeightsSchema` lo rechazará después por su cuenta y el
 * descarte de campo hará su trabajo habitual.
 */
function migrateWeightsV2ToV3(rawWeights: unknown): unknown {
  if (typeof rawWeights !== 'object' || rawWeights === null) {
    return rawWeights;
  }
  const { viaje, ...rest } = rawWeights as Record<string, unknown>;
  if (typeof viaje !== 'number') return rest;
  return { ...rest, carga: viaje / 2, habitabilidad: viaje / 2 };
}

export interface RestoreResult {
  config: AppConfig;
  /** Verdadero cuando `raw` no era un objeto restaurable en absoluto —JSON
   * corrupto o versión desconocida (requisito 2)— y por tanto se ha
   * descartado entero, no campo a campo. Quien llama decide si eso
   * significa «usar valores por defecto» o «probar la siguiente fuente en
   * la precedencia» (requisito 3). */
  discardedEntirely: boolean;
}

/**
 * Restaura una configuración desde JSON ya parseado (localStorage o URL),
 * con degradación por partes (requisito 9): un dato corrupto o fuera de
 * rango no rompe la aplicación, se descarta y esa parte cae a su valor por
 * defecto. `validCarIds` es el catálogo vigente, para el requisito 12.
 */
export function restoreConfig(
  raw: unknown,
  validCarIds: ReadonlySet<string>,
): RestoreResult {
  if (typeof raw !== 'object' || raw === null) {
    logError('config_discarded', { reason: 'not_an_object' });
    return { config: DEFAULT_CONFIG, discardedEntirely: true };
  }

  const record = raw as Record<string, unknown>;
  // La única versión que se migra en vez de descartarse (requisito 5.2 de
  // product/0033): el reparto de `viaje` es una equivalencia exacta, no una
  // suposición, así que aquí sí se adivina qué campos siguen valiendo.
  const isVersion2 = record.version === 2;
  if (record.version !== CONFIG_VERSION && !isVersion2) {
    logError('config_discarded', {
      reason: 'unknown_version',
      'config.version': String(record.version),
    });
    return { config: DEFAULT_CONFIG, discardedEntirely: true };
  }
  const rawWeights = isVersion2
    ? migrateWeightsV2ToV3(record.weights)
    : record.weights;

  const config: AppConfig = {
    version: CONFIG_VERSION,
    weights: restoreField(
      'weights',
      rawWeights,
      AxisWeightsSchema,
      DEFAULT_WEIGHTS,
    ),
    assumptions: restoreField(
      'assumptions',
      record.assumptions,
      GlobalAssumptionsSchema,
      DEFAULT_ASSUMPTIONS,
    ),
    budgetEur: restoreField(
      'budgetEur',
      record.budgetEur,
      BudgetSchema,
      DEFAULT_BUDGET_EUR,
    ),
    eliminatoryRules: restoreEliminatoryRules(record.eliminatoryRules),
    hideFailingRules: restoreField(
      'hideFailingRules',
      record.hideFailingRules,
      HideFailingRulesSchema,
      false,
    ),
    overrides: restoreOverrides(record.overrides, validCarIds),
  };
  return { config, discardedEntirely: false };
}

/** Lista de ejes en un array, no solo el tipo: `AXIS_ORDER` ya hace esto
 * mismo para `AxisId` (`weights.ts`) porque una interfaz de TypeScript no
 * tiene reflexión en tiempo de ejecución. Mismo patrón aquí para los
 * supuestos globales. */
export const ASSUMPTION_KEYS: (keyof GlobalAssumptions)[] = [
  'kmPorAnio',
  'precioLitro',
  'precioKwh',
  'mezclaEstetica',
  'ponderacionAnchoDiario',
  'pensandoVender',
  'cargaEnCasa',
];

export { AXIS_ORDER };
