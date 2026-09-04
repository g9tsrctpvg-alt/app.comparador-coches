import { describe, expect, it } from 'vitest';
import { defaultTestDriveLog, setJudgement } from '../../testDrives';
import { threeCarFixture } from '../testFixtures';
import { buildPruebaBreakdown, pruebaNota } from './prueba';

describe('pruebaNota', () => {
  it('maps 1 to 0, 3 to 5 and 5 to 10, linearly', () => {
    expect(pruebaNota(1)).toBe(0);
    expect(pruebaNota(3)).toBe(5);
    expect(pruebaNota(5)).toBe(10);
  });

  it('is a straight line, not an S curve: equal steps give equal deltas', () => {
    const step1 = pruebaNota(2) - pruebaNota(1);
    const step2 = pruebaNota(4) - pruebaNota(3);
    expect(step1).toBeCloseTo(step2, 9);
  });
});

describe('buildPruebaBreakdown', () => {
  it('scores an untested car exactly 5.0, the ADR 0012 neutral (requisito 2.3)', () => {
    const breakdown = buildPruebaBreakdown(
      threeCarFixture,
      defaultTestDriveLog(),
      6,
    );
    for (const car of threeCarFixture) {
      expect(breakdown.get(car.id)!.score).toBe(5);
    }
  });

  it('scores exactly the same as an untested car when all five judgements are answered 3', () => {
    const carId = threeCarFixture[0]!.id;
    let log = defaultTestDriveLog();
    for (const judgement of [
      'posture',
      'noise',
      'visibility',
      'rearSeats',
      'boot',
    ] as const) {
      log = setJudgement(log, carId, judgement, 3, '2026-09-01');
    }
    const breakdown = buildPruebaBreakdown(threeCarFixture, log, 6);
    expect(breakdown.get(carId)!.score).toBe(5);
  });

  it('scores a partial entry as if the unanswered judgements were 3 (requisito 1.6)', () => {
    const carId = threeCarFixture[0]!.id;
    const log = setJudgement(
      defaultTestDriveLog(),
      carId,
      'posture',
      5,
      '2026-09-01',
    );
    // (5 + 3 + 3 + 3 + 3) / 5 = 3.4 -> (3.4 - 1) * 2.5 = 6
    const breakdown = buildPruebaBreakdown(threeCarFixture, log, 6);
    expect(breakdown.get(carId)!.score).toBe(6);
  });

  it('scores a car rated 5 on all five judgements as 10', () => {
    const carId = threeCarFixture[0]!.id;
    let log = defaultTestDriveLog();
    for (const judgement of [
      'posture',
      'noise',
      'visibility',
      'rearSeats',
      'boot',
    ] as const) {
      log = setJudgement(log, carId, judgement, 5, '2026-09-01');
    }
    const breakdown = buildPruebaBreakdown(threeCarFixture, log, 6);
    expect(breakdown.get(carId)!.score).toBe(10);
  });

  it('declares the neutral in `info` for an untested car, and leaves `info` empty for a tested one', () => {
    const carId = threeCarFixture[0]!.id;
    const log = setJudgement(
      defaultTestDriveLog(),
      carId,
      'posture',
      4,
      '2026-09-01',
    );
    const breakdown = buildPruebaBreakdown(threeCarFixture, log, 6);
    expect(breakdown.get(carId)!.info).toEqual([]);
    const untestedId = threeCarFixture[1]!.id;
    expect(breakdown.get(untestedId)!.info).toEqual([
      {
        label: 'Sin probar',
        value: 'Puntúa el neutro declarado (ADR 0012): 5,0 sobre 10',
      },
    ]);
  });

  it('has five subcomponents, none of them editable from the ranking', () => {
    const carId = threeCarFixture[0]!.id;
    const breakdown = buildPruebaBreakdown(
      threeCarFixture,
      defaultTestDriveLog(),
      6,
    );
    const subcomponents = breakdown.get(carId)!.subcomponents!;
    expect(subcomponents).toHaveLength(5);
    expect(subcomponents.every((s) => s.editableRating === undefined)).toBe(
      true,
    );
    expect(subcomponents.every((s) => s.rawValue === 3)).toBe(true);
  });

  it('sets weight and contribution from the given weight', () => {
    const breakdown = buildPruebaBreakdown(
      threeCarFixture,
      defaultTestDriveLog(),
      7,
    );
    const first = breakdown.get(threeCarFixture[0]!.id)!;
    expect(first.weight).toBe(7);
    expect(first.contribution).toBe(5 * 7);
  });

  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildPruebaBreakdown(
      threeCarFixture,
      defaultTestDriveLog(),
      6,
    );
    const alone = buildPruebaBreakdown(
      [threeCarFixture[0]!],
      defaultTestDriveLog(),
      6,
    );
    expect(alone.get(threeCarFixture[0]!.id)!.score).toBe(
      withThree.get(threeCarFixture[0]!.id)!.score,
    );
  });
});
