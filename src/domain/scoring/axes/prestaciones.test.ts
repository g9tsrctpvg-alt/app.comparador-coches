import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildPrestacionesBreakdown, cvPorTonelada } from './prestaciones';

describe('cvPorTonelada', () => {
  it('matches the documented case: the X1 has less CV/t than the Sportage', () => {
    const sportage = cvPorTonelada(threeCarFixture[0]!);
    const x1 = cvPorTonelada(threeCarFixture[1]!);
    expect(sportage).toBeCloseTo(147.53, 1);
    expect(x1).toBeCloseTo(126.94, 1);
    expect(x1).toBeLessThan(sportage);
  });
});

describe('buildPrestacionesBreakdown', () => {
  it('lets the X1 outscore the Sportage despite lower CV/t, because it accelerates faster', () => {
    const breakdown = buildPrestacionesBreakdown(threeCarFixture, 1);
    const sportage = breakdown.get('kia-sportage-hev')!;
    const x1 = breakdown.get('bmw-x1-xdrive25e')!;
    expect(x1.score).toBeGreaterThan(sportage.score);
  });

  it('normalizes each summand independently before combining them 50/50', () => {
    const breakdown = buildPrestacionesBreakdown(threeCarFixture, 1);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.subcomponents).toHaveLength(2);
    const [cvT, accel] = sportage.subcomponents!;
    expect(sportage.score).toBeCloseTo(
      0.5 * cvT!.normalization!.normalizedValue +
        0.5 * accel!.normalization!.normalizedValue,
      9,
    );
  });
});
