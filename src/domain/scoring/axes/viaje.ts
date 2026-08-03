import type { Car } from '../../car';
import { normalizeAll } from '../normalize';
import type { AxisBreakdown } from '../breakdown';
import { mustGet } from '../mustGet';

export const VIAJE_FORMULA =
  'Sin fórmula: es un juicio subjetivo sobre espacio y confort en viaje, ' +
  'editable por ti para cada modelo (1-5), y luego normalizado contra el ' +
  'resto de candidatos. Objetivarlo queda fuera del alcance de esta spec.';

export function buildViajeBreakdown(
  cars: Car[],
  weight: number,
): Map<string, AxisBreakdown> {
  const raw = cars.map((car) => ({
    carId: car.id,
    carName: car.name,
    value: car.travelComfort.value,
  }));
  const normalizations = normalizeAll('mayor-mejor', raw);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const normalization = mustGet(normalizations, car.id);
    const score = Math.min(10, Math.max(0, normalization.normalizedValue));

    result.set(car.id, {
      axisId: 'viaje',
      label: 'Espacio y confort en viaje',
      formulaDescription: VIAJE_FORMULA,
      inputs: [],
      assumptionsUsed: [],
      subcomponents: [
        {
          label: 'Tu valoración (editable)',
          rawValue: car.travelComfort.value,
          unit: '/5',
          editableRating: 'travelComfort',
        },
      ],
      normalization,
      rawUnit: '/5',
      rawScore: normalization.normalizedValue,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
