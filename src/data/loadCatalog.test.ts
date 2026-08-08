import { describe, expect, it } from 'vitest';
import {
  CatalogValidationError,
  loadCatalog,
  parseCatalog,
} from './loadCatalog';

function sourced(value: number, unit?: string) {
  return {
    value,
    unit,
    sources: [
      {
        label: 'Especificación del proyecto (julio 2026)',
        value,
        estimated: false,
        current: true,
      },
    ],
  };
}

function rating(value: number) {
  return { value, label: 'Valoración del usuario' };
}

function minimalCar(overrides: Record<string, unknown> = {}) {
  return {
    id: 'kia-sportage-hev',
    name: 'Sportage HEV',
    brand: 'Kia',
    technology: 'HEV',
    notes: [],
    published: true,
    lengthMm: sourced(4540, 'mm'),
    widthMm: sourced(1865, 'mm'),
    wheelbaseMm: sourced(2680, 'mm'),
    rearShoulderWidthMm: sourced(1390, 'mm'),
    heightMm: sourced(1645, 'mm'),
    groundClearanceMm: sourced(170, 'mm'),
    trunkLiters: sourced(587, 'L'),
    powerCv: sourced(239, 'CV'),
    weightKg: sourced(1620, 'kg'),
    acceleration0to100: sourced(7.9, 's'),
    consumption: sourced(6.2, 'l/100km'),
    maintenanceEurYear: sourced(400, '€/año'),
    priceEur: sourced(36000, '€'),
    reliabilityOcu: sourced(89),
    warrantyYears: sourced(7, 'años'),
    residualPct5y: sourced(0.52),
    aestheticsExterior: rating(2),
    aestheticsInterior: rating(4),
    photos: {},
    ...overrides,
  };
}

describe('parseCatalog', () => {
  it('returns the parsed cars for a valid catalog', () => {
    const raw = [minimalCar()];
    expect(parseCatalog(raw)).toEqual(raw);
  });

  it('names the field and the record for a car with a wrong-typed field', () => {
    const raw = [
      minimalCar({
        trunkLiters: {
          value: 'quinientos ochenta y siete',
          unit: 'L',
          sources: [
            {
              label: 'Especificación del proyecto (julio 2026)',
              value: 'quinientos ochenta y siete',
              estimated: false,
              current: true,
            },
          ],
        },
      }),
    ];

    expect(() => parseCatalog(raw)).toThrow(CatalogValidationError);
    expect(() => parseCatalog(raw)).toThrow(/kia-sportage-hev/);
    expect(() => parseCatalog(raw)).toThrow(/trunkLiters/);
  });

  it('falls back to the record index when it has no readable id', () => {
    const raw = [{ id: 123, trunkLiters: { value: 'no numérico' } }];

    expect(() => parseCatalog(raw)).toThrow(/índice 0/);
  });

  it('rejects a catalog that is not an array', () => {
    expect(() => parseCatalog({ not: 'an array' })).toThrow(
      CatalogValidationError,
    );
  });

  it('rejects an empty catalog, naming emptiness as the cause', () => {
    // Un `cars.json` truncado a `[]` validaba antes como catálogo correcto y
    // reventaba después, al normalizar contra cero candidatos.
    expect(() => parseCatalog([])).toThrow(CatalogValidationError);
    expect(() => parseCatalog([])).toThrow(/no puede estar vacío/);
  });

  it('rejects a datum whose value does not match its current source', () => {
    const raw = [
      minimalCar({
        trunkLiters: {
          value: 999,
          unit: 'L',
          sources: [
            { label: 'Fuente', value: 587, estimated: false, current: true },
          ],
        },
      }),
    ];
    expect(() => parseCatalog(raw)).toThrow(/trunkLiters/);
  });

  it('rejects a datum without exactly one current source', () => {
    const raw = [
      minimalCar({
        trunkLiters: {
          value: 587,
          unit: 'L',
          sources: [
            { label: 'Fuente', value: 587, estimated: false, current: false },
          ],
        },
      }),
    ];
    expect(() => parseCatalog(raw)).toThrow(CatalogValidationError);
  });

  it('accepts a car with no photos block at all', () => {
    const { photos: _photos, ...withoutPhotos } = minimalCar();
    const result = parseCatalog([withoutPhotos]);
    expect(result[0]?.photos).toEqual({});
  });

  it('rejects a photo whose URL is not https, naming the car and the view', () => {
    const raw = [
      minimalCar({
        photos: {
          front: {
            url: 'http://example.com/kia-sportage-frontal.jpg',
            credit: 'Kia Media',
            shows: 'Sportage HEV, gris',
          },
        },
      }),
    ];
    expect(() => parseCatalog(raw)).toThrow(CatalogValidationError);
    expect(() => parseCatalog(raw)).toThrow(/kia-sportage-hev/);
    expect(() => parseCatalog(raw)).toThrow(/photos\.front/);
  });

  it('rejects a photo without credit', () => {
    const raw = [
      minimalCar({
        photos: {
          side: {
            url: 'https://example.com/kia-sportage-lateral.jpg',
            credit: '',
            shows: 'Sportage HEV, gris',
          },
        },
      }),
    ];
    expect(() => parseCatalog(raw)).toThrow(/photos\.side\.credit/);
  });

  it('rejects a photo without shows', () => {
    const raw = [
      minimalCar({
        photos: {
          rear: {
            url: 'https://example.com/kia-sportage-trasera.jpg',
            credit: 'Kia Media',
            shows: '',
          },
        },
      }),
    ];
    expect(() => parseCatalog(raw)).toThrow(/photos\.rear\.shows/);
  });
});

describe('loadCatalog', () => {
  it('loads the bundled catalog without throwing, with all eleven candidates', () => {
    const cars = loadCatalog();
    expect(cars).toHaveLength(13);
  });
});
