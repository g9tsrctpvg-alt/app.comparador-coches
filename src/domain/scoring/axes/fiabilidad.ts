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
// 7 años (Kia, MG, Omoda, Jaecoo) es el techo real del mercado sin
// condiciones. El 0 va en 0 años, no en el mínimo legal de 3: quedarse en 3
// es una estrategia comercial, no una señal de que el coche se rompe.
const GARANTIA_BUENA_ANIOS = 7;
const GARANTIA_MALA_ANIOS = 0;

export const FIABILIDAD_FORMULA =
  'nota = 0,7 × escala(índice OCU) + 0,3 × escala(garantía incondicional). ' +
  `escala(OCU): 10 desde ${OCU_BUENO}, 0 hasta ${OCU_MALO} — extremos publicados por la OCU. ` +
  `escala(garantía): 10 desde ${GARANTIA_BUENA_ANIOS} años, 0 en ${GARANTIA_MALA_ANIOS}. ` +
  'Solo cuentan los años de garantía comercial incondicional: una extensión sujeta ' +
  'a mantenimiento en red oficial no suma a esta magnitud. El índice OCU es por ' +
  'marca, no por modelo — es el límite real del eje, y no lo arregla ninguna escala.';

function warrantyExtensionInfo(car: Car): AssumptionEcho[] {
  if (!car.warrantyExtension) return [];
  const ext = car.warrantyExtension;
  const kmPart = ext.kmLimit ? `, hasta ${ext.kmLimit.value} km` : '';
  return [
    {
      label: 'Extensión de garantía condicionada (no puntúa)',
      value: `${ext.years.value} años${kmPart} — ${ext.condition}`,
    },
  ];
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
    const warrantyScore = scoreOnAbsoluteScale(
      car.warrantyYears.value,
      GARANTIA_BUENA_ANIOS,
      GARANTIA_MALA_ANIOS,
    );
    const rawScore = 0.7 * ocuScore + 0.3 * warrantyScore;
    const score = Math.min(10, Math.max(0, rawScore));

    result.set(car.id, {
      axisId: 'fiabilidad',
      label: 'Fiabilidad y garantía',
      formulaDescription: FIABILIDAD_FORMULA,
      inputs: [
        inputDatumFrom('Índice de fiabilidad OCU', car.reliabilityOcu),
        inputDatumFrom('Años de garantía incondicional', car.warrantyYears),
      ],
      assumptionsUsed: [],
      info: warrantyExtensionInfo(car),
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
        {
          label: 'Años de garantía incondicional',
          rawValue: car.warrantyYears.value,
          unit: 'años',
          scale: {
            value: car.warrantyYears.value,
            goodAnchor: GARANTIA_BUENA_ANIOS,
            badAnchor: GARANTIA_MALA_ANIOS,
            score: warrantyScore,
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
