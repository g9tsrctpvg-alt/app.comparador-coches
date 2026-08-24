import { isPlugIn, type Car } from '../../car';
import type { GlobalAssumptions } from '../assumptions';
import { scoreOnAbsoluteScale } from '../scale';
import {
  inputDatumFrom,
  type AxisBreakdown,
  type PenaltyLine,
} from '../breakdown';

// Kia Picanto (1.595 mm): el suelo del mercado, nada más estrecho se vende
// como turismo (product/0026).
const ANCHURA_BUENO_MM = 1600;
// Techo real del mercado (Range Rover 2.003 mm, BMW X7 2.000 mm).
const ANCHURA_MALO_MM = 2000;
// Kia Picanto (3.605 mm): el turismo más corto a la venta.
const LONGITUD_BUENO_MM = 3600;
// BMW i7 (5.391 mm): el techo real del mercado, no la plaza de aparcamiento.
const LONGITUD_MALO_MM = 5400;

export function diarioFormula(assumptions: GlobalAssumptions): string {
  const ancho = assumptions.ponderacionAnchoDiario;
  const largo = 1 - ancho;
  return (
    `nota = ${ancho.toFixed(1)} × escala(anchura) + ${largo.toFixed(1)} × escala(longitud). ` +
    `escala(anchura): 10 hasta ${ANCHURA_BUENO_MM} mm, 0 desde ${ANCHURA_MALO_MM} mm. ` +
    `escala(longitud): 10 hasta ${LONGITUD_BUENO_MM} mm, 0 desde ${LONGITUD_MALO_MM} mm. ` +
    'Curva en S entre anclajes, absoluta: no depende de qué otros candidatos haya en el catálogo.'
  );
}

// El eléctrico pierde viabilidad sin enchufe en casa: la mitad de sus
// recargas pasa a depender de un punto público. El enchufable solo pierde
// comodidad —sigue moviéndose igual, sin gastar ni un euro más de gasolina
// de la que ya gastaría— así que su penalización es la mitad (product/0028).
const CARGA_PENALTY_POINTS_EV = -1.5;
const CARGA_PENALTY_POINTS_PHEV = -0.75;

function cargaPenalty(car: Car, assumptions: GlobalAssumptions): PenaltyLine {
  const points =
    car.technology === 'EV'
      ? CARGA_PENALTY_POINTS_EV
      : car.technology === 'PHEV'
        ? CARGA_PENALTY_POINTS_PHEV
        : 0;
  const active = isPlugIn(car) && !assumptions.cargaEnCasa;
  return {
    label: 'Sin punto de carga en casa',
    condition: 'Vehículo enchufable y el usuario no tiene carga en casa',
    active,
    effect: active ? points : 0,
  };
}

export function buildDiarioBreakdown(
  cars: Car[],
  assumptions: GlobalAssumptions,
  weight: number,
): Map<string, AxisBreakdown> {
  const ancho = assumptions.ponderacionAnchoDiario;
  const largo = 1 - ancho;
  const formula = diarioFormula(assumptions);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const anchuraScore = scoreOnAbsoluteScale(
      car.widthMm.value,
      ANCHURA_BUENO_MM,
      ANCHURA_MALO_MM,
    );
    const longitudScore = scoreOnAbsoluteScale(
      car.lengthMm.value,
      LONGITUD_BUENO_MM,
      LONGITUD_MALO_MM,
    );
    const rawScore = ancho * anchuraScore + largo * longitudScore;
    const penalty = cargaPenalty(car, assumptions);
    const score = Math.min(10, Math.max(0, rawScore + penalty.effect));

    result.set(car.id, {
      axisId: 'diario',
      label: 'Facilidad de uso diario',
      formulaDescription: formula,
      inputs: [
        inputDatumFrom('Anchura', car.widthMm),
        inputDatumFrom('Longitud', car.lengthMm),
      ],
      assumptionsUsed: [
        {
          label: 'Ponderación anchura/longitud',
          value: `${ancho.toFixed(1)} / ${largo.toFixed(1)}`,
        },
        {
          label: 'Carga en casa',
          value: assumptions.cargaEnCasa ? 'Sí' : 'No',
        },
      ],
      info: [
        {
          label: 'Penalización por carga en casa',
          value: isPlugIn(car)
            ? car.technology === 'EV'
              ? `Aplica: es un vehículo eléctrico, penalización ${CARGA_PENALTY_POINTS_EV.toFixed(2)}.`
              : `Aplica: es un híbrido enchufable, penalización ${CARGA_PENALTY_POINTS_PHEV.toFixed(2)} — la mitad que un eléctrico, porque sin enchufe pierde comodidad, no viabilidad.`
            : 'No aplica: no es un vehículo enchufable.',
        },
      ],
      subcomponents: [
        {
          label: 'Anchura',
          rawValue: car.widthMm.value,
          unit: 'mm',
          scale: {
            value: car.widthMm.value,
            goodAnchor: ANCHURA_BUENO_MM,
            badAnchor: ANCHURA_MALO_MM,
            score: anchuraScore,
          },
        },
        {
          label: 'Longitud',
          rawValue: car.lengthMm.value,
          unit: 'mm',
          scale: {
            value: car.lengthMm.value,
            goodAnchor: LONGITUD_BUENO_MM,
            badAnchor: LONGITUD_MALO_MM,
            score: longitudScore,
          },
        },
      ],
      rawScore,
      penalties: [penalty],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
