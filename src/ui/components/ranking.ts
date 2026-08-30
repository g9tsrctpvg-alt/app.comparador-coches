import type { Car } from '../../domain/car';
import {
  decisionOf,
  passesDecisionFilter,
  type DecisionLog,
} from '../../domain/decisions';
import {
  evaluateRules,
  type EliminatoryRule,
  type RuleFailure,
} from '../../domain/eliminatoryRules';
import { numericFieldValues } from '../../domain/ficha';
import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';

/** Por qué un coche cae en el tramo no elegible (product/0031, requisito
 * 4.2): fuera de presupuesto, alguna regla incumplida, o las dos a la vez —
 * nunca ninguna, porque entonces estaría en el tramo elegible. */
export interface IneligibleCar {
  car: CarScoreBreakdown;
  overBudget: boolean;
  failures: RuleFailure[];
}

export interface EligibilitySplit {
  eligible: CarScoreBreakdown[];
  ineligible: IneligibleCar[];
}

const byTotalDesc = (a: CarScoreBreakdown, b: CarScoreBreakdown) =>
  b.total - a.total;

/**
 * Reparte los coches que pasan el filtro de decisión (product/0030) en dos
 * tramos: quién cumple presupuesto y todas las reglas eliminatorias
 * activas, y quién no (product/0031, requisitos 2.2 y 4.1-4.2). Los dos
 * tramos van ordenados por `total` descendente, igual que la clasificación
 * de siempre — filtra qué se ve, nunca qué se puntúa (ADR 0004).
 */
export function splitByEligibility(
  cars: CarScoreBreakdown[],
  rawCars: Car[],
  eliminatoryRules: EliminatoryRule[],
  decisionLog: DecisionLog,
): EligibilitySplit {
  const rawById = new Map(rawCars.map((car) => [car.id, car]));
  const eligible: CarScoreBreakdown[] = [];
  const ineligible: IneligibleCar[] = [];

  for (const car of cars) {
    if (
      !passesDecisionFilter(
        decisionOf(decisionLog, car.carId),
        decisionLog.filter,
      )
    ) {
      continue;
    }
    const rawCar = rawById.get(car.carId);
    const failures = rawCar
      ? evaluateRules(numericFieldValues(rawCar), eliminatoryRules)
      : [];
    if (!car.overBudget && failures.length === 0) {
      eligible.push(car);
    } else {
      ineligible.push({ car, overBudget: car.overBudget, failures });
    }
  }

  return {
    eligible: [...eligible].sort(byTotalDesc),
    ineligible: [...ineligible].sort((a, b) => byTotalDesc(a.car, b.car)),
  };
}
