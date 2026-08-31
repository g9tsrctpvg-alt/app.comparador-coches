import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildHabitabilidadBreakdown } from './habitabilidad';

function wheelbaseScale(
  breakdown: ReturnType<typeof buildHabitabilidadBreakdown>,
  id: string,
) {
  return breakdown.get(id)!.subcomponents!.find((s) => s.label === 'Batalla')!
    .scale!;
}

function shoulderScale(
  breakdown: ReturnType<typeof buildHabitabilidadBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'Anchura de hombros')!.scale!;
}

function withWheelbase(wheelbase: number, id = 'x') {
  const base = threeCarFixture[0]!;
  return {
    ...base,
    id,
    wheelbaseMm: { ...base.wheelbaseMm, value: wheelbase },
  };
}

function withShoulderWidth(width: number, id: string) {
  const base = threeCarFixture[0]!;
  return {
    ...base,
    id,
    rearShoulderWidthMm: { ...base.rearShoulderWidthMm, value: width },
  };
}

describe('buildHabitabilidadBreakdown', () => {
  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildHabitabilidadBreakdown(threeCarFixture, 4);
    const alone = buildHabitabilidadBreakdown([threeCarFixture[0]!], 4);
    expect(alone.get('kia-sportage-hev')!.score).toBe(
      withThree.get('kia-sportage-hev')!.score,
    );
  });

  it('scores 10 on wheelbase at and above 3200mm, and 0 at and below 2400mm', () => {
    const roomy = withWheelbase(3200, 'roomy');
    const cramped = withWheelbase(2400, 'cramped');
    const breakdown = buildHabitabilidadBreakdown([roomy, cramped], 4);
    expect(wheelbaseScale(breakdown, 'roomy').score).toBe(10);
    expect(wheelbaseScale(breakdown, 'cramped').score).toBe(0);
  });

  it('scores 10 on rear shoulder width at and above 1460mm, and 0 at and below 1260mm', () => {
    const breakdown = buildHabitabilidadBreakdown(
      [
        withShoulderWidth(1480, 'wide'),
        withShoulderWidth(1460, 'at-anchor'),
        withShoulderWidth(1260, 'at-bad'),
        withShoulderWidth(1240, 'narrow'),
      ],
      4,
    );
    expect(shoulderScale(breakdown, 'wide').score).toBe(10);
    expect(shoulderScale(breakdown, 'at-anchor').score).toBe(10);
    expect(shoulderScale(breakdown, 'at-bad').score).toBe(0);
    expect(shoulderScale(breakdown, 'narrow').score).toBe(0);
  });

  it('scores the rear shoulder width midpoint of 1360mm as 5', () => {
    const breakdown = buildHabitabilidadBreakdown(
      [withShoulderWidth(1360, 'mid')],
      4,
    );
    expect(shoulderScale(breakdown, 'mid').score).toBeCloseTo(5, 9);
  });

  it('weighs wheelbase and rear shoulder width equally, at a half each', () => {
    const base = threeCarFixture[0]!;
    const t1 = 0.2;
    const t2 = 0.6;
    const wheelbaseAt = (t: number) => 2400 + t * (3200 - 2400);
    const shoulderAt = (t: number) => 1260 + t * (1460 - 1260);

    const gapBetween = (pair: ReturnType<typeof buildHabitabilidadBreakdown>) =>
      pair.get(base.id)!.score - pair.get('other')!.score;

    const wheelbaseGap = gapBetween(
      buildHabitabilidadBreakdown(
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
      ),
    );
    const shoulderGap = gapBetween(
      buildHabitabilidadBreakdown(
        [
          {
            ...base,
            rearShoulderWidthMm: {
              ...base.rearShoulderWidthMm,
              value: shoulderAt(t1),
            },
          },
          {
            ...base,
            id: 'other',
            rearShoulderWidthMm: {
              ...base.rearShoulderWidthMm,
              value: shoulderAt(t2),
            },
          },
        ],
        1,
      ),
    );
    expect(shoulderGap / wheelbaseGap).toBeCloseTo(1, 6);
  });

  it('declares a formula: the axis no longer says it has none', () => {
    const breakdown = buildHabitabilidadBreakdown(threeCarFixture, 4);
    expect(breakdown.get('kia-sportage-hev')!.formulaDescription).toContain(
      'escala(batalla)',
    );
  });

  it('offers no editable rating', () => {
    const breakdown = buildHabitabilidadBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(
      sportage.subcomponents!.every((s) => s.editableRating === undefined),
    ).toBe(true);
  });

  it('shows both anchors and the resulting score for each magnitude, and names no model', () => {
    const breakdown = buildHabitabilidadBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    expect(wheelbaseScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 3200,
      badAnchor: 2400,
    });
    expect(shoulderScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 1460,
      badAnchor: 1260,
    });
    expect(
      sportage.subcomponents!.every((s) => s.normalization === undefined),
    ).toBe(true);
  });

  it('names the two magnitudes as inputs, each with their source', () => {
    const breakdown = buildHabitabilidadBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).toEqual([
      'Batalla',
      'Anchura de hombros',
    ]);
    expect(sportage.inputs.every((input) => input.sourceLabel !== '')).toBe(
      true,
    );
  });
});
