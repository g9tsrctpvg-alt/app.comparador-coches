import { z } from 'zod';
import { logError } from '../logging/logger';

/** Sube cuando la forma de `DecisionLog` cambia de manera incompatible
 * (product/0030, requisito 3.1). Independiente de `CONFIG_VERSION` y de
 * `VIEW_STATE_VERSION`: las tres claves se descartan por separado, así que
 * un cambio en un control de la ficha no se lleva por delante un motivo
 * escrito a mano. */
export const DECISION_LOG_VERSION = 1;

/** Los tres valores del estado de decisión (requisito 1.1). `undecided` no
 * se guarda nunca —un coche sin entrada en el registro **es** `undecided`
 * (requisito 1.3)—, así que solo los otros dos aparecen dentro de
 * `DecisionEntry`. No son una escala (requisito 1.4): no hay orden entre
 * ellos, y `DECISION_STATES` es solo la lista completa para construir
 * controles, no un ranking.
 */
export const DECISION_STATES = ['undecided', 'shortlist', 'discarded'] as const;
export type DecisionState = (typeof DECISION_STATES)[number];

export const STORED_DECISION_STATES = ['shortlist', 'discarded'] as const;
export type StoredDecisionState = (typeof STORED_DECISION_STATES)[number];

export const DECISION_FILTERS = [
  'all',
  'no-discarded',
  'shortlist-only',
] as const;
export type DecisionFilter = (typeof DECISION_FILTERS)[number];

/** El motivo es opcional en los tres estados, descarte incluido (requisito
 * 2.4): `undefined`, no una cadena vacía, cuando no se ha escrito nada. */
export interface DecisionEntry {
  state: StoredDecisionState;
  reason?: string;
  date: string;
}

export interface DecisionLog {
  version: number;
  entries: Record<string, DecisionEntry>;
  filter: DecisionFilter;
}

export function defaultDecisionLog(): DecisionLog {
  return { version: DECISION_LOG_VERSION, entries: {}, filter: 'all' };
}

/** Un coche sin entrada está `undecided` (requisito 1.3): no hace falta
 * distinguir «nunca decidido» de ningún otro caso. */
export function decisionOf(log: DecisionLog, carId: string): DecisionState {
  return log.entries[carId]?.state ?? 'undecided';
}

export function entryOf(
  log: DecisionLog,
  carId: string,
): DecisionEntry | undefined {
  return log.entries[carId];
}

/**
 * Fija el estado de un coche (requisitos 2.2-2.4). Pura: `today` la aporta
 * quien llama, con el mismo criterio con que `defaultViewState` recibe
 * `defaultComparisonId` desde fuera — el dominio no lee el reloj.
 *
 * La fecha se mueve **solo cuando cambia el estado** (requisito 2.3):
 * corregir la redacción del motivo sin tocar el estado conserva la fecha
 * que ya había.
 */
export function setDecision(
  log: DecisionLog,
  carId: string,
  state: StoredDecisionState,
  reason: string | undefined,
  today: string,
): DecisionLog {
  const existing = log.entries[carId];
  const date = existing?.state === state ? existing.date : today;
  const trimmedReason = reason?.trim();
  const entry: DecisionEntry = trimmedReason
    ? { state, date, reason: trimmedReason }
    : { state, date };
  return { ...log, entries: { ...log.entries, [carId]: entry } };
}

/** Volver a `undecided` borra la entrada entera, motivo y fecha incluidos
 * (requisito 2.5): no se conserva un motivo huérfano de un estado que ya no
 * está. */
export function clearDecision(log: DecisionLog, carId: string): DecisionLog {
  const { [carId]: _removed, ...entries } = log.entries;
  return { ...log, entries };
}

export function setDecisionFilter(
  log: DecisionLog,
  filter: DecisionFilter,
): DecisionLog {
  return { ...log, filter };
}

/** El filtro de tres posiciones (requisito 4.1), aplicado después de
 * puntuar: nunca decide qué se calcula, solo qué se ve (dependencias y
 * supuestos, ADR 0004). */
export function passesDecisionFilter(
  state: DecisionState,
  filter: DecisionFilter,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'no-discarded':
      return state !== 'discarded';
    case 'shortlist-only':
      return state === 'shortlist';
  }
}

