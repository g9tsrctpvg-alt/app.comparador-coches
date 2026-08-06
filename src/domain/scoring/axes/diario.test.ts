import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS } from '../assumptions';
import { threeCarFixture } from '../testFixtures';
import { buildDiarioBreakdown } from './diario';

function widthScale(
  breakdown: ReturnType<typeof buildDiarioBreakdown>,
  id: string,
) {
  return breakdown.get(id)!.subcomponents!.find((s) => s.label === 'Anchura')!
    .scale!;
}

function lengthScale(
  breakdown: ReturnType<typeof buildDiarioBreakdown>,
  id: string,
) {
  return breakdown.get(id)!.subcomponents!.find((s) => s.label === 'Longitud')!
    .scale!;
}

describe('buildDiarioBreakdown', () => {
  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildDiarioBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      3,
    );
    const alone = buildDiarioBreakdown(
      [threeCarFixture[0]!],
      DEFAULT_ASSUMPTIONS,
      3,
    );
    expect(alone.get('kia-sportage-hev')!.score).toBe(
      withThree.get('kia-sportage-hev')!.score,
    );
  });

  it('scores 10 on width at and below the good anchor', () => {
    const breakdown = buildDiarioBreakdown(
      [
        {
          ...threeCarFixture[0]!,
          widthMm: { ...threeCarFixture[0]!.widthMm, value: 1765 },
        },
        {
          ...threeCarFixture[1]!,
          widthMm: { ...threeCarFixture[1]!.widthMm, value: 1663 },
        },
      ],
      DEFAULT_ASSUMPTIONS,
      3,
    );
    expect(widthScale(breakdown, 'kia-sportage-hev').score).toBe(10);
    expect(widthScale(breakdown, 'bmw-x1-xdrive25e').score).toBe(10);
  });

  it('scores 0 on width at and above the bad anchor', () => {
    const breakdown = buildDiarioBreakdown(
      [
        {
          ...threeCarFixture[0]!,
          widthMm: { ...threeCarFixture[0]!.widthMm, value: 2000 },
        },
        {
          ...threeCarFixture[1]!,
          widthMm: { ...threeCarFixture[1]!.widthMm, value: 2010 },
        },
      ],
      DEFAULT_ASSUMPTIONS,
      3,
    );
    expect(widthScale(breakdown, 'kia-sportage-hev').score).toBe(0);
    expect(widthScale(breakdown, 'bmw-x1-xdrive25e').score).toBe(0);
  });

  it('scores width at the midpoint as 5, and 10% from the bad anchor as under 1: an S curve, not a line', () => {
    const midpoint = 1765 + 0.5 * (2000 - 1765);
    const near10PctFromBad = 2000 - 0.1 * (2000 - 1765);
    const breakdown = buildDiarioBreakdown(
      [
        {
          ...threeCarFixture[0]!,
          widthMm: { ...threeCarFixture[0]!.widthMm, value: midpoint },
        },
        {
          ...threeCarFixture[1]!,
          widthMm: { ...threeCarFixture[1]!.widthMm, value: near10PctFromBad },
        },
      ],
      DEFAULT_ASSUMPTIONS,
      3,
    );
    expect(widthScale(breakdown, 'kia-sportage-hev').score).toBeCloseTo(5, 9);
    expect(widthScale(breakdown, 'bmw-x1-xdrive25e').score).toBeLessThan(1);
  });

  it('separates two cars differing only in width more than two differing only in length, in the declared weight ratio', () => {
    const base = threeCarFixture[0]!;
    // Misma fracción de recorrido (t1 vs t2) en cada escala: así la
    // diferencia de nota S(t1)-S(t2) es idéntica en ambos casos y el único
    // factor que puede cambiar el resultado es el peso 0,6/0,4.
    const t1 = 0.2;
    const t2 = 0.6;
    const widthAt = (t: number) => 1765 + t * (2000 - 1765);
    const lengthAt = (t: number) => 4000 + t * (5200 - 4000);

    const withWidthPair = buildDiarioBreakdown(
      [
        { ...base, widthMm: { ...base.widthMm, value: widthAt(t1) } },
        {
          ...base,
          id: 'other',
          widthMm: { ...base.widthMm, value: widthAt(t2) },
        },
      ],
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const withLengthPair = buildDiarioBreakdown(
      [
        { ...base, lengthMm: { ...base.lengthMm, value: lengthAt(t1) } },
        {
          ...base,
          id: 'other',
          lengthMm: { ...base.lengthMm, value: lengthAt(t2) },
        },
      ],
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const widthGap =
      withWidthPair.get(base.id)!.score - withWidthPair.get('other')!.score;
    const lengthGap =
      withLengthPair.get(base.id)!.score - withLengthPair.get('other')!.score;
    expect(widthGap / lengthGap).toBeCloseTo(0.6 / 0.4, 6);
  });

  it('gives the EV without home charging the penalty as its own line, capped at 0', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      3,
    );
    const ev3 = breakdown.get('kia-ev3')!;
    expect(ev3.penalties[0]!.active).toBe(true);
    expect(ev3.penalties[0]!.effect).toBe(-1.5);
  });

  it('does not penalize a non-electric car regardless of home charging', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      3,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.penalties[0]!.active).toBe(false);
    expect(sportage.score).toBe(sportage.rawScore);
  });

  it('lifts the penalty when the assumption says there is home charging', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      { ...DEFAULT_ASSUMPTIONS, cargaEnCasa: true },
      3,
    );
    const ev3 = breakdown.get('kia-ev3')!;
    expect(ev3.penalties[0]!.active).toBe(false);
  });

  it('shows both anchors and the resulting score for each magnitude, and names no model', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      3,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    const width = widthScale(breakdown, 'kia-sportage-hev');
    const length = lengthScale(breakdown, 'kia-sportage-hev');
    expect(width).toMatchObject({ goodAnchor: 1765, badAnchor: 2000 });
    expect(length).toMatchObject({ goodAnchor: 4000, badAnchor: 5200 });
    expect(
      sportage.subcomponents!.every((s) => s.normalization === undefined),
    ).toBe(true);
  });

  it('names width and length as inputs, each with their source', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      3,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).toEqual([
      'Anchura',
      'Longitud',
    ]);
  });

  it('declares that the home-charging penalty only applies to electric cars, active or not (product/0008)', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      3,
    );
    const ev3 = breakdown.get('kia-ev3')!; // eléctrico, penalización activa
    const sportage = breakdown.get('kia-sportage-hev')!; // no eléctrico

    expect(ev3.info).toHaveLength(1);
    expect(ev3.info![0]!.value).toContain('Aplica');
    expect(sportage.info).toHaveLength(1);
    expect(sportage.info![0]!.value).toContain('No aplica');
  });
});
