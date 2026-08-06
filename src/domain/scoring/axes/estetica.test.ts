import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS } from '../assumptions';
import { threeCarFixture } from '../testFixtures';
import { buildEsteticaBreakdown, esteticaNota } from './estetica';

function withRatings(exterior: number, interior: number, id = 'x') {
  const base = threeCarFixture[0]!;
  return {
    ...base,
    id,
    aestheticsExterior: { ...base.aestheticsExterior, value: exterior },
    aestheticsInterior: { ...base.aestheticsInterior, value: interior },
  };
}

describe('esteticaNota', () => {
  it('maps 1 to 0, 3 to 5 and 5 to 10, linearly', () => {
    expect(esteticaNota(1)).toBe(0);
    expect(esteticaNota(3)).toBe(5);
    expect(esteticaNota(5)).toBe(10);
  });

  it('is a straight line, not an S curve: equal steps give equal deltas', () => {
    const step1 = esteticaNota(2) - esteticaNota(1);
    const step2 = esteticaNota(4) - esteticaNota(3);
    expect(step1).toBeCloseTo(step2, 9);
  });
});

describe('buildEsteticaBreakdown', () => {
  it('scores a car rated 5/5 as 10', () => {
    const car = withRatings(5, 5);
    const breakdown = buildEsteticaBreakdown([car], DEFAULT_ASSUMPTIONS, 2);
    expect(breakdown.get('x')!.score).toBe(10);
  });

  it('scores a car rated 1/1 as 0', () => {
    const car = withRatings(1, 1);
    const breakdown = buildEsteticaBreakdown([car], DEFAULT_ASSUMPTIONS, 2);
    expect(breakdown.get('x')!.score).toBe(0);
  });

  it('scores a car rated 3/3 as 5', () => {
    const car = withRatings(3, 3);
    const breakdown = buildEsteticaBreakdown([car], DEFAULT_ASSUMPTIONS, 2);
    expect(breakdown.get('x')!.score).toBe(5);
  });

  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildEsteticaBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      2,
    );
    const alone = buildEsteticaBreakdown(
      [threeCarFixture[0]!],
      DEFAULT_ASSUMPTIONS,
      2,
    );
    expect(alone.get('kia-sportage-hev')!.score).toBe(
      withThree.get('kia-sportage-hev')!.score,
    );
  });

  it('gives every candidate the same non-neutral note when they all share a rating, and a different one for a different shared rating', () => {
    const ratedFour = [
      withRatings(4, 4, 'a'),
      withRatings(4, 4, 'b'),
      withRatings(4, 4, 'c'),
    ];
    const ratedTwo = [
      withRatings(2, 2, 'a'),
      withRatings(2, 2, 'b'),
      withRatings(2, 2, 'c'),
    ];
    const fourBreakdown = buildEsteticaBreakdown(
      ratedFour,
      DEFAULT_ASSUMPTIONS,
      2,
    );
    const twoBreakdown = buildEsteticaBreakdown(
      ratedTwo,
      DEFAULT_ASSUMPTIONS,
      2,
    );
    expect(fourBreakdown.get('a')!.score).toBe(7.5);
    expect(fourBreakdown.get('b')!.score).toBe(7.5);
    expect(fourBreakdown.get('c')!.score).toBe(7.5);
    expect(twoBreakdown.get('a')!.score).toBe(2.5);
    expect(fourBreakdown.get('a')!.score).not.toBe(
      twoBreakdown.get('a')!.score,
    );
  });

  it('shows both anchors and the resulting note for each rating, and names no model', () => {
    const breakdown = buildEsteticaBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      2,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    const exterior = sportage.subcomponents!.find(
      (s) => s.label === 'Nota exterior (tu valoración, editable)',
    )!;
    expect(exterior.scale).toMatchObject({ goodAnchor: 5, badAnchor: 1 });
    expect(
      sportage.subcomponents!.every((s) => s.normalization === undefined),
    ).toBe(true);
  });

  it('mixes exterior and interior with the declared mix', () => {
    const breakdown = buildEsteticaBreakdown(
      threeCarFixture,
      { ...DEFAULT_ASSUMPTIONS, mezclaEstetica: 0.6 },
      2,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    // Fixture: exterior 2 -> nota 2.5, interior 4 -> nota 7.5.
    expect(sportage.rawScore).toBeCloseTo(0.6 * 2.5 + 0.4 * 7.5, 9);
  });
});
