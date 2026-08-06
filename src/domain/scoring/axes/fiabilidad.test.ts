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

function warrantyScale(
  breakdown: ReturnType<typeof buildFiabilidadBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'Años de garantía incondicional')!
    .scale!;
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

  it('scores 10 on warranty at and above 7 years, and 0 at 0 years', () => {
    const long = withOcuAndWarranty(85, 7, 'long');
    const longer = withOcuAndWarranty(85, 10, 'longer');
    const none = withOcuAndWarranty(85, 0, 'none');
    const breakdown = buildFiabilidadBreakdown([long, longer, none], 2);
    expect(warrantyScale(breakdown, 'long').score).toBe(10);
    expect(warrantyScale(breakdown, 'longer').score).toBe(10);
    expect(warrantyScale(breakdown, 'none').score).toBe(0);
  });

  it('scores 3 years of warranty at approximately 3.9, not 0', () => {
    const car = withOcuAndWarranty(85, 3);
    const breakdown = buildFiabilidadBreakdown([car], 2);
    expect(warrantyScale(breakdown, 'x').score).toBeCloseTo(3.9, 1);
  });

  it('gives the same warranty score whether or not there is a conditioned extension', () => {
    const base = withOcuAndWarranty(85, 3, 'plain');
    const withExtension = {
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
    const breakdown = buildFiabilidadBreakdown([base, withExtension], 2);
    expect(warrantyScale(breakdown, 'plain').score).toBe(
      warrantyScale(breakdown, 'extended').score,
    );
  });

  it('shows the conditioned extension as informational only when it exists', () => {
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
    const withoutExtension = withOcuAndWarranty(85, 3, 'plain');
    const breakdown = buildFiabilidadBreakdown(
      [withExtension, withoutExtension],
      2,
    );
    expect(breakdown.get('extended')!.info).toHaveLength(1);
    expect(breakdown.get('extended')!.info![0]!.value).toContain('15 años');
    expect(breakdown.get('extended')!.info![0]!.value).toContain('100000 km');
    expect(breakdown.get('plain')!.info).toEqual([]);
  });

  it('combines the two scales 0.7/0.3', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    for (const car of threeCarFixture) {
      const entry = breakdown.get(car.id)!;
      const ocu = ocuScale(breakdown, car.id).score;
      const warranty = warrantyScale(breakdown, car.id).score;
      expect(entry.rawScore).toBeCloseTo(0.7 * ocu + 0.3 * warranty, 9);
    }
  });

  it('shows both anchors and the resulting score for each magnitude, and names no model', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    expect(ocuScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 93,
      badAnchor: 64,
    });
    expect(warrantyScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 7,
      badAnchor: 0,
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

  it('names the OCU index and warranty years as inputs, each with their source', () => {
    const breakdown = buildFiabilidadBreakdown(threeCarFixture, 2);
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).toEqual([
      'Índice de fiabilidad OCU',
      'Años de garantía incondicional',
    ]);
  });
});
