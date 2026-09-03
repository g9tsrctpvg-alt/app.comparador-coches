import { z } from 'zod';
import { logError } from '../logging/logger';

/** Sube cuando la forma de `TestDriveLog` cambia de manera incompatible
 * (product/0037, requisito 3.1). Independiente de `CONFIG_VERSION`, de
 * `VIEW_STATE_VERSION` y de `DECISION_LOG_VERSION`: las cuatro claves se
 * descartan por separado, así que un cambio en un control de la ficha no se
 * lleva por delante una nota escrita a mano. */
export const TEST_DRIVE_LOG_VERSION = 1;

/** Los cinco juicios que solo se pueden dar sentado dentro (requisito 1.1).
 * Cada uno juzga lo que la magnitud declarada del catálogo no dice — nunca
 * la misma cosa que ya puntúa `carga` o `habitabilidad` (requisito 1.3). */
export const TEST_DRIVE_JUDGEMENTS = [
  'posture',
  'noise',
  'visibility',
  'rearSeats',
  'boot',
] as const;
export type TestDriveJudgement = (typeof TEST_DRIVE_JUDGEMENTS)[number];

/** El rótulo legible de cada juicio (product/0037): mismo criterio que
 * `AXIS_LABELS` en `weights.ts` — vive en el dominio, no en `src/ui/`,
 * porque tanto el desglose del eje `prueba` (`scoring/axes/prueba.ts`,
 * dominio) como la hoja de visita (interfaz) necesitan el mismo texto, y
 * `src/ui/` no puede importar de `scoring/axes/` (regla
 * `ui-no-scoring-internals`). */
export const TEST_DRIVE_JUDGEMENT_LABELS: Record<TestDriveJudgement, string> = {
  posture: 'Postura al volante',
  noise: 'Ruido',
  visibility: 'Visibilidad',
  rearSeats: 'Plazas de atrás',
  boot: 'Maletero por dentro',
};

/** Lo que cada juicio pregunta, para la hoja de visita (product/0037,
 * requisito 5.2). Deliberadamente sin mencionar la magnitud del catálogo
 * que ya puntúa lo parecido — eso lo dice la hoja, no este texto, porque
 * necesita el valor concreto del coche que aquí no está disponible. */
export const TEST_DRIVE_JUDGEMENT_PROMPTS: Record<TestDriveJudgement, string> =
  {
    posture:
      'Asiento, volante, pedales, dónde caen los mandos, si se conduce cómodo a los diez minutos.',
    noise: 'Rodadura, aire y motor a velocidad de autovía.',
    visibility: 'Pilares, luneta, ángulos muertos, lo que se ve al maniobrar.',
    rearSeats:
      'Rodillas y cabeza de un adulto detrás de otro adulto, y si la plaza del medio existe de verdad.',
    boot: 'Forma, escalón de carga, hueco bajo el suelo, si el portón deja meter algo ancho.',
  };

export const TEST_DRIVE_RATING_MIN = 1;
export const TEST_DRIVE_RATING_MAX = 5;

/** El neutro declarado del ADR 0012: un juicio sin contestar puntúa como si
 * se hubiera contestado el punto medio de la escala. Es el mismo valor que
 * hace que un coche sin ninguna prueba saque exactamente la nota media del
 * eje (requisito 2.3). */
export const TEST_DRIVE_NEUTRAL_RATING = 3;

/** Los juicios contestados de una prueba. Un juicio ausente no es un cero:
 * es que no se ha contestado (requisito 1.6), y puntúa el neutro. */
export type TestDriveRatings = Partial<Record<TestDriveJudgement, number>>;

/** El motivo es opcional, igual que en `DecisionEntry` (requisito 1.4):
 * `undefined`, no una cadena vacía, cuando no se ha escrito nada. */
export interface TestDriveEntry {
  ratings: TestDriveRatings;
  notes?: string;
  date: string;
}

export interface TestDriveLog {
  version: number;
  entries: Record<string, TestDriveEntry>;
}

export function defaultTestDriveLog(): TestDriveLog {
  return { version: TEST_DRIVE_LOG_VERSION, entries: {} };
}

export function entryOf(
  log: TestDriveLog,
  carId: string,
): TestDriveEntry | undefined {
  return log.entries[carId];
}

/** Un coche está probado si tiene entrada en el registro, aunque sea parcial
 * —solo una nota, o un único juicio— (requisito 1.7): `undefined` es la
 * única lectura de «sin probar», con el mismo criterio que `undecided` en
 * `decisions.ts`. */
export function isTested(log: TestDriveLog, carId: string): boolean {
  return log.entries[carId] !== undefined;
}

/** El valor de un juicio, o el neutro declarado si no se ha contestado
 * (requisito 1.6, ADR 0012). */
