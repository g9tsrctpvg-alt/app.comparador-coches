import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildPrestacionesBreakdown, cvPorTonelada } from './prestaciones';

function cvtScale(
  breakdown: ReturnType<typeof buildPrestacionesBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'CV por tonelada')!.scale!;
}

function accelScale(
  breakdown: ReturnType<typeof buildPrestacionesBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'Aceleración 0-100 km/h')!.scale!;
}

function withPowerWeightAccel(
  powerCv: number,
  weightKg: number,
  accel: number,
  id = 'x',
) {
  const base = threeCarFixture[0]!;
  return {
    ...base,
    id,
    powerCv: { ...base.powerCv, value: powerCv },
    weightKg: { ...base.weightKg, value: weightKg },
    acceleration0to100: { ...base.acceleration0to100, value: accel },
  };
}

describe('cvPorTonelada', () => {
  it('divides power by weight in tonnes', () => {
    const car = threeCarFixture[0]!;
    expect(cvPorTonelada(car)).toBeCloseTo(
      car.powerCv.value / (car.weightKg.value / 1000),
      9,
    );
  });
});

describe('buildPrestacionesBreakdown', () => {
  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildPrestacionesBreakdown(threeCarFixture, 1);
    const alone = buildPrestacionesBreakdown([threeCarFixture[0]!], 1);
    expect(alone.get('kia-sportage-hev')!.score).toBe(
      withThree.get('kia-sportage-hev')!.score,
    );
  });

  it('scores 10 on CV/t at and above 260, and 0 at and below 65', () => {
    const strong = withPowerWeightAccel(260, 1000, 8, 'strong');
    const evenStronger = withPowerWeightAccel(300, 1000, 8, 'stronger');
    const weak = withPowerWeightAccel(65, 1000, 8, 'weak');
    const weaker = withPowerWeightAccel(55, 1000, 8, 'weaker');
    const breakdown = buildPrestacionesBreakdown(
      [strong, evenStronger, weak, weaker],
      1,
    );
    expect(cvtScale(breakdown, 'strong').score).toBe(10);
    expect(cvtScale(breakdown, 'stronger').score).toBe(10);
    expect(cvtScale(breakdown, 'weak').score).toBe(0);
    expect(cvtScale(breakdown, 'weaker').score).toBe(0);
  });

  it('scores 10 on 0-100 at and below 4.4s, and 0 at and above 16.7s', () => {
    const fast = withPowerWeightAccel(150, 1500, 4.4, 'fast');
    const faster = withPowerWeightAccel(150, 1500, 3.5, 'faster');
    const slow = withPowerWeightAccel(150, 1500, 16.7, 'slow');
    const slower = withPowerWeightAccel(150, 1500, 18.0, 'slower');
    const breakdown = buildPrestacionesBreakdown(
      [fast, faster, slow, slower],
      1,
    );
    expect(accelScale(breakdown, 'fast').score).toBe(10);
    expect(accelScale(breakdown, 'faster').score).toBe(10);
    expect(accelScale(breakdown, 'slow').score).toBe(0);
    expect(accelScale(breakdown, 'slower').score).toBe(0);
  });

  it('scores the CV/t midpoint as 5, and 10% from the bad anchor as under 1: an S curve, not a line', () => {
    const midCvt = 65 + 0.5 * (260 - 65);
    const near10PctFromBad = 260 - 0.9 * (260 - 65);
    const breakdown = buildPrestacionesBreakdown(
      [
        withPowerWeightAccel(midCvt * 1.5, 1500, 8, 'mid'),
        withPowerWeightAccel(near10PctFromBad * 1.5, 1500, 8, 'near-bad'),
      ],
      1,
    );
    expect(cvtScale(breakdown, 'mid').score).toBeCloseTo(5, 6);
    expect(cvtScale(breakdown, 'near-bad').score).toBeLessThan(1);
  });

  it('gives cars with the same CV/t and different acceleration different axis scores', () => {
    const carA = withPowerWeightAccel(150, 1500, 7, 'a');
    const carB = withPowerWeightAccel(150, 1500, 12, 'b');
    const breakdown = buildPrestacionesBreakdown([carA, carB], 1);
    expect(breakdown.get('a')!.score).not.toBe(breakdown.get('b')!.score);
  });

  it('combines the two scales 50/50', () => {
    const breakdown = buildPrestacionesBreakdown(threeCarFixture, 1);
    for (const car of threeCarFixture) {
      const entry = breakdown.get(car.id)!;
      const cvt = cvtScale(breakdown, car.id).score;
      const accel = accelScale(breakdown, car.id).score;
      expect(entry.rawScore).toBeCloseTo(0.5 * cvt + 0.5 * accel, 9);
    }
  });

  it('shows both anchors and the resulting score for each magnitude, and names no model', () => {
    const breakdown = buildPrestacionesBreakdown(threeCarFixture, 1);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    expect(cvtScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 260,
      badAnchor: 65,
    });
    expect(accelScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 4.4,
      badAnchor: 16.7,
    });
    expect(
      sportage.subcomponents!.every((s) => s.normalization === undefined),
    ).toBe(true);
  });

  it('still declares that CV/t ignores traction and gearbox', () => {
    const breakdown = buildPrestacionesBreakdown(threeCarFixture, 1);
    expect(breakdown.get('kia-sportage-hev')!.formulaDescription).toContain(
      'ignora tracción y cambio',
    );
  });

  it('names power, weight and acceleration as inputs, each with their source', () => {
    const breakdown = buildPrestacionesBreakdown(threeCarFixture, 1);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).toEqual([
      'Potencia',
      'Peso',
      'Aceleración 0-100 km/h',
    ]);
  });
});
