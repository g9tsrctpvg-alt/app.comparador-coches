import type { Car } from '../../car';
import { scoreOnAbsoluteScale } from '../scale';
import {
  inputDatumFrom,
  type AssumptionEcho,
  type AxisBreakdown,
} from '../breakdown';

// La OCU publica el índice de las 39 marcas; los extremos son Lexus (93) y
// Land Rover (64) — no hay que inventarlos, la escala es el mercado tal
// como se publica.
const OCU_BUENO = 93;
const OCU_MALO = 64;

export const FIABILIDAD_FORMULA =
  `nota = escala(índice OCU): 10 desde ${OCU_BUENO}, 0 hasta ${OCU_MALO} — ` +
  'extremos publicados por la OCU. El índice OCU es por marca, no por modelo ' +
  '— es el límite real del eje, y no lo arregla ninguna escala. ' +
  'Los años de garantía no puntúan (product/0041): son una señal de estrategia ' +
  'comercial, no de cuánto se avería el coche, y se muestran como información.';

/** Lo que el eje enseña y no puntúa (product/0041, requisito 3): los años de
 * garantía incondicional siempre, y la extensión condicionada cuando existe.
 * Los dos reciben el mismo trato porque miden lo mismo —qué debe el
 * fabricante—, que no es lo que mide este eje. */
function warrantyInfo(car: Car): AssumptionEcho[] {
  const info: AssumptionEcho[] = [
    {
      label: 'Garantía incondicional (no puntúa)',
      value: `${car.warrantyYears.value} años`,
    },
  ];
  if (car.warrantyExtension) {
    const ext = car.warrantyExtension;
    const kmPart = ext.kmLimit ? `, hasta ${ext.kmLimit.value} km` : '';
    info.push({
      label: 'Extensión de garantía condicionada (no puntúa)',
      value: `${ext.years.value} años${kmPart} — ${ext.condition}`,
    });
  }
  return info;
}

export function buildFiabilidadBreakdown(
  cars: Car[],
  weight: number,
): Map<string, AxisBreakdown> {
  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const ocuScore = scoreOnAbsoluteScale(
      car.reliabilityOcu.value,
      OCU_BUENO,
      OCU_MALO,
    );
    const rawScore = ocuScore;
    const score = Math.min(10, Math.max(0, rawScore));

    result.set(car.id, {
      axisId: 'fiabilidad',
      label: 'Fiabilidad',
      formulaDescription: FIABILIDAD_FORMULA,
      inputs: [inputDatumFrom('Índice de fiabilidad OCU', car.reliabilityOcu)],
      assumptionsUsed: [],
      info: warrantyInfo(car),
      subcomponents: [
        {
          label: 'Índice OCU',
          rawValue: car.reliabilityOcu.value,
          scale: {
            value: car.reliabilityOcu.value,
            goodAnchor: OCU_BUENO,
            badAnchor: OCU_MALO,
            score: ocuScore,
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
