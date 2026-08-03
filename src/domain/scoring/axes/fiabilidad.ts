import type { Car } from '../../car';
import { normalizeAll } from '../normalize';
import { inputDatumFrom, type AxisBreakdown } from '../breakdown';
import { mustGet } from '../mustGet';

export const FIABILIDAD_FORMULA =
  '0,7 × norm(índice de fiabilidad OCU) + 0,3 × norm(años de garantía).';

export function buildFiabilidadBreakdown(
  cars: Car[],
  weight: number,
): Map<string, AxisBreakdown> {
  const ocu = cars.map((car) => ({
    carId: car.id,
    carName: car.name,
    value: car.reliabilityOcu.value,
  }));
  const warranty = cars.map((car) => ({
    carId: car.id,
    carName: car.name,
    value: car.warrantyYears.value,
  }));
  const ocuNorm = normalizeAll('mayor-mejor', ocu);
  const warrantyNorm = normalizeAll('mayor-mejor', warranty);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const ocuNormalization = mustGet(ocuNorm, car.id);
    const warrantyNormalization = mustGet(warrantyNorm, car.id);
    const rawValue =
      0.7 * ocuNormalization.normalizedValue +
      0.3 * warrantyNormalization.normalizedValue;
    const score = Math.min(10, Math.max(0, rawValue));

    result.set(car.id, {
      axisId: 'fiabilidad',
      label: 'Fiabilidad y garantía',
      formulaDescription: FIABILIDAD_FORMULA,
      inputs: [
        inputDatumFrom('Índice de fiabilidad OCU', car.reliabilityOcu),
        inputDatumFrom('Años de garantía', car.warrantyYears),
      ],
      assumptionsUsed: [],
      subcomponents: [
        {
          label: 'Índice OCU',
          rawValue: ocuNormalization.rawValue,
          normalization: ocuNormalization,
        },
        {
          label: 'Años de garantía',
          rawValue: warrantyNormalization.rawValue,
          unit: 'años',
          normalization: warrantyNormalization,
        },
      ],
      rawScore: rawValue,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
