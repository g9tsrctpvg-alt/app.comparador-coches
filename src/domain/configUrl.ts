import { AXIS_ORDER } from './scoring/weights';
import { EDITABLE_RATING_FIELDS } from './scoring/overrides';
import {
  ASSUMPTION_KEYS,
  CONFIG_VERSION,
  DEFAULT_BUDGET_EUR,
  DEFAULT_CONFIG,
  type AppConfig,
} from './config';

const WEIGHT_PREFIX = 'w_';
// El nombre de parámetro que `viaje` usaba hasta `product/0033`. No entra
// en `AXIS_ORDER` —no es un eje vigente—, así que se lee aparte para que un
// enlace `v=2` con `w_viaje` llegue a `restoreConfig` con la clave `viaje`
// intacta, que es la que `migrateWeightsV2ToV3` sabe repartir (requisito
// 5.5 de la spec).
const LEGACY_VIAJE_WEIGHT_PARAM = `${WEIGHT_PREFIX}viaje`;
const ASSUMPTION_PREFIX = 'a_';
const OVERRIDE_PREFIX = 'o_';
const RULE_PREFIX = 'r_';
const BUDGET_PARAM = 'budget';
const HIDE_FAILING_RULES_PARAM = 'hideFailingRules';
const VERSION_PARAM = 'v';

/**
 * Solo viaja lo que se aparta de los valores por defecto (requisito 8): un
 * parámetro por dato cambiado, con nombre corto y legible (requisito 7), no
 * un blob codificado. Con la configuración por defecto no se añade ni
 * siquiera la versión — el resultado es la URL limpia del sitio.
 */
export function configToParams(config: AppConfig): URLSearchParams {
  const params = new URLSearchParams();

  for (const axisId of AXIS_ORDER) {
    if (config.weights[axisId] !== DEFAULT_CONFIG.weights[axisId]) {
      params.set(`${WEIGHT_PREFIX}${axisId}`, String(config.weights[axisId]));
    }
  }

  for (const key of ASSUMPTION_KEYS) {
    const value = config.assumptions[key];
    if (value !== DEFAULT_CONFIG.assumptions[key]) {
      // Los dos supuestos booleanos parten de `false` (assumptions.ts), así
      // que solo se emite este parámetro cuando valen `true`: no hace falta
      // un caso `'0'` que nunca se alcanzaría.
      params.set(
        `${ASSUMPTION_PREFIX}${key}`,
        typeof value === 'boolean' ? '1' : String(value),
      );
    }
  }

  if (config.budgetEur !== DEFAULT_BUDGET_EUR) {
    params.set(BUDGET_PARAM, String(config.budgetEur));
  }

  // Un parámetro por regla activa (product/0031, requisito 3.4), con el
  // operador y el umbral juntos: a lo sumo una regla por magnitud
  // (requisito 1.3), así que el nombre del campo ya es una clave única y no
  // hace falta un índice.
  for (const rule of config.eliminatoryRules) {
    params.set(`${RULE_PREFIX}${rule.field}`, `${rule.operator}:${rule.value}`);
  }

  if (config.hideFailingRules) {
    params.set(HIDE_FAILING_RULES_PARAM, '1');
  }

  for (const [carId, override] of Object.entries(config.overrides)) {
    for (const field of EDITABLE_RATING_FIELDS) {
      const value = override[field];
      if (value !== undefined) {
        params.set(`${OVERRIDE_PREFIX}${carId}_${field}`, String(value));
      }
    }
  }

  if (Array.from(params.keys()).length > 0) {
    params.set(VERSION_PARAM, String(CONFIG_VERSION));
  }

  return params;
}

function splitOverrideKey(
  key: string,
): { carId: string; field: string } | null {
  const rest = key.slice(OVERRIDE_PREFIX.length);
  const separator = rest.lastIndexOf('_');
  if (separator === -1) return null;
  return { carId: rest.slice(0, separator), field: rest.slice(separator + 1) };
}

/**
 * El reverso de `configToParams`: reconstruye un objeto crudo con la forma
 * de `AppConfig` —completando con los valores por defecto lo que la URL no
 * menciona—, listo para pasarlo a `restoreConfig`, que es quien valida.
 * `undefined` cuando la URL no lleva ningún parámetro reconocido: no hay
 * configuración que restaurar, no una configuración vacía que descartar.
 */
export function paramsToRawConfig(params: URLSearchParams): unknown {
  if (Array.from(params.keys()).length === 0) return undefined;

  const weights: Record<string, unknown> = { ...DEFAULT_CONFIG.weights };
  for (const axisId of AXIS_ORDER) {
    const raw = params.get(`${WEIGHT_PREFIX}${axisId}`);
    if (raw !== null) weights[axisId] = Number(raw);
  }
  const legacyViaje = params.get(LEGACY_VIAJE_WEIGHT_PARAM);
  if (legacyViaje !== null) weights.viaje = Number(legacyViaje);

  const assumptions: Record<string, unknown> = {
    ...DEFAULT_CONFIG.assumptions,
  };
  for (const key of ASSUMPTION_KEYS) {
    const raw = params.get(`${ASSUMPTION_PREFIX}${key}`);
    if (raw === null) continue;
    assumptions[key] =
      typeof DEFAULT_CONFIG.assumptions[key] === 'boolean'
        ? raw === '1'
        : Number(raw);
  }

  const budgetRaw = params.get(BUDGET_PARAM);
  const budgetEur = budgetRaw !== null ? Number(budgetRaw) : DEFAULT_BUDGET_EUR;

  const hideFailingRules = params.get(HIDE_FAILING_RULES_PARAM) === '1';

  // El reverso de la codificación `<operator>:<value>` (requisito 3.4): un
  // valor sin `:` no produce ninguna regla — no hay nada aquí que
  // `restoreConfig` pueda rechazar de forma más informativa, así que se
  // descarta sin más, igual que `splitOverrideKey` hace con una clave de
  // valoración mal formada.
  const eliminatoryRules: unknown[] = [];
  for (const [key, value] of params.entries()) {
    if (!key.startsWith(RULE_PREFIX)) continue;
    const field = key.slice(RULE_PREFIX.length);
    const separator = value.indexOf(':');
    if (separator === -1) continue;
    eliminatoryRules.push({
      field,
      operator: value.slice(0, separator),
      value: Number(value.slice(separator + 1)),
    });
  }

  const overrides: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of params.entries()) {
    if (!key.startsWith(OVERRIDE_PREFIX)) continue;
    const split = splitOverrideKey(key);
    if (split === null) continue;
    const carOverrides = (overrides[split.carId] ??= {});
    carOverrides[split.field] = Number(value);
  }

  const versionRaw = params.get(VERSION_PARAM);

  return {
    version: versionRaw !== null ? Number(versionRaw) : undefined,
    weights,
    assumptions,
    budgetEur,
    eliminatoryRules,
    hideFailingRules,
    overrides,
  };
}
