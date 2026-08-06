import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildViajeBreakdown } from './viaje';

function trunkScale(
  breakdown: ReturnType<typeof buildViajeBreakdown>,
  id: string,
) {
  return breakdown.get(id)!.subcomponents!.find((s) => s.label === 'Maletero')!
    .scale!;
}

function wheelbaseScale(
  breakdown: ReturnType<typeof buildViajeBreakdown>,
  id: string,
) {
  return breakdown.get(id)!.subcomponents!.find((s) => s.label === 'Batalla')!
    .scale!;
}

function withTrunkAndWheelbase(trunk: number, wheelbase: number, id = 'x') {
  const base = threeCarFixture[0]!;
  return {
    ...base,
    id,
    trunkLiters: { ...base.trunkLiters, value: trunk },
    wheelbaseMm: { ...base.wheelbaseMm, value: wheelbase },
  };
}

describe('buildViajeBreakdown', () => {
  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildViajeBreakdown(threeCarFixture, 4);
    const alone = buildViajeBreakdown([threeCarFixture[0]!], 4);
    expect(alone.get('kia-sportage-hev')!.score).toBe(
      withThree.get('kia-sportage-hev')!.score,
    );
  });

  it('scores 10 on trunk at and above 620L, and 0 at and below 250L', () => {
    const roomy = withTrunkAndWheelbase(700, 2700, 'roomy');
    const atAnchor = withTrunkAndWheelbase(620, 2700, 'at-anchor');
    const cramped = withTrunkAndWheelbase(180, 2700, 'cramped');
    const atBad = withTrunkAndWheelbase(250, 2700, 'at-bad');
    const breakdown = buildViajeBreakdown([roomy, atAnchor, cramped, atBad], 4);
    expect(trunkScale(breakdown, 'roomy').score).toBe(10);
    expect(trunkScale(breakdown, 'at-anchor').score).toBe(10);
    expect(trunkScale(breakdown, 'cramped').score).toBe(0);
    expect(trunkScale(breakdown, 'at-bad').score).toBe(0);
  });

  it('scores 10 on wheelbase at and above 2850mm, and 0 at and below 2400mm', () => {
    const roomy = withTrunkAndWheelbase(500, 2850, 'roomy');
    const cramped = withTrunkAndWheelbase(500, 2400, 'cramped');
    const breakdown = buildViajeBreakdown([roomy, cramped], 4);
    expect(wheelbaseScale(breakdown, 'roomy').score).toBe(10);
    expect(wheelbaseScale(breakdown, 'cramped').score).toBe(0);
  });

  it('scores the trunk midpoint as 5, and 10% from the bad anchor as under 1: an S curve, not a line', () => {
    const midpoint = 250 + 0.5 * (620 - 250);
    const near10PctFromBad = 620 - 0.9 * (620 - 250);
    const breakdown = buildViajeBreakdown(
      [
        withTrunkAndWheelbase(midpoint, 2700, 'mid'),
        withTrunkAndWheelbase(near10PctFromBad, 2700, 'near-bad'),
      ],
      4,
    );
    expect(trunkScale(breakdown, 'mid').score).toBeCloseTo(5, 9);
    expect(trunkScale(breakdown, 'near-bad').score).toBeLessThan(1);
  });

  it('gives cars with the same trunk and different wheelbase different axis scores, in the declared 0.6/0.4 split', () => {
    const base = threeCarFixture[0]!;
    const t1 = 0.2;
    const t2 = 0.6;
    const trunkAt = (t: number) => 250 + t * (620 - 250);
    const wheelbaseAt = (t: number) => 2400 + t * (2850 - 2400);

    const withTrunkPair = buildViajeBreakdown(
      [
        { ...base, trunkLiters: { ...base.trunkLiters, value: trunkAt(t1) } },
        {
          ...base,
          id: 'other',
          trunkLiters: { ...base.trunkLiters, value: trunkAt(t2) },
        },
      ],
      1,
    );
    const withWheelbasePair = buildViajeBreakdown(
      [
        {
          ...base,
          wheelbaseMm: { ...base.wheelbaseMm, value: wheelbaseAt(t1) },
        },
        {
          ...base,
          id: 'other',
          wheelbaseMm: { ...base.wheelbaseMm, value: wheelbaseAt(t2) },
        },
      ],
      1,
    );
    const trunkGap =
      withTrunkPair.get(base.id)!.score - withTrunkPair.get('other')!.score;
    const wheelbaseGap =
      withWheelbasePair.get(base.id)!.score -
      withWheelbasePair.get('other')!.score;
    expect(trunkGap / wheelbaseGap).toBeCloseTo(0.6 / 0.4, 6);
  });

  it('declares a formula: the axis no longer says it has none', () => {
    const breakdown = buildViajeBreakdown(threeCarFixture, 4);
    expect(breakdown.get('kia-sportage-hev')!.formulaDescription).toContain(
      'escala(maletero)',
    );
  });

  it('offers no editable rating and mentions no travel-comfort subcomponent', () => {
    const breakdown = buildViajeBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(
      sportage.subcomponents!.every((s) => s.editableRating === undefined),
    ).toBe(true);
    expect(
      sportage.subcomponents!.some((s) =>
        s.label.toLowerCase().includes('viaje'),
      ),
    ).toBe(false);
  });

  it('shows both anchors and the resulting score for each magnitude, and names no model', () => {
    const breakdown = buildViajeBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    expect(trunkScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 620,
      badAnchor: 250,
    });
    expect(wheelbaseScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 2850,
      badAnchor: 2400,
    });
    expect(
      sportage.subcomponents!.every((s) => s.normalization === undefined),
    ).toBe(true);
  });

  it('names trunk and wheelbase as inputs, each with their source', () => {
    const breakdown = buildViajeBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).toEqual([
      'Maletero',
      'Batalla',
    ]);
  });
});
