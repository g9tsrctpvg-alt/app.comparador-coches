import { describe, expect, it } from 'vitest';
import {
  defaultDecisionLog,
  setDecision,
  setDecisionFilter,
} from '../../domain/decisions';
import type { EliminatoryRule } from '../../domain/eliminatoryRules';
import { scoreCatalog } from '../../domain/scoring/score';
import { DEFAULT_WEIGHTS } from '../../domain/scoring/weights';
import { DEFAULT_ASSUMPTIONS } from '../../domain/scoring/assumptions';
import { threeCarFixture } from '../../domain/scoring/testFixtures';
import { splitByEligibility } from './ranking';

function scored() {
  return scoreCatalog(
    threeCarFixture,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    47000,
  );
}

describe('splitByEligibility with the decision filter (product/0030, requisitos 4.1 y 4.5)', () => {
  it('puts every car in the eligible tramo when the filter is "all" and there are no rules', () => {
    const cars = scored();
    const { eligible, ineligible } = splitByEligibility(
      cars,
      threeCarFixture,
      [],
      defaultDecisionLog(),
    );
    expect(eligible).toHaveLength(cars.length);
    expect(ineligible).toHaveLength(0);
  });

  it('drops only the discarded car under "no-discarded", from both tramos', () => {
    const cars = scored();
    const log = setDecisionFilter(
      setDecision(
        defaultDecisionLog(),
        'kia-sportage-hev',
        'discarded',
        undefined,
        '2026-08-30',
      ),
      'no-discarded',
    );
    const { eligible, ineligible } = splitByEligibility(
      cars,
      threeCarFixture,
      [],
      log,
    );
    const ids = [...eligible, ...ineligible.map((e) => e.car)].map(
      (c) => c.carId,
    );
    expect(ids).not.toContain('kia-sportage-hev');
    expect(ids).toHaveLength(cars.length - 1);
  });

  it('keeps only the shortlisted cars under "shortlist-only"', () => {
    const cars = scored();
    const log = setDecisionFilter(
      setDecision(
        defaultDecisionLog(),
        'kia-sportage-hev',
        'shortlist',
        undefined,
        '2026-08-30',
      ),
      'shortlist-only',
    );
    const { eligible, ineligible } = splitByEligibility(
      cars,
      threeCarFixture,
      [],
      log,
    );
    expect(eligible.map((c) => c.carId)).toEqual(['kia-sportage-hev']);
    expect(ineligible).toHaveLength(0);
  });
});

describe('splitByEligibility with the budget (product/0031, requisito 2.2)', () => {
  it('puts a car over budget in the ineligible tramo, marked overBudget', () => {
    const cheapCars = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      40000,
    );
    const { eligible, ineligible } = splitByEligibility(
      cheapCars,
      threeCarFixture,
      [],
      defaultDecisionLog(),
    );
    const overBudgetIds = cheapCars
      .filter((car) => car.overBudget)
      .map((car) => car.carId);
    expect(overBudgetIds.length).toBeGreaterThan(0);
    for (const id of overBudgetIds) {
      expect(eligible.map((c) => c.carId)).not.toContain(id);
      const entry = ineligible.find((e) => e.car.carId === id);
      expect(entry?.overBudget).toBe(true);
      expect(entry?.failures).toEqual([]);
    }
  });
});

describe('splitByEligibility with eliminatory rules (product/0031, requisitos 4.1-4.2)', () => {
  it('puts a car that fails a rule in the ineligible tramo, with the failure reported', () => {
    const cars = scored();
    // El Sportage tiene 4540 mm de longitud; el X1 4500; el EV3 4300.
    const rules: EliminatoryRule[] = [
      { field: 'lengthMm', operator: 'max', value: 4400 },
    ];
    const { eligible, ineligible } = splitByEligibility(
      cars,
      threeCarFixture,
      rules,
      defaultDecisionLog(),
    );
    expect(eligible.map((c) => c.carId)).toEqual(['kia-ev3']);
    const sportage = ineligible.find((e) => e.car.carId === 'kia-sportage-hev');
    expect(sportage?.overBudget).toBe(false);
    expect(sportage?.failures).toEqual([
      { field: 'lengthMm', operator: 'max', threshold: 4400, actual: 4540 },
    ]);
  });

  it('combines a rule and the budget on the same car: both reported', () => {
    const cheapCars = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      40000,
    );
    const rules: EliminatoryRule[] = [
      { field: 'lengthMm', operator: 'max', value: 4400 },
    ];
    const { ineligible } = splitByEligibility(
      cheapCars,
      threeCarFixture,
      rules,
      defaultDecisionLog(),
    );
    // El X1 (44.000 €) está fuera de presupuesto a 40.000 y su longitud
    // (4500 mm) también incumple la regla.
    const x1 = ineligible.find((e) => e.car.carId === 'bmw-x1-xdrive25e');
    expect(x1?.overBudget).toBe(true);
    expect(x1?.failures).toHaveLength(1);
  });

  it('a car missing the ruled field is not affected by that rule', () => {
    const cars = scored();
    // El Sportage (HEV) no declara electricRangeKm.
    const rules: EliminatoryRule[] = [
      { field: 'electricRangeKm', operator: 'min', value: 100 },
    ];
    const { eligible, ineligible } = splitByEligibility(
      cars,
      threeCarFixture,
      rules,
      defaultDecisionLog(),
    );
    expect(eligible.map((c) => c.carId)).toContain('kia-sportage-hev');
    // El X1 (83 km) sí declara el dato y sí incumple.
    expect(ineligible.some((e) => e.car.carId === 'bmw-x1-xdrive25e')).toBe(
      true,
    );
  });

  it('never changes the total of any car it keeps — filters, does not score (ADR 0004)', () => {
    const cars = scored();
    const rules: EliminatoryRule[] = [
      { field: 'lengthMm', operator: 'max', value: 4400 },
    ];
    const { eligible, ineligible } = splitByEligibility(
      cars,
      threeCarFixture,
      rules,
      defaultDecisionLog(),
    );
    for (const car of [...eligible, ...ineligible.map((e) => e.car)]) {
      const original = cars.find((c) => c.carId === car.carId)!;
      expect(car.total).toBe(original.total);
    }
  });

  it('sorts both tramos by total, best first', () => {
    const cars = scored();
    const rules: EliminatoryRule[] = [
      { field: 'lengthMm', operator: 'max', value: 100 }, // nadie cumple
    ];
    const { ineligible } = splitByEligibility(
      cars,
      threeCarFixture,
      rules,
      defaultDecisionLog(),
    );
    const totals = ineligible.map((e) => e.car.total);
    expect(totals).toEqual([...totals].sort((a, b) => b - a));
  });
});
