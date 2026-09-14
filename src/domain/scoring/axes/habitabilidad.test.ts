import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildHabitabilidadBreakdown } from './habitabilidad';

function legroomScale(
  breakdown: ReturnType<typeof buildHabitabilidadBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'Espacio de piernas atrás')!.scale!;
}

function shoulderScale(
  breakdown: ReturnType<typeof buildHabitabilidadBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'Anchura de hombros')!.scale!;
}

function withLegroom(legroom: number, id = 'x') {
  const base = threeCarFixture[0]!;
  return {
    ...base,
    id,
    rearLegroomMm: { ...base.rearLegroomMm, value: legroom },
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

  it('scores 10 on rear legroom at and above 810mm, and 0 at and below 590mm', () => {
    const roomy = withLegroom(810, 'roomy');
    const cramped = withLegroom(590, 'cramped');
    const breakdown = buildHabitabilidadBreakdown([roomy, cramped], 4);
    expect(legroomScale(breakdown, 'roomy').score).toBe(10);
    expect(legroomScale(breakdown, 'cramped').score).toBe(0);
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

  it('weighs rear legroom and rear shoulder width equally, at a half each', () => {
    const base = threeCarFixture[0]!;
    const t1 = 0.2;
    const t2 = 0.6;
    const legroomAt = (t: number) => 590 + t * (810 - 590);
    const shoulderAt = (t: number) => 1260 + t * (1460 - 1260);

    const gapBetween = (pair: ReturnType<typeof buildHabitabilidadBreakdown>) =>
      pair.get(base.id)!.score - pair.get('other')!.score;

    const legroomGap = gapBetween(
      buildHabitabilidadBreakdown(
        [
          {
            ...base,
            rearLegroomMm: { ...base.rearLegroomMm, value: legroomAt(t1) },
          },
          {
            ...base,
            id: 'other',
            rearLegroomMm: { ...base.rearLegroomMm, value: legroomAt(t2) },
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
    expect(shoulderGap / legroomGap).toBeCloseTo(1, 6);
  });

  it('declares a formula: the axis no longer says it has none', () => {
    const breakdown = buildHabitabilidadBreakdown(threeCarFixture, 4);
    expect(breakdown.get('kia-sportage-hev')!.formulaDescription).toContain(
      'escala(espacio de piernas atrás)',
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
    expect(legroomScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 810,
      badAnchor: 590,
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
      'Espacio de piernas atrás',
      'Anchura de hombros',
    ]);
    expect(sportage.inputs.every((input) => input.sourceLabel !== '')).toBe(
      true,
    );
  });
});
