import { describe, expect, it } from 'vitest';
import {
  defaultDecisionLog,
  setDecision,
  setDecisionFilter,
} from '../../domain/decisions';
import { scoreCatalog } from '../../domain/scoring/score';
import { DEFAULT_WEIGHTS } from '../../domain/scoring/weights';
import { DEFAULT_ASSUMPTIONS } from '../../domain/scoring/assumptions';
import { threeCarFixture } from '../../domain/scoring/testFixtures';
import { rankVisible } from './ranking';

function scored() {
  return scoreCatalog(
    threeCarFixture,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    47000,
  );
}

describe('rankVisible with the decision filter (product/0030, requisitos 4.1 y 4.5)', () => {
  it('keeps every car when the filter is "all", same as before this spec', () => {
    const cars = scored();
    const visible = rankVisible(cars, false, defaultDecisionLog());
    expect(visible).toHaveLength(cars.length);
  });

  it('drops only the discarded car under "no-discarded"', () => {
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
    const visible = rankVisible(cars, false, log);
    expect(visible.map((c) => c.carId)).not.toContain('kia-sportage-hev');
    expect(visible).toHaveLength(cars.length - 1);
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
    const visible = rankVisible(cars, false, log);
    expect(visible.map((c) => c.carId)).toEqual(['kia-sportage-hev']);
  });

  it('combines with hideOverBudget: both criteria must pass (requisito 4.5)', () => {
    const cheapCars = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      40000,
    );
    const overBudget = cheapCars.filter((car) => car.overBudget);
    expect(overBudget.length).toBeGreaterThan(0);
    // Se descarta un coche que sí está dentro de presupuesto: solo debería
    // faltar por el filtro de presupuesto, no por el de decisión.
    const withinBudget = cheapCars.find((car) => !car.overBudget)!;
    const log = setDecision(
      defaultDecisionLog(),
      withinBudget.carId,
      'discarded',
      undefined,
      '2026-08-30',
    );
    const filteredLog = setDecisionFilter(log, 'no-discarded');

    const visible = rankVisible(cheapCars, true, filteredLog);
    const visibleIds = visible.map((c) => c.carId);
    for (const car of overBudget) {
      expect(visibleIds).not.toContain(car.carId);
    }
    expect(visibleIds).not.toContain(withinBudget.carId);
  });

  it('never changes the total of any car it keeps — filters, does not score (ADR 0004)', () => {
    const cars = scored();
    const log = setDecision(
      defaultDecisionLog(),
      'kia-sportage-hev',
      'discarded',
      undefined,
      '2026-08-30',
    );
    const visible = rankVisible(cars, false, log);
    for (const car of visible) {
      const original = cars.find((c) => c.carId === car.carId)!;
      expect(car.total).toBe(original.total);
    }
  });
});
