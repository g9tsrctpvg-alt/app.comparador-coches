import type { Car } from '../../car';
import {
  TEST_DRIVE_JUDGEMENTS,
  TEST_DRIVE_JUDGEMENT_LABELS,
  averageRating,
  entryOf,
  isTested,
  judgementValue,
  type TestDriveLog,
} from '../../testDrives';
import type { AssumptionEcho, AxisBreakdown } from '../breakdown';

// El 1-5 que da quien prueba el coche ya es su juicio completo, con el
// mismo criterio que `esteticaNota` (product/0004): comprimir los extremos
// otra vez con una curva en S los deformaría dos veces.
const NOTA_MALA_VALORACION = 1;
const NOTA_BUENA_VALORACION = 5;

export function pruebaNota(valoracion: number): number {
  return (valoracion - NOTA_MALA_VALORACION) * 2.5;
}

export function pruebaFormula(): string {
  return (
    'nota = (media(postura, ruido, visibilidad, plazas de atrás, maletero) − 1) × 2,5; ' +
    'lineal y sin curva en S, igual que la estética: un juicio sin contestar ' +
    'puntúa 3, el neutro declarado del ADR 0012.'
  );
}

function testDriveInfo(
  testDriveLog: TestDriveLog,
  carId: string,
): AssumptionEcho[] {
  if (isTested(testDriveLog, carId)) return [];
  return [
    {
      label: 'Sin probar',
      value: 'Puntúa el neutro declarado (ADR 0012): 5,0 sobre 10',
    },
  ];
}

/**
 * El octavo eje (product/0037): media de cinco juicios de quien ha probado
 * el coche, con el neutro declarado del ADR 0012 para lo que no se ha
 * contestado. Ningún subcomponente es `editableRating` (requisito 2.7): los
 * cinco se editan solo desde la hoja de visita.
 */
export function buildPruebaBreakdown(
  cars: Car[],
  testDriveLog: TestDriveLog,
  weight: number,
): Map<string, AxisBreakdown> {
  const formula = pruebaFormula();
  const result = new Map<string, AxisBreakdown>();

  for (const car of cars) {
    const entry = entryOf(testDriveLog, car.id);
    const average = averageRating(entry);
    const rawScore = pruebaNota(average);
    const score = Math.min(10, Math.max(0, rawScore));

    result.set(car.id, {
      axisId: 'prueba',
      label: 'Prueba real',
      formulaDescription: formula,
      inputs: [],
      assumptionsUsed: [],
      info: testDriveInfo(testDriveLog, car.id),
      subcomponents: TEST_DRIVE_JUDGEMENTS.map((judgement) => {
        const value = judgementValue(entry, judgement);
        return {
          label: TEST_DRIVE_JUDGEMENT_LABELS[judgement],
          rawValue: value,
          unit: '/5',
          scale: {
            value,
            goodAnchor: NOTA_BUENA_VALORACION,
            badAnchor: NOTA_MALA_VALORACION,
            score: pruebaNota(value),
          },
        };
      }),
      rawScore,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
