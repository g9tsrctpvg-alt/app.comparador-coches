import type { Car } from '../../car';
import { scoreOnAbsoluteScale } from '../scale';
import { inputDatumFrom, type AxisBreakdown } from '../breakdown';

// BMW i7 xDrive60 (81 cm, km77 mediciones propias) como techo real de
// mercado —el mismo modelo que ya ancla la batalla, con el Škoda Superb a
// un centímetro—; el suelo es el Toyota Aygo X Cross Play (59 cm), el más
// justo de los siete urbanos medidos al fijar la escala (product/0039).
const ESPACIO_PIERNAS_BUENO_MM = 810;
const ESPACIO_PIERNAS_MALO_MM = 590;
// Mercedes Clase E (146 cm, km77, «anchura hombros máxima») arriba; Kia
// Picanto (126 cm, km77, «anchura hombros mínima») abajo: los extremos del
// mercado, no de la gama comparada. Las dos filas no son la misma medida
// —km77 publica una u otra según el modelo, nunca las dos— y el catálogo
// hereda esa asimetría en vez de disimularla (product/0039, requisito 3.3).
const ANCHURA_HOMBROS_BUENA_MM = 1460;
const ANCHURA_HOMBROS_MALA_MM = 1260;

export const HABITABILIDAD_FORMULA =
  'nota = 0,5 × escala(espacio de piernas atrás) + 0,5 × escala(anchura de hombros). ' +
  `escala(espacio de piernas): 10 desde ${ESPACIO_PIERNAS_BUENO_MM} mm, 0 hasta ${ESPACIO_PIERNAS_MALO_MM} mm. ` +
  `escala(anchura de hombros): 10 desde ${ANCHURA_HOMBROS_BUENA_MM} mm, 0 hasta ${ANCHURA_HOMBROS_MALA_MM} mm. ` +
  'Pesan igual porque ninguna es mejor proxy que la otra del espacio de ' +
  'quien va detrás: una mide el sitio a lo largo y otra a lo ancho, y las ' +
  'dos se miden dentro del coche.';

/**
 * El espacio de los que van detrás (product/0033, product/0039): antes la
 * mitad de `viaje`, a un cuarto cada magnitud; desde product/0039 puntúa el
 * espacio de piernas medido dentro del coche —«Distancia del respaldo al
 * respaldo delantero», km77 mediciones propias— en vez de la batalla, que
 * solo lo insinuaba desde fuera. Se separa del maletero porque un cofre de
 * techo puede sustituir la capacidad de carga, y nada sustituye el sitio
 * para las piernas o los hombros.
 */
export function buildHabitabilidadBreakdown(
  cars: Car[],
  weight: number,
): Map<string, AxisBreakdown> {
  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const piernasScore = scoreOnAbsoluteScale(
      car.rearLegroomMm.value,
      ESPACIO_PIERNAS_BUENO_MM,
      ESPACIO_PIERNAS_MALO_MM,
    );
    const anchuraHombrosScore = scoreOnAbsoluteScale(
      car.rearShoulderWidthMm.value,
      ANCHURA_HOMBROS_BUENA_MM,
      ANCHURA_HOMBROS_MALA_MM,
    );
    const rawScore = 0.5 * piernasScore + 0.5 * anchuraHombrosScore;
    const score = Math.min(10, Math.max(0, rawScore));

    result.set(car.id, {
      axisId: 'habitabilidad',
      label: 'Espacio para los de atrás',
      formulaDescription: HABITABILIDAD_FORMULA,
      inputs: [
        inputDatumFrom('Espacio de piernas atrás', car.rearLegroomMm),
        inputDatumFrom('Anchura de hombros', car.rearShoulderWidthMm),
      ],
      assumptionsUsed: [],
      subcomponents: [
        {
          label: 'Espacio de piernas atrás',
          rawValue: car.rearLegroomMm.value,
          unit: 'mm',
          scale: {
            value: car.rearLegroomMm.value,
            goodAnchor: ESPACIO_PIERNAS_BUENO_MM,
            badAnchor: ESPACIO_PIERNAS_MALO_MM,
            score: piernasScore,
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
