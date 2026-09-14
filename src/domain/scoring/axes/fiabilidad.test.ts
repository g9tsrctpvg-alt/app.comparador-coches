import { describe, expect, it } from 'vitest';
import { threeCarFixture } from '../testFixtures';
import { buildFiabilidadBreakdown } from './fiabilidad';

function ocuScale(
  breakdown: ReturnType<typeof buildFiabilidadBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'Índice OCU')!.scale!;
}

function withOcuAndWarranty(ocu: number, warrantyYears: number, id = 'x') {
  const base = threeCarFixture[0]!;
  return {
    ...base,
    id,
    reliabilityOcu: { ...base.reliabilityOcu, value: ocu },
    warrantyYears: { ...base.warrantyYears, value: warrantyYears },
  };
}

describe('buildFiabilidadBreakdown', () => {
  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildFiabilidadBreakdown(threeCarFixture, 2);
    const alone = buildFiabilidadBreakdown([threeCarFixture[0]!], 2);
    expect(alone.get('kia-sportage-hev')!.score).toBe(
      withThree.get('kia-sportage-hev')!.score,
    );
  });

  it('scores 10 on OCU index at and above 93, and 0 at and below 64', () => {
    const good = withOcuAndWarranty(93, 5, 'good');
    const better = withOcuAndWarranty(96, 5, 'better');
    const bad = withOcuAndWarranty(64, 5, 'bad');
    const worse = withOcuAndWarranty(50, 5, 'worse');
    const breakdown = buildFiabilidadBreakdown([good, better, bad, worse], 2);
    expect(ocuScale(breakdown, 'good').score).toBe(10);
    expect(ocuScale(breakdown, 'better').score).toBe(10);
    expect(ocuScale(breakdown, 'bad').score).toBe(0);
    expect(ocuScale(breakdown, 'worse').score).toBe(0);
  });

  /** El criterio que da nombre a product/0041: la garantía no mueve la nota. */
  it('gives the same score to three and seven years of unconditional warranty', () => {
    const short = withOcuAndWarranty(85, 3, 'short');
    const long = withOcuAndWarranty(85, 7, 'long');
    const breakdown = buildFiabilidadBreakdown([short, long], 2);
    expect(breakdown.get('short')!.score).toBe(breakdown.get('long')!.score);
  });

  it('makes the axis score the OCU score, with no other term', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    for (const car of threeCarFixture) {
      const entry = breakdown.get(car.id)!;
      expect(entry.rawScore).toBeCloseTo(ocuScale(breakdown, car.id).score, 9);
    }
  });

  it('has no warranty subcomponent left', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    for (const car of threeCarFixture) {
      const labels = breakdown
        .get(car.id)!
        .subcomponents!.map((sub) => sub.label);
      expect(labels).toEqual(['Índice OCU']);
    }
  });

  it('shows the unconditional warranty years as information that does not score', () => {
    const breakdown = buildFiabilidadBreakdown(
      [withOcuAndWarranty(85, 5, 'plain')],
      2,
    );
    const info = breakdown.get('plain')!.info!;
    expect(info).toHaveLength(1);
    expect(info[0]!.label).toContain('no puntúa');
    expect(info[0]!.value).toBe('5 años');
  });

  it('shows the conditioned extension next to it when it exists', () => {
    const withExtension = {
      ...withOcuAndWarranty(85, 3, 'extended'),
      warrantyExtension: {
        years: {
          value: 15,
          sources: [
            { label: 'Fixture', value: 15, estimated: false, current: true },
          ],
        },
        kmLimit: {
          value: 100000,
          sources: [
            {
              label: 'Fixture',
              value: 100000,
              estimated: false,
              current: true,
            },
          ],
        },
        condition: 'Sujeta a mantenimiento en red oficial',
      },
    };
    const plain = withOcuAndWarranty(85, 3, 'plain');
    const breakdown = buildFiabilidadBreakdown([withExtension, plain], 2);
    const info = breakdown.get('extended')!.info!;
    expect(info).toHaveLength(2);
    expect(info[1]!.value).toContain('15 años');
    expect(info[1]!.value).toContain('100000 km');
    expect(breakdown.get('plain')!.info).toHaveLength(1);
  });

  it('scores a car with an extension the same as one without it', () => {
    const plain = withOcuAndWarranty(85, 3, 'plain');
    const extended = {
      ...withOcuAndWarranty(85, 3, 'extended'),
      warrantyExtension: {
        years: {
          value: 15,
          sources: [
            { label: 'Fixture', value: 15, estimated: false, current: true },
          ],
        },
        condition: 'Sujeta a mantenimiento en red oficial',
      },
    };
    const breakdown = buildFiabilidadBreakdown([plain, extended], 2);
    expect(breakdown.get('plain')!.score).toBe(
      breakdown.get('extended')!.score,
    );
  });

  it('shows both anchors and the resulting score, and names no model', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    expect(ocuScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 93,
      badAnchor: 64,
    });
    expect(
      sportage.subcomponents!.every((s) => s.normalization === undefined),
    ).toBe(true);
  });

  it('declares the OCU index is by brand, not by model', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    expect(breakdown.get('kia-sportage-hev')!.formulaDescription).toContain(
      'por marca, no por modelo',
    );
  });

  it('names only the OCU index as input, with its source', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    expect(
      breakdown.get('kia-sportage-hev')!.inputs.map((i) => i.label),
    ).toEqual(['Índice de fiabilidad OCU']);
  });

  it('is called Fiabilidad, without the warranty in its name', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    expect(breakdown.get('kia-sportage-hev')!.label).toBe('Fiabilidad');
  });
});