export function judgementValue(
  entry: TestDriveEntry | undefined,
  judgement: TestDriveJudgement,
): number {
  return entry?.ratings[judgement] ?? TEST_DRIVE_NEUTRAL_RATING;
}

/** Cuántos de los cinco juicios están contestados (requisito 1.6: la
 * interfaz dice cuántos hay contestados). */
export function answeredCount(entry: TestDriveEntry | undefined): number {
  if (entry === undefined) return 0;
  return TEST_DRIVE_JUDGEMENTS.filter(
    (judgement) => entry.ratings[judgement] !== undefined,
  ).length;
}

/** La media de los cinco juicios, con el neutro relleno en los que falten
 * (requisito 2.2). Único punto de cálculo: `prueba.ts` no repite la fórmula
 * y la hoja de visita puede mostrar el mismo número que puntúa. */
export function averageRating(entry: TestDriveEntry | undefined): number {
  const sum = TEST_DRIVE_JUDGEMENTS.reduce(
    (total, judgement) => total + judgementValue(entry, judgement),
    0,
  );
  return sum / TEST_DRIVE_JUDGEMENTS.length;
}

export class InvalidTestDriveRatingError extends Error {}
export class InvalidTestDriveDateError extends Error {}

function isValidRating(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= TEST_DRIVE_RATING_MIN &&
    value <= TEST_DRIVE_RATING_MAX
  );
}

/** Comprueba que `date` no solo tiene forma `AAAA-MM-DD`, sino que nombra un
 * día real (requisito 1.8: «se valida como fecha real en el dominio») — a
 * diferencia de `DecisionDateSchema`, que solo comprueba la forma. */
