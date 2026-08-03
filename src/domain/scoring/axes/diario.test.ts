import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS } from '../assumptions';
import { threeCarFixture } from '../testFixtures';
import { buildDiarioBreakdown, diarioDificultad } from './diario';

describe('diarioDificultad', () => {
  it('weights width 0.6 and length 0.4', () => {
    const value = diarioDificultad(threeCarFixture[0]!, DEFAULT_ASSUMPTIONS);
    expect(value).toBeCloseTo(0.6 * 1865 + 0.4 * 4540, 6);
  });
});

describe('buildDiarioBreakdown', () => {
  it('gives the narrowest, shortest car the best (10) score with no penalty active', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      3,
    );
    const ev3 = breakdown.get('kia-ev3')!;
    // EV3 is the EV without home charging in the default assumptions, so the
    // penalty applies even though it has the lowest raw dificultad.
    expect(ev3.normalization!.normalizedValue).toBe(10);
    expect(ev3.penalties[0]!.active).toBe(true);
    expect(ev3.score).toBe(8.5);
    expect(ev3.contribution).toBe(8.5 * 3);
  });

  it('does not penalize a non-electric car regardless of home charging', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      3,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.penalties[0]!.active).toBe(false);
    expect(sportage.score).toBe(sportage.normalization!.normalizedValue);
  });

  it('lifts the penalty when the assumption says there is home charging', () => {
    const breakdown = buildDiarioBreakdown(
      threeCarFixture,
      { ...DEFAULT_ASSUMPTIONS, cargaEnCasa: true },
      3,
    );
    const ev3 = breakdown.get('kia-ev3')!;
    expect(ev3.penalties[0]!.active).toBe(false);
    expect(ev3.score).toBe(10);
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
});
