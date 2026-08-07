import type { Car, Technology } from '../car';

function sourced(value: number, unit?: string) {
  return {
    value,
    unit,
    sources: [
      { label: 'Fixture de test', value, estimated: false, current: true },
    ],
  };
}

function rating(value: number) {
  return { value, label: 'Fixture de test' };
}

interface FixtureInput {
  id: string;
  name: string;
  brand: string;
  technology: Technology;
  lengthMm: number;
  widthMm: number;
  wheelbaseMm: number;
  priceEur: number;
  consumption: number;
  maintenanceEurYear: number;
  powerCv: number;
  weightKg: number;
  acceleration0to100: number;
  reliabilityOcu: number;
  warrantyYears: number;
  residualPct5y: number;
  aestheticsExterior: number;
  aestheticsInterior: number;
  travelComfort: number;
}

function buildCar(input: FixtureInput): Car {
  return {
    id: input.id,
    name: input.name,
    brand: input.brand,
    technology: input.technology,
    notes: [],
    published: true,
    lengthMm: sourced(input.lengthMm, 'mm'),
    widthMm: sourced(input.widthMm, 'mm'),
    heightMm: sourced(1600, 'mm'),
    wheelbaseMm: sourced(input.wheelbaseMm, 'mm'),
    groundClearanceMm: sourced(160, 'mm'),
    trunkLiters: sourced(500, 'L'),
    powerCv: sourced(input.powerCv, 'CV'),
    weightKg: sourced(input.weightKg, 'kg'),
    acceleration0to100: sourced(input.acceleration0to100, 's'),
    consumption: sourced(
      input.consumption,
      input.technology === 'EV' ? 'kWh/100km' : 'l/100km',
    ),
    maintenanceEurYear: sourced(input.maintenanceEurYear, '€/año'),
    priceEur: sourced(input.priceEur, '€'),
    reliabilityOcu: sourced(input.reliabilityOcu),
    warrantyYears: sourced(input.warrantyYears, 'años'),
    residualPct5y: sourced(input.residualPct5y),
    aestheticsExterior: rating(input.aestheticsExterior),
    aestheticsInterior: rating(input.aestheticsInterior),
    travelComfort: rating(input.travelComfort),
    photos: {},
  };
}

// Cifras reales del proyecto (julio 2026), reutilizadas como fixture: sirven
// además de comprobación cruzada de las fórmulas contra el caso ya
// documentado (X1 con menos CV/t que el Sportage y aun así acelerando antes).
export const sportageFixture = buildCar({
  id: 'kia-sportage-hev',
  name: 'Sportage HEV',
  brand: 'Kia',
  technology: 'HEV',
  lengthMm: 4540,
  widthMm: 1865,
  wheelbaseMm: 2680,
  priceEur: 36000,
  consumption: 6.2,
  maintenanceEurYear: 400,
  powerCv: 239,
  weightKg: 1620,
  acceleration0to100: 7.9,
  reliabilityOcu: 89,
  warrantyYears: 7,
  residualPct5y: 0.52,
  aestheticsExterior: 2,
  aestheticsInterior: 4,
  travelComfort: 3,
});

export const x1Fixture = buildCar({
  id: 'bmw-x1-xdrive25e',
  name: 'X1 xDrive25e',
  brand: 'BMW',
  technology: 'PHEV',
  lengthMm: 4500,
  widthMm: 1845,
  wheelbaseMm: 2692,
  priceEur: 44000,
  consumption: 7.5,
  maintenanceEurYear: 750,
  powerCv: 245,
  weightKg: 1930,
  acceleration0to100: 6.8,
  reliabilityOcu: 87,
  warrantyYears: 3,
  residualPct5y: 0.4,
  aestheticsExterior: 5,
  aestheticsInterior: 5,
  travelComfort: 4,
});

export const ev3Fixture = buildCar({
  id: 'kia-ev3',
  name: 'EV3',
  brand: 'Kia',
  technology: 'EV',
  lengthMm: 4300,
  widthMm: 1850,
  wheelbaseMm: 2680,
  priceEur: 32000,
  consumption: 16,
  maintenanceEurYear: 250,
  powerCv: 204,
  weightKg: 1800,
  acceleration0to100: 7.7,
  reliabilityOcu: 89,
  warrantyYears: 7,
  residualPct5y: 0.4,
  aestheticsExterior: 5,
  aestheticsInterior: 3,
  travelComfort: 3,
});

export const threeCarFixture: Car[] = [sportageFixture, x1Fixture, ev3Fixture];