function isRealDate(date: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (match === null) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * Fija un juicio (requisitos 1.1, 5.5). Pura: `today` la aporta quien
 * llama, con el mismo criterio con que `setDecision` recibe la fecha desde
 * fuera — el dominio no lee el reloj. Crea la entrada si no existía, con
 * `today` como fecha de partida; si ya existía, conserva su fecha y sus
 * otros juicios y su nota intactos.
 */
export function setJudgement(
  log: TestDriveLog,
  carId: string,
  judgement: TestDriveJudgement,
  value: number,
  today: string,
): TestDriveLog {
  if (!isValidRating(value)) {
    throw new InvalidTestDriveRatingError(
      `Juicio «${judgement}» inválido para «${carId}»: ${value} está fuera de 1-5`,
    );
  }
  const existing = log.entries[carId];
  const entry: TestDriveEntry = {
    ratings: { ...existing?.ratings, [judgement]: value },
    ...(existing?.notes !== undefined ? { notes: existing.notes } : {}),
    date: existing?.date ?? today,
  };
  return { ...log, entries: { ...log.entries, [carId]: entry } };
}

/** Deja un juicio sin contestar: vuelve a puntuar el neutro (requisito 1.6),
 * sin tocar los demás juicios, la nota ni la fecha. */
export function clearJudgement(
  log: TestDriveLog,
  carId: string,
  judgement: TestDriveJudgement,
): TestDriveLog {
  const existing = log.entries[carId];
  if (existing === undefined) return log;
  const { [judgement]: _removed, ...ratings } = existing.ratings;
  return {
    ...log,
    entries: { ...log.entries, [carId]: { ...existing, ratings } },
  };
}

/** Fija la nota en texto libre (requisito 1.4), opcional. Una cadena vacía
 * o solo espacios se guarda como «sin nota», igual que `setDecision` trata
 * un motivo en blanco. */
export function setNotes(
  log: TestDriveLog,
  carId: string,
  notes: string,
  today: string,
): TestDriveLog {
  const existing = log.entries[carId];
  const trimmed = notes.trim();
  const entry: TestDriveEntry = {
    ratings: existing?.ratings ?? {},
    ...(trimmed ? { notes: trimmed } : {}),
    date: existing?.date ?? today,
  };
  return { ...log, entries: { ...log.entries, [carId]: entry } };
}

/** Cambia la fecha de una prueba ya existente (requisito 1.8: es editable,
 * una visita se anota muchas veces esa noche y no en el mostrador). No crea
 * una entrada nueva: sin prueba que fechar, no hay nada que cambiar. */
export function setTestDriveDate(
  log: TestDriveLog,
  carId: string,
  date: string,
): TestDriveLog {
  if (!isRealDate(date)) {
    throw new InvalidTestDriveDateError(
      `Fecha inválida para «${carId}»: «${date}» no es un día real`,
    );
  }
  const existing = log.entries[carId];
  if (existing === undefined) return log;
  return {
    ...log,
    entries: { ...log.entries, [carId]: { ...existing, date } },
  };
}

const TestDriveDateSchema = z.string().refine(isRealDate);
const TestDriveNotesSchema = z.string().min(1);

/** Restaura los juicios uno a uno (requisito 3.3): un juicio fuera de 1-5 o
 * que no es número se descarta solo él, sin llevarse la prueba entera —a
 * diferencia de la fecha o la nota, que si fallan descartan toda la entrada
 * (ver `restoreEntry`)—. Una clave que no es uno de los cinco juicios se
 * ignora sin registro: no es un dato inválido, es un campo que este
 * registro no declara. */
function restoreRatings(carId: string, raw: unknown): TestDriveRatings {
  if (raw === undefined) return {};
  if (typeof raw !== 'object' || raw === null) {
    logError('test_drive_entry_discarded', {
      'car.id': carId,
      reason: 'ratings_not_an_object',
    });
    return {};
  }
  const record = raw as Record<string, unknown>;
  const ratings: TestDriveRatings = {};
  for (const judgement of TEST_DRIVE_JUDGEMENTS) {
    const value = record[judgement];
    if (value === undefined) continue;
    if (typeof value !== 'number' || !isValidRating(value)) {
      logError('test_drive_rating_discarded', {
        'car.id': carId,
        judgement,
        reason: 'invalid_rating',
      });
      continue;
    }
    ratings[judgement] = value;
  }
  return ratings;
}

function restoreEntry(carId: string, raw: unknown): TestDriveEntry | undefined {
  if (typeof raw !== 'object' || raw === null) {
    logError('test_drive_entry_discarded', {
      'car.id': carId,
      reason: 'not_an_object',
    });
    return undefined;
  }
  const record = raw as Record<string, unknown>;

  const date = TestDriveDateSchema.safeParse(record.date);
  if (!date.success) {
    logError('test_drive_entry_discarded', {
      'car.id': carId,
      reason: 'invalid_date',
    });
    return undefined;
  }

  const ratings = restoreRatings(carId, record.ratings);

  if (record.notes === undefined) {
    return { ratings, date: date.data };
  }
  const notes = TestDriveNotesSchema.safeParse(record.notes);
  if (!notes.success) {
    logError('test_drive_entry_discarded', {
      'car.id': carId,
      reason: 'invalid_notes',
    });
    return undefined;
  }
  return { ratings, notes: notes.data, date: date.data };
}

/** Igual criterio que `restoreEntries` en `decisions.ts`: ausente es `{}`
 * sin registro (requisito 3.3, «un campo ausente no es un descarte»);
 * presente pero de otro tipo se descarta entero con registro; una entrada
 * inválida se descarta sola, sin llevarse las demás; un `car.id` fuera del
 * catálogo vigente descarta su entrada. */
function restoreEntries(
  value: unknown,
  validCarIds: ReadonlySet<string>,
): Record<string, TestDriveEntry> {
  if (value === undefined) return {};
  if (typeof value !== 'object' || value === null) {
    logError('test_drive_log_discarded', { reason: 'entries_not_an_object' });
    return {};
  }

  const result: Record<string, TestDriveEntry> = {};
  for (const [carId, rawEntry] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!validCarIds.has(carId)) {
      logError('test_drive_entry_discarded', {
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

export interface RestoreTestDriveLogResult {
  testDriveLog: TestDriveLog;
  /** Verdadero cuando `raw` no era un objeto restaurable en absoluto — JSON
   * corrupto o versión desconocida—, igual que `RestoreDecisionLogResult`. */
  discardedEntirely: boolean;
}

/**
 * Restaura el registro de pruebas desde JSON ya parseado (`localStorage`),
 * con la misma degradación por partes que `restoreDecisionLog` y hasta el
 * juicio suelto (requisito 3.3). Ningún texto escrito por el usuario entra
 * nunca en un registro de `logError` (requisito 9.1): las funciones de
 * arriba solo registran `car.id` y el motivo del descarte, nunca el
 * contenido de `notes`.
 */
export function restoreTestDriveLog(
  raw: unknown,
  validCarIds: ReadonlySet<string>,
): RestoreTestDriveLogResult {
  const fallback = defaultTestDriveLog();

  if (typeof raw !== 'object' || raw === null) {
    logError('test_drive_log_discarded', { reason: 'not_an_object' });
    return { testDriveLog: fallback, discardedEntirely: true };
  }

  const record = raw as Record<string, unknown>;
  if (record.version !== TEST_DRIVE_LOG_VERSION) {
    logError('test_drive_log_discarded', {
      reason: 'unknown_version',
      'test_drive_log.version': String(record.version),
    });
    return { testDriveLog: fallback, discardedEntirely: true };
  }

  return {
    testDriveLog: {
      version: TEST_DRIVE_LOG_VERSION,
      entries: restoreEntries(record.entries, validCarIds),
    },
    discardedEntirely: false,
  };
}