const DecisionStateSchema = z.enum(STORED_DECISION_STATES);
const DecisionDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const DecisionReasonSchema = z.string().min(1);
const DecisionFilterSchema = z.enum(DECISION_FILTERS);

function restoreEntry(carId: string, raw: unknown): DecisionEntry | undefined {
  if (typeof raw !== 'object' || raw === null) {
    logError('decision_entry_discarded', {
      'car.id': carId,
      reason: 'not_an_object',
    });
    return undefined;
  }
  const record = raw as Record<string, unknown>;

  const state = DecisionStateSchema.safeParse(record.state);
  if (!state.success) {
    logError('decision_entry_discarded', {
      'car.id': carId,
      reason: 'invalid_state',
    });
    return undefined;
  }

  const date = DecisionDateSchema.safeParse(record.date);
  if (!date.success) {
    logError('decision_entry_discarded', {
      'car.id': carId,
      reason: 'invalid_date',
    });
    return undefined;
  }

  if (record.reason === undefined) {
    return { state: state.data, date: date.data };
  }
  const reason = DecisionReasonSchema.safeParse(record.reason);
  if (!reason.success) {
    logError('decision_entry_discarded', {
      'car.id': carId,
      reason: 'invalid_reason',
    });
    return undefined;
  }
  return { state: state.data, date: date.data, reason: reason.data };
}

/** Igual criterio que `restoreOverrides` en `config.ts`: ausente es `{}` sin
 * registro (requisito 3.3, «un campo ausente no es un descarte»); presente
 * pero de otro tipo se descarta entero con registro; una entrada inválida
 * se descarta sola, sin llevarse las demás; un `car.id` fuera del catálogo
 * vigente descarta su entrada. */
function restoreEntries(
  value: unknown,
  validCarIds: ReadonlySet<string>,
): Record<string, DecisionEntry> {
  if (value === undefined) return {};
  if (typeof value !== 'object' || value === null) {
    logError('decision_log_discarded', { reason: 'entries_not_an_object' });
    return {};
  }

  const result: Record<string, DecisionEntry> = {};
  for (const [carId, rawEntry] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!validCarIds.has(carId)) {
      logError('decision_entry_discarded', {
        'car.id': carId,
        reason: 'car_not_in_catalog',
      });
      continue;
    }
    const entry = restoreEntry(carId, rawEntry);
    if (entry !== undefined) result[carId] = entry;
  }
  return result;
}

function restoreFilter(value: unknown): DecisionFilter {
  if (value === undefined) return 'all';
  const parsed = DecisionFilterSchema.safeParse(value);
  if (!parsed.success) {
    logError('decision_log_field_discarded', { field: 'filter' });
    return 'all';
  }
  return parsed.data;
}

export interface RestoreDecisionLogResult {
  decisionLog: DecisionLog;
  /** Verdadero cuando `raw` no era un objeto restaurable en absoluto — JSON
   * corrupto o versión desconocida—, igual que `RestoreResult` de
   * `config.ts` y `RestoreViewStateResult` de `viewState.ts`. */
  discardedEntirely: boolean;
}

/**
 * Restaura el registro de decisiones desde JSON ya parseado
 * (`localStorage`), con la misma degradación por partes que `restoreConfig`
 * y `restoreViewState` (requisito 3.3). Ningún motivo escrito por el
 * usuario entra nunca en un registro de `logError` (requisito 7.1): las
 * funciones de arriba solo registran el `car.id` y el motivo del descarte,
 * nunca el contenido de `reason`.
 */
export function restoreDecisionLog(
  raw: unknown,
  validCarIds: ReadonlySet<string>,
): RestoreDecisionLogResult {
  const fallback = defaultDecisionLog();

  if (typeof raw !== 'object' || raw === null) {
    logError('decision_log_discarded', { reason: 'not_an_object' });
    return { decisionLog: fallback, discardedEntirely: true };
  }

  const record = raw as Record<string, unknown>;
  if (record.version !== DECISION_LOG_VERSION) {
    logError('decision_log_discarded', {
      reason: 'unknown_version',
      'decision_log.version': String(record.version),
    });
    return { decisionLog: fallback, discardedEntirely: true };
  }

  return {
    decisionLog: {
      version: DECISION_LOG_VERSION,
      entries: restoreEntries(record.entries, validCarIds),
      filter: restoreFilter(record.filter),
    },
    discardedEntirely: false,
  };
}
