export type NormalizationDirection = 'mayor-mejor' | 'menor-mejor';

export interface ExtremeRef {
  carId: string;
  carName: string;
  value: number;
}

export interface Normalization {
  direction: NormalizationDirection;
  min: ExtremeRef;
  max: ExtremeRef;
  rawValue: number;
  normalizedValue: number;
}

export interface RawEntry {
  carId: string;
  carName: string;
  value: number;
}

export class EmptyCandidateSetError extends Error {}

/**
 * norm(v) = 10 × (v − min) / (max − min)  si mayor es mejor
 * norm(v) = 10 × (max − v) / (max − min)  si menor es mejor
 *
 * min y max se calculan sobre el conjunto de candidatos recibido, no en
 * abstracto: por eso la función siempre opera sobre el catálogo entero.
 */
export function normalizeAll(
  direction: NormalizationDirection,
  raw: RawEntry[],
): Map<string, Normalization> {
  if (raw.length === 0) {
    // Sin candidatos no hay mínimo ni máximo contra los que normalizar, y
    // toda puntuación de este proyecto es relativa al conjunto. Fallar aquí
    // y con nombre propio evita el `TypeError` opaco de `reduce`.
    throw new EmptyCandidateSetError(
      'No se puede normalizar contra un conjunto de candidatos vacío',
    );
  }

  const minEntry = raw.reduce((a, b) => (b.value < a.value ? b : a));
  const maxEntry = raw.reduce((a, b) => (b.value > a.value ? b : a));
  const min = minEntry.value;
  const max = maxEntry.value;
  const span = max - min;

  const result = new Map<string, Normalization>();
  for (const entry of raw) {
    // Empate total entre todos los candidatos: nadie se distingue, así que
    // a nadie se le da ventaja. 5 es el punto neutro de la escala 0-10.
    const normalizedValue =
      span === 0
        ? 5
        : direction === 'mayor-mejor'
          ? (10 * (entry.value - min)) / span
          : (10 * (max - entry.value)) / span;

    result.set(entry.carId, {
      direction,
      min: { carId: minEntry.carId, carName: minEntry.carName, value: min },
      max: { carId: maxEntry.carId, carName: maxEntry.carName, value: max },
      rawValue: entry.value,
      normalizedValue,
    });
  }
  return result;
}
