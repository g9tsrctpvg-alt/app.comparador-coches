import type { Car } from '../../car';
import type { GlobalAssumptions } from '../assumptions';
import { normalizeAll } from '../normalize';
import {
  inputDatumFrom,
  type AxisBreakdown,
  type SubcomponentBreakdown,
} from '../breakdown';
import { mustGet } from '../mustGet';

export function costeFormula(assumptions: GlobalAssumptions): string {
  return (
    `precio_compra + (energía + mantenimiento) × ${assumptions.anios} años` +
    (assumptions.pensandoVender ? ' − valor_residual' : '') +
    `. energía = (consumo/100) × ${assumptions.kmPorAnio} km/año × años × precio_unitario ` +
    `(${assumptions.precioLitro.toFixed(2)} €/l ó ${assumptions.precioKwh.toFixed(2)} €/kWh). ` +
    (assumptions.pensandoVender
      ? 'residual = precio × res^(años/5).'
      : 'Residual no se resta: "pienso venderlo" está desactivado.')
  );
}

interface CosteComponents {
  precioCompra: number;
  costeEnergia: number;
  costeMantenimiento: number;
  descuentoResidual: number;
  total: number;
}

export function costeTotal(
  car: Car,
  assumptions: GlobalAssumptions,
): CosteComponents {
  const precioUnitario =
    car.technology === 'EV' ? assumptions.precioKwh : assumptions.precioLitro;
  const costeEnergia =
    (car.consumption.value / 100) *
    assumptions.kmPorAnio *
    assumptions.anios *
    precioUnitario;
  const costeMantenimiento = car.maintenanceEurYear.value * assumptions.anios;
  const precioCompra = car.priceEur.value;

  const descuentoResidual =
    assumptions.pensandoVender && car.residualPct5y
      ? precioCompra * Math.pow(car.residualPct5y.value, assumptions.anios / 5)
      : 0;

  return {
    precioCompra,
    costeEnergia,
    costeMantenimiento,
    descuentoResidual,
    total: precioCompra + costeEnergia + costeMantenimiento - descuentoResidual,
  };
}

export function buildCosteBreakdown(
  cars: Car[],
  assumptions: GlobalAssumptions,
  weight: number,
): Map<string, AxisBreakdown> {
  const componentsByCar = new Map<string, CosteComponents>();
  const raw = cars.map((car) => {
    const components = costeTotal(car, assumptions);
    componentsByCar.set(car.id, components);
    return { carId: car.id, carName: car.name, value: components.total };
  });
  const normalizations = normalizeAll('menor-mejor', raw);
  const formula = costeFormula(assumptions);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const normalization = mustGet(normalizations, car.id);
    const components = mustGet(componentsByCar, car.id);
    const score = Math.min(10, Math.max(0, normalization.normalizedValue));

    const subcomponents: SubcomponentBreakdown[] = [
      {
        label: 'Precio de compra',
        rawValue: components.precioCompra,
        unit: '€',
      },
      {
        label: `Energía (${assumptions.anios} años)`,
        rawValue: components.costeEnergia,
        unit: '€',
      },
      {
        label: `Mantenimiento (${assumptions.anios} años)`,
        rawValue: components.costeMantenimiento,
        unit: '€',
      },
    ];
    if (assumptions.pensandoVender) {
      subcomponents.push({
        label: 'Descuento por valor residual',
        rawValue: -components.descuentoResidual,
        unit: '€',
      });
    }

    result.set(car.id, {
      axisId: 'coste',
      label: 'Coste total',
      formulaDescription: formula,
      inputs: [
        inputDatumFrom('Precio', car.priceEur),
        inputDatumFrom('Consumo', car.consumption),
        inputDatumFrom('Mantenimiento anual', car.maintenanceEurYear),
        ...(car.residualPct5y
          ? [inputDatumFrom('Valor residual a 5 años', car.residualPct5y)]
          : []),
      ],
      assumptionsUsed: [
        { label: 'Km/año', value: String(assumptions.kmPorAnio) },
        { label: 'Años', value: String(assumptions.anios) },
        { label: '€/litro', value: assumptions.precioLitro.toFixed(2) },
        { label: '€/kWh', value: assumptions.precioKwh.toFixed(2) },
        {
          label: 'Pienso venderlo',
          value: assumptions.pensandoVender ? 'Sí' : 'No',
        },
      ],
      subcomponents,
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
