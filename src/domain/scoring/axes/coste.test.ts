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

  it('sends a PHEV entirely through thermal mode when there is no home charging, matching a non-electric car formula (product/0028)', () => {
    const car = threeCarFixture[1]!; // X1 xDrive25e, PHEV
    const components = costeComponents(car, DEFAULT_ASSUMPTIONS); // cargaEnCasa: false
    const energiaAnual =
      (car.consumption.value / 100) *
      DEFAULT_ASSUMPTIONS.kmPorAnio *
      DEFAULT_ASSUMPTIONS.precioLitro;
    const expected = (energiaAnual + car.maintenanceEurYear.value) / 12;
    expect(components.costeUsoMensual).toBeCloseTo(expected, 6);
  });

  it('splits a PHEV between electric and thermal kilometres with home charging, saturating at a day of range', () => {
    const car = threeCarFixture[1]!; // X1 xDrive25e: 83 km de autonomía, satura el día
    const assumptions = { ...DEFAULT_ASSUMPTIONS, cargaEnCasa: true };
    const components = costeComponents(car, assumptions);

    const autonomiaRealKm = car.electricRangeKm!.value;
    const consumoElectrico =
      (100 * car.batteryCapacityKwh!.value) / autonomiaRealKm;
    const kmDiarios = assumptions.kmPorAnio * 0.75;
    const fraccion = Math.min(1, autonomiaRealKm / (kmDiarios / 365));
    const kmElectricos = kmDiarios * fraccion;
    const kmTermicos = assumptions.kmPorAnio - kmElectricos;
    const energiaAnual =
      (kmElectricos / 100) * consumoElectrico * assumptions.precioKwh +
      (kmTermicos / 100) * car.consumption.value * assumptions.precioLitro;
    const expected = (energiaAnual + car.maintenanceEurYear.value) / 12;

    expect(fraccion).toBe(1); // el día cabe entero en la autonomía real
    expect(components.costeUsoMensual).toBeCloseTo(expected, 6);
  });

  it('splits a PHEV proportionally, not fully electric, when its range falls short of a day', () => {
    const base = threeCarFixture[1]!;
    const car = {
      ...base,
      electricRangeKm: { ...base.electricRangeKm!, value: 10 },
    };
    const assumptions = { ...DEFAULT_ASSUMPTIONS, cargaEnCasa: true };
    const components = costeComponents(car, assumptions);

    const consumoElectrico = (100 * car.batteryCapacityKwh!.value) / 10;
    const kmDiarios = assumptions.kmPorAnio * 0.75;
    const fraccion = 10 / (kmDiarios / 365);
    const kmElectricos = kmDiarios * fraccion;
    const kmTermicos = assumptions.kmPorAnio - kmElectricos;
    const energiaAnual =
      (kmElectricos / 100) * consumoElectrico * assumptions.precioKwh +
      (kmTermicos / 100) * car.consumption.value * assumptions.precioLitro;
    const expected = (energiaAnual + car.maintenanceEurYear.value) / 12;

    expect(fraccion).toBeLessThan(1);
    expect(components.costeUsoMensual).toBeCloseTo(expected, 6);
  });

  it('throws for a PHEV that reaches the axis without battery capacity or electric range', () => {
    const base = threeCarFixture[1]!;
    const car = { ...base, batteryCapacityKwh: undefined };
    expect(() => costeComponents(car, DEFAULT_ASSUMPTIONS)).toThrow(
      /no declara autonomía eléctrica o capacidad de batería/,
    );
  });

  it('declares the electric range and the electric/thermal kilometre split for a PHEV (product/0028)', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      { ...DEFAULT_ASSUMPTIONS, cargaEnCasa: true },
      1,
    );
    const x1 = breakdown.get('bmw-x1-xdrive25e')!;
    expect(x1.info).toHaveLength(3);
    expect(x1.info![0]!.label).toBe('Autonomía eléctrica real aplicada');
    expect(x1.info![0]!.value).toContain('83.0 km');
    expect(x1.info![1]!.label).toBe('Kilómetros/año en modo eléctrico');
    expect(x1.info![2]!.label).toBe('Kilómetros/año en modo térmico');
  });
});
