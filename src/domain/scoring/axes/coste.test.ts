import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS } from '../assumptions';
import { threeCarFixture } from '../testFixtures';
import { buildCosteBreakdown, costeComponents } from './coste';

function priceScale(
  breakdown: ReturnType<typeof buildCosteBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'Precio de compra')!.scale!;
}

function usageScale(
  breakdown: ReturnType<typeof buildCosteBreakdown>,
  id: string,
) {
  return breakdown
    .get(id)!
    .subcomponents!.find((s) => s.label === 'Coste de uso mensual')!.scale!;
}

describe('costeComponents', () => {
  it('computes monthly running cost from annual energy plus annual maintenance, divided by 12', () => {
    const car = threeCarFixture[0]!; // Sportage HEV, ICE-priced litre fuel
    const components = costeComponents(car, DEFAULT_ASSUMPTIONS);
    const energiaAnual =
      (car.consumption.value / 100) *
      DEFAULT_ASSUMPTIONS.kmPorAnio *
      DEFAULT_ASSUMPTIONS.precioLitro;
    const expected = (energiaAnual + car.maintenanceEurYear.value) / 12;
    expect(components.costeUsoMensual).toBeCloseTo(expected, 6);
    expect(components.precioCompra).toBe(car.priceEur.value);
  });
});

describe('buildCosteBreakdown', () => {
  it('does not depend on which other candidates are in the catalogue', () => {
    const withThree = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const alone = buildCosteBreakdown(
      [threeCarFixture[0]!],
      DEFAULT_ASSUMPTIONS,
      1,
    );
    expect(alone.get('kia-sportage-hev')!.score).toBe(
      withThree.get('kia-sportage-hev')!.score,
    );
  });

  it('scores 10 on price at and below 25000 EUR', () => {
    const car = {
      ...threeCarFixture[0]!,
      priceEur: { ...threeCarFixture[0]!.priceEur, value: 20000 },
    };
    const breakdown = buildCosteBreakdown([car], DEFAULT_ASSUMPTIONS, 1);
    expect(priceScale(breakdown, car.id).score).toBe(10);
  });

  it('scores 0 on price at and above 47000 EUR', () => {
    const car = {
      ...threeCarFixture[0]!,
      priceEur: { ...threeCarFixture[0]!.priceEur, value: 60000 },
    };
    const breakdown = buildCosteBreakdown([car], DEFAULT_ASSUMPTIONS, 1);
    expect(priceScale(breakdown, car.id).score).toBe(0);
  });

  it('scores 10 on monthly running cost at 100 EUR/month and 0 at 250 EUR/month', () => {
    // Consumo y mantenimiento a mano para fijar el coste de uso exacto.
    const cheap = {
      ...threeCarFixture[0]!,
      id: 'cheap',
      consumption: { ...threeCarFixture[0]!.consumption, value: 0 },
      maintenanceEurYear: {
        ...threeCarFixture[0]!.maintenanceEurYear,
        value: 1200,
      },
    };
    const pricey = {
      ...threeCarFixture[0]!,
      id: 'pricey',
      consumption: { ...threeCarFixture[0]!.consumption, value: 0 },
      maintenanceEurYear: {
        ...threeCarFixture[0]!.maintenanceEurYear,
        value: 3000,
      },
    };
    const breakdown = buildCosteBreakdown(
      [cheap, pricey],
      DEFAULT_ASSUMPTIONS,
      1,
    );
    expect(usageScale(breakdown, 'cheap').score).toBe(10);
    expect(usageScale(breakdown, 'pricey').score).toBe(0);
  });

  it('combines the two scales 50/50', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    for (const car of threeCarFixture) {
      const entry = breakdown.get(car.id)!;
      const price = priceScale(breakdown, car.id).score;
      const usage = usageScale(breakdown, car.id).score;
      expect(entry.rawScore).toBeCloseTo(0.5 * price + 0.5 * usage, 9);
      expect(entry.score).toBe(entry.rawScore);
    }
  });

  it('gives cars with the same price but different running cost different axis scores', () => {
    const base = threeCarFixture[0]!;
    const carA = {
      ...base,
      id: 'a',
      maintenanceEurYear: { ...base.maintenanceEurYear, value: 200 },
    };
    const carB = {
      ...base,
      id: 'b',
      maintenanceEurYear: { ...base.maintenanceEurYear, value: 2000 },
    };
    const breakdown = buildCosteBreakdown([carA, carB], DEFAULT_ASSUMPTIONS, 1);
    expect(breakdown.get('a')!.score).not.toBe(breakdown.get('b')!.score);
  });

  it('shows both anchors and the resulting score for each magnitude, and names no model', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.normalization).toBeUndefined();
    expect(priceScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 25000,
      badAnchor: 47000,
    });
    expect(usageScale(breakdown, 'kia-sportage-hev')).toMatchObject({
      goodAnchor: 100,
      badAnchor: 250,
    });
    expect(
      sportage.subcomponents!.every((s) => s.normalization === undefined),
    ).toBe(true);
  });

  it('names price and consumption and maintenance as inputs, each with their source', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).toEqual([
      'Precio',
      'Consumo',
      'Mantenimiento anual',
    ]);
  });

  it('declares the kWh price for an electric car and the litre price for a non-electric one (product/0008)', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const ev3 = breakdown.get('kia-ev3')!; // eléctrico
    const sportage = breakdown.get('kia-sportage-hev')!; // no eléctrico

    expect(ev3.info).toHaveLength(1);
    expect(ev3.info![0]!.value).toContain(
      `${DEFAULT_ASSUMPTIONS.precioKwh.toFixed(2)} €/kWh`,
    );
    expect(sportage.info).toHaveLength(1);
    expect(sportage.info![0]!.value).toContain(
      `${DEFAULT_ASSUMPTIONS.precioLitro.toFixed(2)} €/l`,
    );
  });
});
