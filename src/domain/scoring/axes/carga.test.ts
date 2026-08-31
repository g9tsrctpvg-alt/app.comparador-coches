import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildCargaBreakdown } from './carga';

function trunkScale(
  breakdown: ReturnType<typeof buildCargaBreakdown>,
  id: string,
) {
  return breakdown.get(id)!.subcomponents!.find((s) => s.label === 'Maletero')!
    .scale!;
}

function withTrunk(trunk: number, id = 'x') {
  const base = threeCarFixture[0]!;
  return {
    ...base,
    id,
    trunkLiters: { ...base.trunkLiters, value: trunk },
  };
}

describe('buildCargaBreakdown', () => {
  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildCargaBreakdown(threeCarFixture, 4);
    const alone = buildCargaBreakdown([threeCarFixture[0]!], 4);
    expect(alone.get('kia-sportage-hev')!.score).toBe(
      withThree.get('kia-sportage-hev')!.score,
    );
  });

  it('scores 10 on trunk at and above 910L, and 0 at and below 185L', () => {
    const roomy = withTrunk(950, 'roomy');
    const atAnchor = withTrunk(910, 'at-anchor');
    const cramped = withTrunk(150, 'cramped');
    const atBad = withTrunk(185, 'at-bad');
    const breakdown = buildCargaBreakdown([roomy, atAnchor, cramped, atBad], 4);
    expect(trunkScale(breakdown, 'roomy').score).toBe(10);
    expect(trunkScale(breakdown, 'at-anchor').score).toBe(10);
    expect(trunkScale(breakdown, 'cramped').score).toBe(0);
    expect(trunkScale(breakdown, 'at-bad').score).toBe(0);
  });

  it('scores the trunk midpoint as 5, and 10% from the bad anchor as under 1: an S curve, not a line', () => {
    const midpoint = 185 + 0.5 * (910 - 185);
    const near10PctFromBad = 910 - 0.9 * (910 - 185);
    const breakdown = buildCargaBreakdown(
      [withTrunk(midpoint, 'mid'), withTrunk(near10PctFromBad, 'near-bad')],
      4,
    );
    expect(trunkScale(breakdown, 'mid').score).toBeCloseTo(5, 9);
    expect(trunkScale(breakdown, 'near-bad').score).toBeLessThan(1);
  });

  it('declares a formula with a single magnitude', () => {
    const breakdown = buildCargaBreakdown(threeCarFixture, 4);
    expect(breakdown.get('kia-sportage-hev')!.formulaDescription).toContain(
      'escala(maletero)',
    );
  });

  it('has a single subcomponent, unlike axes that combine magnitudes', () => {
    const breakdown = buildCargaBreakdown(threeCarFixture, 4);
    expect(breakdown.get('kia-sportage-hev')!.subcomponents).toHaveLength(1);
  });

  it('shows both anchors and the resulting score, and names no model', () => {
    const breakdown = buildCargaBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    expect(trunkScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 910,
      badAnchor: 185,
    });
    expect(
      sportage.subcomponents!.every((s) => s.normalization === undefined),
    ).toBe(true);
  });

  it('names the trunk as the only input, with its source', () => {
    const breakdown = buildCargaBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).toEqual(['Maletero']);
    expect(sportage.inputs.every((input) => input.sourceLabel !== '')).toBe(
      true,
    );
  });
});
