import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildViajeBreakdown } from './viaje';

describe('buildViajeBreakdown', () => {
  it('normalizes the user rating against the candidate set, with no formula behind it', () => {
    const breakdown = buildViajeBreakdown(threeCarFixture, 4);
    const x1 = breakdown.get('bmw-x1-xdrive25e')!;
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(x1.normalization!.normalizedValue).toBe(10);
    expect(sportage.normalization!.normalizedValue).toBe(0);
    expect(x1.formulaDescription).toMatch(/juicio subjetivo/);
  });

  it('carries no sourced inputs and no assumptions, only the editable rating', () => {
    const breakdown = buildViajeBreakdown(threeCarFixture, 4);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs).toEqual([]);
    expect(sportage.assumptionsUsed).toEqual([]);
    expect(sportage.subcomponents).toEqual([
      { label: 'Tu valoración (editable)', rawValue: 3, unit: '/5' },
    ]);
  });
});
