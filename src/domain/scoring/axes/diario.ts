import type { Car } from '../../car';
import type { GlobalAssumptions } from '../assumptions';
import { normalizeAll } from '../normalize';
import {
  inputDatumFrom,
  type AxisBreakdown,
  type PenaltyLine,
} from '../breakdown';
import { mustGet } from '../mustGet';

export function diarioFormula(assumptions: GlobalAssumptions): string {
  const ancho = assumptions.ponderacionAnchoDiario;
  const largo = 1 - ancho;
  return (
    `dificultad = ${ancho.toFixed(1)} × anchura + ${largo.toFixed(1)} × longitud; ` +
    'se normaliza invertida, menor dificultad = mejor puntuación.'
  );
}

export function diarioDificultad(
  car: Car,
  assumptions: GlobalAssumptions,
): number {
  const anchoPeso = assumptions.ponderacionAnchoDiario;
  const largoPeso = 1 - anchoPeso;
  return anchoPeso * car.widthMm.value + largoPeso * car.lengthMm.value;
}

const CARGA_PENALTY_POINTS = -1.5;

function cargaPenalty(car: Car, assumptions: GlobalAssumptions): PenaltyLine {
  const active = car.technology === 'EV' && !assumptions.cargaEnCasa;
  return {
    label: 'Sin punto de carga en casa',
    condition: 'Vehículo eléctrico y el usuario no tiene carga en casa',
    active,
    effect: active ? CARGA_PENALTY_POINTS : 0,
  };
}

export function buildDiarioBreakdown(
  cars: Car[],
  assumptions: GlobalAssumptions,
  weight: number,
): Map<string, AxisBreakdown> {
  const raw = cars.map((car) => ({
    carId: car.id,
    carName: car.name,
    value: diarioDificultad(car, assumptions),
  }));
  const normalizations = normalizeAll('menor-mejor', raw);
  const formula = diarioFormula(assumptions);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const normalization = mustGet(normalizations, car.id);
    const penalty = cargaPenalty(car, assumptions);
    const score = Math.min(
      10,
      Math.max(0, normalization.normalizedValue + penalty.effect),
    );
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
          value: `${assumptions.ponderacionAnchoDiario.toFixed(1)} / ${(1 - assumptions.ponderacionAnchoDiario).toFixed(1)}`,
        },
        {
          label: 'Carga en casa',
          value: assumptions.cargaEnCasa ? 'Sí' : 'No',
        },
      ],
      normalization,
      rawUnit: 'mm',
      rawScore: normalization.normalizedValue,
      penalties: [penalty],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
