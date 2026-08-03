import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS } from '../assumptions';
import { threeCarFixture } from '../testFixtures';
import { buildEsteticaBreakdown, esteticaCompuesta } from './estetica';

describe('esteticaCompuesta', () => {
  it('mixes exterior and interior notes 0.6/0.4 by default', () => {
    const value = esteticaCompuesta(threeCarFixture[0]!, DEFAULT_ASSUMPTIONS);
    expect(value).toBeCloseTo(0.6 * 2 + 0.4 * 4, 9);
  });

  it('reacts to a different mix assumption', () => {
    const value = esteticaCompuesta(threeCarFixture[0]!, {
      ...DEFAULT_ASSUMPTIONS,
      mezclaEstetica: 1,
    });
    expect(value).toBe(2);
  });
});

describe('buildEsteticaBreakdown', () => {
  it('exposes exterior and interior notes as informational subcomponents, not sourced inputs', () => {
    const breakdown = buildEsteticaBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      2,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs).toEqual([]);
    expect(sportage.subcomponents).toEqual([
      {
        label: 'Nota exterior (tu valoración, editable)',
        rawValue: 2,
        unit: '/5',
        editableRating: 'aestheticsExterior',
      },
      {
        label: 'Nota interior (tu valoración, editable)',
        rawValue: 4,
        unit: '/5',
        editableRating: 'aestheticsInterior',
      },
    ]);
  });

  it('marks both notes with the stable field keys the interface switches on', () => {
    const breakdown = buildEsteticaBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      2,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.subcomponents!.map((sub) => sub.editableRating)).toEqual([
      'aestheticsExterior',
      'aestheticsInterior',
    ]);
  });

  it('ranks the car with the best combined note highest', () => {
    const breakdown = buildEsteticaBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      2,
    );
    const x1 = breakdown.get('bmw-x1-xdrive25e')!;
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(x1.score).toBeGreaterThan(sportage.score);
    expect(x1.normalization!.normalizedValue).toBe(10);
    expect(sportage.normalization!.normalizedValue).toBe(0);
  });
});
