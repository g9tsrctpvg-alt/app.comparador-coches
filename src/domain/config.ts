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

/** Sube cuando la forma de `AppConfig` cambia de manera incompatible
 * (product/0012, requisito 2). Una configuración guardada con otra versión
 * se descarta entera: no se intenta adivinar qué campos siguen valiendo. */
export const CONFIG_VERSION = 1;

export const DEFAULT_BUDGET_EUR = 47000;

/**
 * El único objeto de configuración del usuario (requisito 1): pesos,
 * supuestos, presupuesto, el filtro de presupuesto y las valoraciones
 * sobrescritas. Es el único objeto que se persiste y el único que se
 * comparte por enlace.
 */
export interface AppConfig {
  version: number;
  weights: AxisWeights;
  assumptions: GlobalAssumptions;
  budgetEur: number;
  hideOverBudget: boolean;
  overrides: Record<string, RatingOverride>;
}

export const DEFAULT_CONFIG: AppConfig = {
  version: CONFIG_VERSION,
  weights: DEFAULT_WEIGHTS,
  assumptions: DEFAULT_ASSUMPTIONS,
  budgetEur: DEFAULT_BUDGET_EUR,
  hideOverBudget: false,
  overrides: {},
};

const AxisWeightsSchema = z.object({
  viaje: z.number().min(0).max(10),
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
const HideOverBudgetSchema = z.boolean();
const RatingValueSchema = z.number().min(1).max(5);

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
  if (record.version !== CONFIG_VERSION) {
    logError('config_discarded', {
      reason: 'unknown_version',
      'config.version': String(record.version),
    });
    return { config: DEFAULT_CONFIG, discardedEntirely: true };
  }

  const config: AppConfig = {
    version: CONFIG_VERSION,
    weights: restoreField(
      'weights',
      record.weights,
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
    hideOverBudget: restoreField(
      'hideOverBudget',
      record.hideOverBudget,
      HideOverBudgetSchema,
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
