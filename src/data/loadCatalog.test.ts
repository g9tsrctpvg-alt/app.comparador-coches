import { describe, expect, it } from 'vitest';
import {
  CatalogValidationError,
  loadCatalog,
  parseCatalog,
} from './loadCatalog';

describe('parseCatalog', () => {
  it('returns the parsed cars for a valid catalog', () => {
    const raw = [
      {
        id: 'kia-sportage-hev',
        name: 'Sportage HEV',
        brand: 'Kia',
        technology: 'HEV',
        lengthMm: 4540,
        widthMm: 1865,
        heightMm: 1645,
        trunkLiters: 587,
        priceEur: 36000,
      },
    ];

    expect(parseCatalog(raw)).toEqual(raw);
  });

  it('names the field and the record for a car with a wrong-typed field', () => {
    const raw = [
      {
        id: 'kia-sportage-hev',
        name: 'Sportage HEV',
        brand: 'Kia',
        technology: 'HEV',
        lengthMm: 4540,
        widthMm: 1865,
        heightMm: 1645,
        trunkLiters: 'quinientos ochenta y siete',
        priceEur: 36000,
      },
    ];

    expect(() => parseCatalog(raw)).toThrow(CatalogValidationError);
    expect(() => parseCatalog(raw)).toThrow(/kia-sportage-hev/);
    expect(() => parseCatalog(raw)).toThrow(/trunkLiters/);
  });

  it('falls back to the record index when it has no readable id', () => {
    const raw = [{ id: 123, trunkLiters: 'no numérico' }];

    expect(() => parseCatalog(raw)).toThrow(/índice 0/);
  });

  it('rejects a catalog that is not an array', () => {
    expect(() => parseCatalog({ not: 'an array' })).toThrow(
      CatalogValidationError,
    );
  });
});

describe('loadCatalog', () => {
  it('loads the bundled catalog without throwing', () => {
    const cars = loadCatalog();
    expect(cars.length).toBeGreaterThan(0);
  });
});
