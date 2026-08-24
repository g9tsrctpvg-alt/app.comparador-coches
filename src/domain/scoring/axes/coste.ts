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

// Una cuarta parte del año son trayectos largos, los que ninguna batería de
// enchufable cubre y los que el WLTP combinado se salta al homologar
// (product/0028). Es una constante razonada, no medida: sensibilidad
// comprobada contra el catálogo real, un recorrido completo de 0 a 0,50
// mueve el total menos de un punto, muy por debajo de la brecha que abre
// la propia carga en casa.
const CUOTA_VIAJE = 0.25;

export function costeFormula(assumptions: GlobalAssumptions): string {
  return (
    `nota = 0,5 × escala(precio) + 0,5 × escala(coste de uso mensual). ` +
    `escala(precio): 10 hasta ${PRECIO_BUENO_EUR.toLocaleString('es-ES')} €, ` +
    `0 desde ${PRECIO_MALO_EUR.toLocaleString('es-ES')} €. ` +
    `escala(uso): 10 hasta ${USO_BUENO_EUR_MES} €/mes, 0 desde ${USO_MALO_EUR_MES} €/mes. ` +
    `coste de uso mensual = (energía anual + mantenimiento anual) / 12; ` +
    `energía anual = (km eléctricos/100) × consumo eléctrico × ${assumptions.precioKwh.toFixed(2)} €/kWh ` +
    `+ (km térmicos/100) × consumo térmico × ${assumptions.precioLitro.toFixed(2)} €/l, sobre ` +
    `${assumptions.kmPorAnio} km/año. Un eléctrico hace el año entero en eléctrico, un no enchufable ` +
    `entero en térmico, y un enchufable reparte según la autonomía eléctrica homologada y si el ` +
    'usuario tiene carga en casa. Ambas escalas son absolutas: no dependen de qué otros candidatos ' +
    'haya en el catálogo.'
  );
}

interface KmSplit {
  kmElectricos: number;
  kmTermicos: number;
  consumoElectrico: number;
  consumoTermico: number;
  /** La autonomía eléctrica homologada de un `PHEV`, informativa incluso
   * cuando no hay carga en casa y `kmElectricos` es 0. 0 para el resto de
   * tecnologías, que no la usan. */
  autonomiaRealKm: number;
}

function kmSplit(car: Car, assumptions: GlobalAssumptions): KmSplit {
  if (car.technology === 'EV') {
    return {
      kmElectricos: assumptions.kmPorAnio,
      kmTermicos: 0,
      consumoElectrico: car.consumption.value,
      consumoTermico: 0,
      autonomiaRealKm: 0,
    };
  }
  if (car.technology !== 'PHEV') {
    return {
      kmElectricos: 0,
      kmTermicos: assumptions.kmPorAnio,
      consumoElectrico: 0,
      consumoTermico: car.consumption.value,
      autonomiaRealKm: 0,
    };
  }

  // PHEV: la autonomía real es la homologada WLTP, un dato publicado
  // directamente y no derivado; el consumo eléctrico sí se deriva de ella
  // y de la capacidad de batería, porque km77 no publica un consumo
  // eléctrico homogéneo para los enchufables (product/0028). `CarSchema`
  // exige los dos campos para un `PHEV`; si faltan es que el coche no ha
  // pasado la validación, y aquí se avisa en vez de calcular con `NaN`.
  if (!car.electricRangeKm || !car.batteryCapacityKwh) {
    throw new Error(
      `El PHEV «${car.id}» no declara autonomía eléctrica o capacidad de batería`,
    );
  }
  const autonomiaRealKm = car.electricRangeKm.value;
  const consumoElectrico =
    (100 * car.batteryCapacityKwh.value) / autonomiaRealKm;
  const consumoTermico = car.consumption.value;

  if (!assumptions.cargaEnCasa) {
    return {
      kmElectricos: 0,
      kmTermicos: assumptions.kmPorAnio,
      consumoElectrico,
      consumoTermico,
      autonomiaRealKm,
    };
  }

  const kmDiarios = assumptions.kmPorAnio * (1 - CUOTA_VIAJE);
  const kmDiaMedio = kmDiarios / 365;
  const fraccionDiariaElectrica = Math.min(1, autonomiaRealKm / kmDiaMedio);
  const kmElectricos = kmDiarios * fraccionDiariaElectrica;

  return {
    kmElectricos,
    kmTermicos: assumptions.kmPorAnio - kmElectricos,
    consumoElectrico,
    consumoTermico,
    autonomiaRealKm,
  };
}

interface CosteComponents {
  precioCompra: number;
  costeUsoMensual: number;
}

export function costeComponents(
  car: Car,
  assumptions: GlobalAssumptions,
): CosteComponents {
  const split = kmSplit(car, assumptions);
  const energiaAnual =
    (split.kmElectricos / 100) *
      split.consumoElectrico *
      assumptions.precioKwh +
    (split.kmTermicos / 100) * split.consumoTermico * assumptions.precioLitro;
  const mantenimientoAnual = car.maintenanceEurYear.value;

  return {
    precioCompra: car.priceEur.value,
    costeUsoMensual: (energiaAnual + mantenimientoAnual) / 12,
  };
}

function energyInfo(car: Car, assumptions: GlobalAssumptions, split: KmSplit) {
  if (car.technology !== 'PHEV') {
    return [
      {
        label: 'Precio unitario de la energía aplicado',
        value:
          car.technology === 'EV'
            ? `${assumptions.precioKwh.toFixed(2)} €/kWh — es un vehículo eléctrico`
            : `${assumptions.precioLitro.toFixed(2)} €/l — no es un vehículo eléctrico`,
      },
    ];
  }
  return [
    {
      label: 'Autonomía eléctrica real aplicada',
      value: `${split.autonomiaRealKm.toFixed(1)} km — homologada WLTP, es un híbrido enchufable`,
    },
    {
      label: 'Kilómetros/año en modo eléctrico',
      value: `${Math.round(split.kmElectricos)} km`,
    },
    {
      label: 'Kilómetros/año en modo térmico',
      value: `${Math.round(split.kmTermicos)} km`,
    },
  ];
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
    const split = kmSplit(car, assumptions);

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
      info: energyInfo(car, assumptions, split),
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
