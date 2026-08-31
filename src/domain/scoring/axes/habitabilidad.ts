import type { Car } from '../../car';
import { scoreOnAbsoluteScale } from '../scale';
import { inputDatumFrom, type AxisBreakdown } from '../breakdown';

// BMW i7 (3.215 mm) como techo real de mercado; el suelo es exactamente la
// batalla del Kia Picanto (2.400 mm), que ya lo era.
const BATALLA_BUENA_MM = 3200;
const BATALLA_MALA_MM = 2400;
// Mercedes Clase E (146 cm, km77) arriba; Kia Picanto (126 cm, km77) abajo:
// los extremos del mercado, no de la gama comparada.
const ANCHURA_HOMBROS_BUENA_MM = 1460;
const ANCHURA_HOMBROS_MALA_MM = 1260;

export const HABITABILIDAD_FORMULA =
  'nota = 0,5 × escala(batalla) + 0,5 × escala(anchura de hombros). ' +
  `escala(batalla): 10 desde ${BATALLA_BUENA_MM} mm, 0 hasta ${BATALLA_MALA_MM} mm. ` +
  `escala(anchura de hombros): 10 desde ${ANCHURA_HOMBROS_BUENA_MM} mm, 0 hasta ${ANCHURA_HOMBROS_MALA_MM} mm. ` +
  'Pesan igual porque ninguna es mejor proxy que la otra del espacio de ' +
  'quien va detrás: la batalla reparte entre habitáculo y vanos, la ' +
  'anchura de hombros se mide dentro del habitáculo pero solo a una altura.';

/**
 * El espacio de los que van detrás (product/0033): antes la mitad de
 * `viaje`, a un cuarto cada magnitud. Se separa del maletero porque un
 * cofre de techo puede sustituir la capacidad de carga, y nada sustituye el
 * sitio para las piernas o los hombros.
 */
export function buildHabitabilidadBreakdown(
  cars: Car[],
  weight: number,
): Map<string, AxisBreakdown> {
  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const batallaScore = scoreOnAbsoluteScale(
      car.wheelbaseMm.value,
      BATALLA_BUENA_MM,
      BATALLA_MALA_MM,
    );
    const anchuraHombrosScore = scoreOnAbsoluteScale(
      car.rearShoulderWidthMm.value,
      ANCHURA_HOMBROS_BUENA_MM,
      ANCHURA_HOMBROS_MALA_MM,
    );
    const rawScore = 0.5 * batallaScore + 0.5 * anchuraHombrosScore;
    const score = Math.min(10, Math.max(0, rawScore));

    result.set(car.id, {
      axisId: 'habitabilidad',
      label: 'Espacio para los de atrás',
      formulaDescription: HABITABILIDAD_FORMULA,
      inputs: [
        inputDatumFrom('Batalla', car.wheelbaseMm),
        inputDatumFrom('Anchura de hombros', car.rearShoulderWidthMm),
      ],
      assumptionsUsed: [],
      subcomponents: [
        {
          label: 'Batalla',
          rawValue: car.wheelbaseMm.value,
          unit: 'mm',
          scale: {
            value: car.wheelbaseMm.value,
            goodAnchor: BATALLA_BUENA_MM,
            badAnchor: BATALLA_MALA_MM,
            score: batallaScore,
          },
        },
        {
          label: 'Anchura de hombros',
          rawValue: car.rearShoulderWidthMm.value,
          unit: 'mm',
          scale: {
            value: car.rearShoulderWidthMm.value,
            goodAnchor: ANCHURA_HOMBROS_BUENA_MM,
            badAnchor: ANCHURA_HOMBROS_MALA_MM,
            score: anchuraHombrosScore,
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
