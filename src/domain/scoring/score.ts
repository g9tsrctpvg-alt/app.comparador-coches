import type { Car } from '../car';
import { defaultTestDriveLog, type TestDriveLog } from '../testDrives';
import type { GlobalAssumptions } from './assumptions';
import { AXIS_ORDER, type AxisId, type AxisWeights } from './weights';
import type { AxisBreakdown, CarScoreBreakdown } from './breakdown';
import { mustGet } from './mustGet';
import { EmptyCandidateSetError } from './normalize';
import { buildCargaBreakdown } from './axes/carga';
import { buildHabitabilidadBreakdown } from './axes/habitabilidad';
import { buildDiarioBreakdown } from './axes/diario';
import { buildPrestacionesBreakdown } from './axes/prestaciones';
import { buildFiabilidadBreakdown } from './axes/fiabilidad';
import { buildEsteticaBreakdown } from './axes/estetica';
import { buildPruebaBreakdown } from './axes/prueba';
import { buildCosteBreakdown } from './axes/coste';

/** `total` como porcentaje de `10 × Σ pesos`, el máximo posible con los
 * pesos vigentes. 0 en vez de `NaN` cuando la suma de pesos es 0: no hay
 * máximo que alcanzar, así que no hay nada que expresar como proporción. */
export function percentageOf(total: number, weights: AxisWeights): number {
  const weightSum = AXIS_ORDER.reduce((sum, id) => sum + weights[id], 0);
  if (weightSum === 0) return 0;
  return (total / (10 * weightSum)) * 100;
}

/**
 * `testDriveLog` es la primera anotación del usuario que entra en la
 * puntuación (product/0037, requisito 2.8): a diferencia del estado de
 * decisión (`product/0030`) y de los imprescindibles (`product/0031`), que
 * dicen qué se ve, este dice qué se sabe del coche. Por defecto, «ninguna
 * prueba», para que el resto de llamadas —tests, snapshots— no tengan que
 * conocer un cuarto objeto persistido que no les importa.
 */
export function scoreCatalog(
  cars: Car[],
  weights: AxisWeights,
  assumptions: GlobalAssumptions,
  budgetEur: number,
  testDriveLog: TestDriveLog = defaultTestDriveLog(),
): CarScoreBreakdown[] {
  if (cars.length === 0) {
    // Ya no hay ningún eje que normalice contra el conjunto de candidatos
    // (los siete están en escala absoluta), así que nada dentro de los ejes
    // falla por su cuenta con un catálogo vacío. La invariante — puntuar
    // sin candidatos no tiene sentido — sigue siendo cierta, así que se
    // declara aquí en vez de dejar de comprobarse.
    throw new EmptyCandidateSetError(
      'No se puede puntuar un conjunto de candidatos vacío',
    );
  }

  const byAxis: Record<AxisId, Map<string, AxisBreakdown>> = {
    carga: buildCargaBreakdown(cars, weights.carga),
    habitabilidad: buildHabitabilidadBreakdown(cars, weights.habitabilidad),
    diario: buildDiarioBreakdown(cars, assumptions, weights.diario),
    prestaciones: buildPrestacionesBreakdown(cars, weights.prestaciones),
    fiabilidad: buildFiabilidadBreakdown(cars, weights.fiabilidad),
    estetica: buildEsteticaBreakdown(cars, assumptions, weights.estetica),
    prueba: buildPruebaBreakdown(cars, testDriveLog, weights.prueba),
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
