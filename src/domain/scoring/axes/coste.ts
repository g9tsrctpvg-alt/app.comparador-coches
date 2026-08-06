import type { Car } from '../../car';
import type { GlobalAssumptions } from '../assumptions';
import { scoreOnAbsoluteScale } from '../scale';
import { inputDatumFrom, type AxisBreakdown } from '../breakdown';

// El presupuesto ya declarado (47.000 €) como techo duro: por encima no se
// compra. 25.000 € es donde el precio deja de preocupar; por debajo, empate.
const PRECIO_BUENO_EUR = 25000;
const PRECIO_MALO_EUR = 47000;
// 22.000 € de recorrido en precio ÷ (150 €/mes × 12) de recorrido en uso ≈
// 12,2 años: con el coche unos doce años, ambas escalas cubren el mismo
// dinero, y por eso 50/50 es la única combinación coherente.
const USO_BUENO_EUR_MES = 100;
const USO_MALO_EUR_MES = 250;

export function costeFormula(assumptions: GlobalAssumptions): string {
  return (
    `nota = 0,5 × escala(precio) + 0,5 × escala(coste de uso mensual). ` +
    `escala(precio): 10 hasta ${PRECIO_BUENO_EUR.toLocaleString('es-ES')} €, ` +
    `0 desde ${PRECIO_MALO_EUR.toLocaleString('es-ES')} €. ` +
    `escala(uso): 10 hasta ${USO_BUENO_EUR_MES} €/mes, 0 desde ${USO_MALO_EUR_MES} €/mes. ` +
    `coste de uso mensual = (energía anual + mantenimiento anual) / 12; ` +
    `energía anual = (consumo/100) × ${assumptions.kmPorAnio} km/año × precio_unitario ` +
    `(${assumptions.precioLitro.toFixed(2)} €/l ó ${assumptions.precioKwh.toFixed(2)} €/kWh). ` +
    'Ambas escalas son absolutas: no dependen de qué otros candidatos haya en el catálogo.'
  );
}

interface CosteComponents {
  precioCompra: number;
  costeUsoMensual: number;
}

export function costeComponents(
  car: Car,
  assumptions: GlobalAssumptions,
): CosteComponents {
  const precioUnitario =
    car.technology === 'EV' ? assumptions.precioKwh : assumptions.precioLitro;
  const energiaAnual =
    (car.consumption.value / 100) * assumptions.kmPorAnio * precioUnitario;
  const mantenimientoAnual = car.maintenanceEurYear.value;

  return {
    precioCompra: car.priceEur.value,
    costeUsoMensual: (energiaAnual + mantenimientoAnual) / 12,
  };
}

export function buildCosteBreakdown(
  cars: Car[],
  assumptions: GlobalAssumptions,
  weight: number,
): Map<string, AxisBreakdown> {
  const formula = costeFormula(assumptions);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const { precioCompra, costeUsoMensual } = costeComponents(car, assumptions);
    const precioScore = scoreOnAbsoluteScale(
      precioCompra,
      PRECIO_BUENO_EUR,
      PRECIO_MALO_EUR,
    );
    const usoScore = scoreOnAbsoluteScale(
      costeUsoMensual,
      USO_BUENO_EUR_MES,
      USO_MALO_EUR_MES,
    );
    const rawScore = 0.5 * precioScore + 0.5 * usoScore;
    const score = Math.min(10, Math.max(0, rawScore));

    result.set(car.id, {
      axisId: 'coste',
      label: 'Coste total',
      formulaDescription: formula,
      inputs: [
        inputDatumFrom('Precio', car.priceEur),
        inputDatumFrom('Consumo', car.consumption),
        inputDatumFrom('Mantenimiento anual', car.maintenanceEurYear),
      ],
      assumptionsUsed: [
        { label: 'Km/año', value: String(assumptions.kmPorAnio) },
        { label: '€/litro', value: assumptions.precioLitro.toFixed(2) },
        { label: '€/kWh', value: assumptions.precioKwh.toFixed(2) },
      ],
      info: [
        {
          label: 'Precio unitario de la energía aplicado',
          value:
            car.technology === 'EV'
              ? `${assumptions.precioKwh.toFixed(2)} €/kWh — es un vehículo eléctrico`
              : `${assumptions.precioLitro.toFixed(2)} €/l — no es un vehículo eléctrico`,
        },
      ],
      subcomponents: [
        {
          label: 'Precio de compra',
          rawValue: precioCompra,
          unit: '€',
          scale: {
            value: precioCompra,
            goodAnchor: PRECIO_BUENO_EUR,
            badAnchor: PRECIO_MALO_EUR,
            score: precioScore,
          },
        },
        {
          label: 'Coste de uso mensual',
          rawValue: costeUsoMensual,
          unit: '€/mes',
          scale: {
            value: costeUsoMensual,
            goodAnchor: USO_BUENO_EUR_MES,
            badAnchor: USO_MALO_EUR_MES,
            score: usoScore,
          },
        },
      ],
      rawScore,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
