import type { Car } from '../car';
import type { GlobalAssumptions } from './assumptions';
import { AXIS_ORDER, type AxisId, type AxisWeights } from './weights';
import type { AxisBreakdown, CarScoreBreakdown } from './breakdown';
import { mustGet } from './mustGet';
import { EmptyCandidateSetError } from './normalize';
import { buildViajeBreakdown } from './axes/viaje';
import { buildDiarioBreakdown } from './axes/diario';
import { buildPrestacionesBreakdown } from './axes/prestaciones';
import { buildFiabilidadBreakdown } from './axes/fiabilidad';
import { buildEsteticaBreakdown } from './axes/estetica';
import { buildCosteBreakdown } from './axes/coste';

/** `total` como porcentaje de `10 × Σ pesos`, el máximo posible con los
 * pesos vigentes. 0 en vez de `NaN` cuando la suma de pesos es 0: no hay
 * máximo que alcanzar, así que no hay nada que expresar como proporción. */
export function percentageOf(total: number, weights: AxisWeights): number {
  const weightSum = AXIS_ORDER.reduce((sum, id) => sum + weights[id], 0);
  if (weightSum === 0) return 0;
  return (total / (10 * weightSum)) * 100;
}

export function scoreCatalog(
  cars: Car[],
  weights: AxisWeights,
  assumptions: GlobalAssumptions,
  budgetEur: number,
): CarScoreBreakdown[] {
  if (cars.length === 0) {
    // Ya no hay ningún eje que normalice contra el conjunto de candidatos
    // (los seis están en escala absoluta), así que nada dentro de los ejes
    // falla por su cuenta con un catálogo vacío. La invariante — puntuar
    // sin candidatos no tiene sentido — sigue siendo cierta, así que se
    // declara aquí en vez de dejar de comprobarse.
    throw new EmptyCandidateSetError(
      'No se puede puntuar un conjunto de candidatos vacío',
    );
  }

  const byAxis: Record<AxisId, Map<string, AxisBreakdown>> = {
    viaje: buildViajeBreakdown(cars, weights.viaje),
    diario: buildDiarioBreakdown(cars, assumptions, weights.diario),
    prestaciones: buildPrestacionesBreakdown(cars, weights.prestaciones),
    fiabilidad: buildFiabilidadBreakdown(cars, weights.fiabilidad),
    estetica: buildEsteticaBreakdown(cars, assumptions, weights.estetica),
    coste: buildCosteBreakdown(cars, assumptions, weights.coste),
  };

  return cars.map((car) => {
    const axes = AXIS_ORDER.map((axisId) => mustGet(byAxis[axisId], car.id));
    const total = axes.reduce((sum, axis) => sum + axis.contribution, 0);
    return {
      carId: car.id,
      carName: car.name,
      overBudget: car.priceEur.value > budgetEur,
      axes,
      total,
      percentage: percentageOf(total, weights),
    };
  });
}
