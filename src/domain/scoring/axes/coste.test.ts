import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS } from '../assumptions';
import { threeCarFixture } from '../testFixtures';
import { buildCosteBreakdown, costeTotal } from './coste';

describe('costeTotal', () => {
  it('adds purchase price, energy and maintenance over the assumed years', () => {
    const components = costeTotal(threeCarFixture[0]!, DEFAULT_ASSUMPTIONS);
    expect(components.precioCompra).toBe(36000);
    expect(components.costeEnergia).toBeCloseTo(17298, 6);
    expect(components.costeMantenimiento).toBe(4800);
    expect(components.total).toBeCloseTo(58098, 6);
  });

  it('prices electric consumption in €/kWh instead of €/litro', () => {
    const components = costeTotal(threeCarFixture[2]!, DEFAULT_ASSUMPTIONS);
    expect(components.costeEnergia).toBeCloseTo(12960, 6);
    expect(components.total).toBeCloseTo(47960, 6);
  });

  it('does not subtract a residual value when "pienso venderlo" is off', () => {
    const components = costeTotal(threeCarFixture[0]!, DEFAULT_ASSUMPTIONS);
    expect(components.descuentoResidual).toBe(0);
  });

  it('subtracts the residual value when "pienso venderlo" is on', () => {
    const components = costeTotal(threeCarFixture[0]!, {
      ...DEFAULT_ASSUMPTIONS,
      pensandoVender: true,
    });
    expect(components.descuentoResidual).toBeGreaterThan(0);
    expect(components.total).toBeLessThan(58098);
  });
});

describe('buildCosteBreakdown', () => {
  it('scores the cheapest total cost highest (menor coste = mejor)', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const ev3 = breakdown.get('kia-ev3')!;
    const x1 = breakdown.get('bmw-x1-xdrive25e')!;
    expect(ev3.normalization!.normalizedValue).toBe(10);
    expect(x1.normalization!.normalizedValue).toBe(0);
  });

  it('lists purchase price, energy and maintenance as informational subcomponents', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.subcomponents!.map((sub) => sub.label)).toEqual([
      'Precio de compra',
      'Energía (12 años)',
      'Mantenimiento (12 años)',
    ]);
  });

  it('adds the residual discount subcomponent only when "pienso venderlo" is on', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      { ...DEFAULT_ASSUMPTIONS, pensandoVender: true },
      1,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    const residualLine = sportage.subcomponents!.find(
      (sub) => sub.label === 'Descuento por valor residual',
    );
    expect(residualLine).toBeDefined();
    expect(residualLine!.rawValue).toBeLessThan(0);
  });

  it('echoes the assumptions applied', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.assumptionsUsed).toEqual([
      { label: 'Km/año', value: '15000' },
      { label: 'Años', value: '12' },
      { label: '€/litro', value: '1.55' },
      { label: '€/kWh', value: '0.45' },
      { label: 'Pienso venderlo', value: 'No' },
    ]);
  });

  it('includes the residual value as an input only for cars that declare it', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).toContain(
      'Valor residual a 5 años',
    );
  });

  it('omits the residual value as an input for a car that never declared one', () => {
    const { residualPct5y: _residualPct5y, ...withoutResidual } =
      threeCarFixture[0]!;
    const breakdown = buildCosteBreakdown(
      [withoutResidual],
      DEFAULT_ASSUMPTIONS,
      1,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.inputs.map((input) => input.label)).not.toContain(
      'Valor residual a 5 años',
    );
  });

  it('shows no residual line at all for a car with no residual datum, even when selling', () => {
    // Antes salía «Descuento por valor residual: −0 €», que presenta como
    // cero comprobado lo que en realidad es un dato que no existe.
    const { residualPct5y: _residualPct5y, ...withoutResidual } =
      threeCarFixture[0]!;
    const breakdown = buildCosteBreakdown(
      [withoutResidual],
      { ...DEFAULT_ASSUMPTIONS, pensandoVender: true },
      1,
    );
    const sportage = breakdown.get('kia-sportage-hev')!;
    expect(sportage.subcomponents!.map((sub) => sub.label)).not.toContain(
      'Descuento por valor residual',
    );
  });

  it('declares euros as the raw unit of the axis, so the interface can label it', () => {
    const breakdown = buildCosteBreakdown(
      threeCarFixture,
      DEFAULT_ASSUMPTIONS,
      1,
    );
    expect(breakdown.get('kia-sportage-hev')!.rawUnit).toBe('€');
  });
});
