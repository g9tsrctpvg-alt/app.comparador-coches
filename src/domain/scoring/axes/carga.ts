import type { Car } from '../../car';
import { scoreOnAbsoluteScale } from '../scale';
import { inputDatumFrom, type AxisBreakdown } from '../breakdown';

// Skoda Kodiaq (910 L a 5 plazas): techo generalista del mercado. Fiat 500
// Hybrid (185 L): el suelo (product/0026).
const MALETERO_BUENO_L = 910;
const MALETERO_MALO_L = 185;

export const CARGA_FORMULA =
  'nota = escala(maletero). ' +
  `escala(maletero): 10 desde ${MALETERO_BUENO_L} L, 0 hasta ${MALETERO_MALO_L} L.`;

/**
 * Eje de un solo sumando (product/0033): hasta ahora el maletero pesaba el
 * doble que la batalla y la anchura de hombros dentro de `viaje` porque era
 * «la restricción que se incumple». Un cofre de techo derriba ese argumento
 * —la carga de viaje pasa a ser comprable— sin tocar el espacio de quien va
 * detrás, así que las dos magnitudes se separan en dos ejes con su propio
 * peso.
 */
export function buildCargaBreakdown(
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
    const score = Math.min(10, Math.max(0, maleteroScore));

    result.set(car.id, {
      axisId: 'carga',
      label: 'Capacidad de carga',
      formulaDescription: CARGA_FORMULA,
      inputs: [inputDatumFrom('Maletero', car.trunkLiters)],
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
      ],
      rawScore: maleteroScore,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
