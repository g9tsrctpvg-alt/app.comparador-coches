import type { Car } from '../../car';
import { scoreOnAbsoluteScale } from '../scale';
import { inputDatumFrom, type AxisBreakdown } from '../breakdown';

// Skoda Superb: referencia generalista de "coche para viajar en familia".
// Por encima el problema deja de existir; por debajo hay un utilitario de
// ciudad donde el equipaje de cuatro personas ya no cabe.
const MALETERO_BUENO_L = 620;
const MALETERO_MALO_L = 250;
// Mismo Superb como techo; el suelo es donde el espacio para los de atrás
// ya no da ni para un ocupante ocasional.
const BATALLA_BUENA_MM = 2850;
const BATALLA_MALA_MM = 2400;
// Mismo Superb arriba (1.390 mm); abajo, el utilitario de ciudad donde tres
// atrás ya van agolpados —Sandero y Giulietta miden ambos 1.310 mm—. El
// recorrido es corto a propósito: entre un utilitario y un familiar grande
// esta medida varía poco, así que aporta matiz y no decide (ADR 0004).
const ANCHURA_HOMBROS_BUENA_MM = 1390;
const ANCHURA_HOMBROS_MALA_MM = 1310;

export const VIAJE_FORMULA =
  'nota = 0,5 × escala(maletero) + 0,25 × escala(batalla) + 0,25 × escala(anchura de hombros). ' +
  `escala(maletero): 10 desde ${MALETERO_BUENO_L} L, 0 hasta ${MALETERO_MALO_L} L. ` +
  `escala(batalla): 10 desde ${BATALLA_BUENA_MM} mm, 0 hasta ${BATALLA_MALA_MM} mm. ` +
  `escala(anchura de hombros): 10 desde ${ANCHURA_HOMBROS_BUENA_MM} mm, 0 hasta ${ANCHURA_HOMBROS_MALA_MM} mm. ` +
  'El maletero pesa más porque es la restricción que se incumple —el equipaje ' +
  'cabe o no cabe—; batalla y anchura de hombros miden el espacio de los que ' +
  'van atrás, a lo largo y a lo ancho, y ese espacio es gradual.';

export function buildViajeBreakdown(
  cars: Car[],
  weight: number,
): Map<string, AxisBreakdown> {
  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const maleteroScore = scoreOnAbsoluteScale(
      car.trunkLiters.value,
      MALETERO_BUENO_L,
      MALETERO_MALO_L,
    );
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
    const rawScore =
      0.5 * maleteroScore + 0.25 * batallaScore + 0.25 * anchuraHombrosScore;
    const score = Math.min(10, Math.max(0, rawScore));

    result.set(car.id, {
      axisId: 'viaje',
      label: 'Espacio y confort en viaje',
      formulaDescription: VIAJE_FORMULA,
      inputs: [
        inputDatumFrom('Maletero', car.trunkLiters),
        inputDatumFrom('Batalla', car.wheelbaseMm),
        inputDatumFrom('Anchura de hombros', car.rearShoulderWidthMm),
      ],
      assumptionsUsed: [],
      subcomponents: [
        {
          label: 'Maletero',
          rawValue: car.trunkLiters.value,
          unit: 'L',
          scale: {
            value: car.trunkLiters.value,
            goodAnchor: MALETERO_BUENO_L,
            badAnchor: MALETERO_MALO_L,
            score: maleteroScore,
          },
        },
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
