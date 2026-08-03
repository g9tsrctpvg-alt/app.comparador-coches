import type { Car } from '../../car';
import { normalizeAll } from '../normalize';
import { inputDatumFrom, type AxisBreakdown } from '../breakdown';
import { mustGet } from '../mustGet';

export const PRESTACIONES_FORMULA =
  '0,5 × norm(CV por tonelada) + 0,5 × norm(aceleración 0-100, invertida). ' +
  'CV/t ignora tracción y cambio, por eso se combina con la aceleración real.';

export function cvPorTonelada(car: Car): number {
  return car.powerCv.value / (car.weightKg.value / 1000);
}

export function buildPrestacionesBreakdown(
  cars: Car[],
  weight: number,
): Map<string, AxisBreakdown> {
  const cvT = cars.map((car) => ({
    carId: car.id,
    carName: car.name,
    value: cvPorTonelada(car),
  }));
  const accel = cars.map((car) => ({
    carId: car.id,
    carName: car.name,
    value: car.acceleration0to100.value,
  }));
  const cvTNorm = normalizeAll('mayor-mejor', cvT);
  const accelNorm = normalizeAll('menor-mejor', accel);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const cvTNormalization = mustGet(cvTNorm, car.id);
    const accelNormalization = mustGet(accelNorm, car.id);
    const rawValue =
      0.5 * cvTNormalization.normalizedValue +
      0.5 * accelNormalization.normalizedValue;
    const score = Math.min(10, Math.max(0, rawValue));

    result.set(car.id, {
      axisId: 'prestaciones',
      label: 'Prestaciones',
      formulaDescription: PRESTACIONES_FORMULA,
      inputs: [
        inputDatumFrom('Potencia', car.powerCv),
        inputDatumFrom('Peso', car.weightKg),
        inputDatumFrom('Aceleración 0-100 km/h', car.acceleration0to100),
      ],
      assumptionsUsed: [],
      subcomponents: [
        {
          label: 'CV por tonelada',
          rawValue: cvTNormalization.rawValue,
          normalization: cvTNormalization,
        },
        {
          label: 'Aceleración 0-100 km/h (invertida)',
          rawValue: accelNormalization.rawValue,
          unit: 's',
          normalization: accelNormalization,
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
