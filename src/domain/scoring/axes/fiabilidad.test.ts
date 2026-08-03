import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildFiabilidadBreakdown } from './fiabilidad';

describe('buildFiabilidadBreakdown', () => {
  it('combines OCU and warranty normalized independently, 0.7/0.3', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    const sportage = breakdown.get('kia-sportage-hev')!;
    const [ocu, warranty] = sportage.subcomponents!;
    expect(sportage.score).toBeCloseTo(
      0.7 * ocu!.normalization!.normalizedValue +
        0.3 * warranty!.normalization!.normalizedValue,
      9,
    );
  });

  it('scores the car with the worst OCU index and shortest warranty last', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    const x1 = breakdown.get('bmw-x1-xdrive25e')!;
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(x1.score).toBeLessThan(sportage.score);
  });

  it('sets the axis weight and derives the contribution from it', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.weight).toBe(2);
    expect(sportage.contribution).toBeCloseTo(sportage.score * 2, 9);
  });
});
