import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';

/** El mismo orden y filtro que ve la clasificación: por `total` descendente,
 * con los coches fuera de presupuesto fuera si así se ha pedido. Se
 * comparte entre `App` —para saber quién lidera antes de renderizar la
 * lista— y `RankingList`, para no calcularlo dos veces con dos criterios
 * que puedan desincronizarse. */
export function rankVisible(
  cars: CarScoreBreakdown[],
  hideOverBudget: boolean,
): CarScoreBreakdown[] {
  const visible = hideOverBudget ? cars.filter((car) => !car.overBudget) : cars;
  return [...visible].sort((a, b) => b.total - a.total);
}
