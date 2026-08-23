import type { Car } from '../../car';
import { scoreOnAbsoluteScale } from '../scale';
import { inputDatumFrom, type AxisBreakdown } from '../breakdown';

// Tesla Model 3 Gran Autonomía 4WD (498 CV, 1.899 kg, 262,2 CV/t) arriba:
// una berlina de venta normal, no una versión de prestaciones. Dacia Sandero
// SCe 65 (67 CV, 1.012 kg, 66,2 CV/t) abajo: el coche más barato del mercado
// (product/0026).
const CVT_BUENO = 260;
const CVT_MALO = 65;
// Los mismos dos coches por los dos extremos de aceleración.
const ACCEL_BUENA_S = 4.4;
const ACCEL_MALA_S = 16.7;

export const PRESTACIONES_FORMULA =
  'nota = 0,5 × escala(CV/t) + 0,5 × escala(aceleración 0-100, invertida). ' +
  `escala(CV/t): 10 desde ${CVT_BUENO}, 0 hasta ${CVT_MALO}. ` +
  `escala(aceleración): 10 hasta ${ACCEL_BUENA_S} s, 0 desde ${ACCEL_MALA_S} s. ` +
  'CV/t ignora tracción y cambio, por eso se combina con la aceleración real. ' +
  'Ambas escalas son absolutas: no dependen de qué otros candidatos haya en el catálogo.';

export function cvPorTonelada(car: Car): number {
  return car.powerCv.value / (car.weightKg.value / 1000);
}

export function buildPrestacionesBreakdown(
  cars: Car[],
  weight: number,
): Map<string, AxisBreakdown> {
  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const cvT = cvPorTonelada(car);
    const cvTScore = scoreOnAbsoluteScale(cvT, CVT_BUENO, CVT_MALO);
    const accelScore = scoreOnAbsoluteScale(
      car.acceleration0to100.value,
      ACCEL_BUENA_S,
      ACCEL_MALA_S,
    );
    const rawScore = 0.5 * cvTScore + 0.5 * accelScore;
    const score = Math.min(10, Math.max(0, rawScore));

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
          rawValue: cvT,
          scale: {
            value: cvT,
            goodAnchor: CVT_BUENO,
            badAnchor: CVT_MALO,
            score: cvTScore,
          },
        },
        {
          label: 'Aceleración 0-100 km/h',
          rawValue: car.acceleration0to100.value,
          unit: 's',
          scale: {
            value: car.acceleration0to100.value,
            goodAnchor: ACCEL_BUENA_S,
            badAnchor: ACCEL_MALA_S,
            score: accelScore,
          },
        },
      ],
      rawScore,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
