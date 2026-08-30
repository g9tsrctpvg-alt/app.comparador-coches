import {
  decisionOf,
  passesDecisionFilter,
  type DecisionLog,
} from '../../domain/decisions';
import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';

/** El mismo orden y filtro que ve la clasificación: por `total` descendente,
 * con los coches fuera de presupuesto fuera si así se ha pedido, y con el
 * filtro de decisión aplicado a la vez (product/0030, requisitos 4.1 y
 * 4.5) — el propio `decisionLog.filter`, no un segundo parámetro, porque el
 * filtro se guarda junto a las decisiones (requisito 4.2). Se comparte
 * entre `App` —para saber quién lidera antes de renderizar la lista— y
 * `RankingList`, para no calcularlo dos veces con dos criterios que puedan
 * desincronizarse. Filtra **después** de puntuar: ninguno de los dos
 * criterios toca `total` (ADR 0004, product/0030, dependencias). */
export function rankVisible(
  cars: CarScoreBreakdown[],
  hideOverBudget: boolean,
  decisionLog: DecisionLog,
): CarScoreBreakdown[] {
  const visible = cars.filter((car) => {
    if (hideOverBudget && car.overBudget) return false;
    return passesDecisionFilter(
      decisionOf(decisionLog, car.carId),
      decisionLog.filter,
    );
  });
  return [...visible].sort((a, b) => b.total - a.total);
}
