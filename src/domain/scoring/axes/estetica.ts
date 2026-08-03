import type { Car } from '../../car';
import type { GlobalAssumptions } from '../assumptions';
import { normalizeAll } from '../normalize';
import type { AxisBreakdown } from '../breakdown';
import { mustGet } from '../mustGet';

export function esteticaFormula(assumptions: GlobalAssumptions): string {
  const mix = assumptions.mezclaEstetica;
  return (
    `mix × nota_exterior + (1 − mix) × nota_interior, con mix = ${mix.toFixed(1)}. ` +
    'El compuesto resultante se normaliza contra el resto de candidatos.'
  );
}

export function esteticaCompuesta(
  car: Car,
  assumptions: GlobalAssumptions,
): number {
  const mix = assumptions.mezclaEstetica;
  return (
    mix * car.aestheticsExterior.value +
    (1 - mix) * car.aestheticsInterior.value
  );
}

export function buildEsteticaBreakdown(
  cars: Car[],
  assumptions: GlobalAssumptions,
  weight: number,
): Map<string, AxisBreakdown> {
  const raw = cars.map((car) => ({
    carId: car.id,
    carName: car.name,
    value: esteticaCompuesta(car, assumptions),
  }));
  const normalizations = normalizeAll('mayor-mejor', raw);
  const formula = esteticaFormula(assumptions);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const normalization = mustGet(normalizations, car.id);
    const score = Math.min(10, Math.max(0, normalization.normalizedValue));

    result.set(car.id, {
      axisId: 'estetica',
      label: 'Estética',
      formulaDescription: formula,
      inputs: [],
      assumptionsUsed: [
        {
          label: 'Mezcla exterior/interior',
          value: `${assumptions.mezclaEstetica.toFixed(1)} / ${(1 - assumptions.mezclaEstetica).toFixed(1)}`,
        },
      ],
      subcomponents: [
        {
          label: 'Nota exterior (tu valoración, editable)',
          rawValue: car.aestheticsExterior.value,
          unit: '/5',
        },
        {
          label: 'Nota interior (tu valoración, editable)',
          rawValue: car.aestheticsInterior.value,
          unit: '/5',
        },
      ],
      normalization,
      rawScore: normalization.normalizedValue,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
