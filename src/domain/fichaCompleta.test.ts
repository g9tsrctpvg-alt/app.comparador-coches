import { describe, expect, it } from 'vitest';
import { buildFichaCompleta } from './fichaCompleta';
import { sportageFixture, threeCarFixture } from './scoring/testFixtures';
import type { Reference } from './reference';

function referenceFixture(overrides: Partial<Reference> = {}): Reference {
  return {
    id: 'alfa-romeo-giulietta',
    name: 'Giulietta',
    brand: 'Alfa Romeo',
    technology: 'ICE',
    photos: {},
    lengthMm: {
      value: 4351,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 4351, estimated: false, current: true },
      ],
    },
    widthMm: {
      value: 1798,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 1798, estimated: false, current: true },
      ],
    },
    heightMm: {
      value: 1465,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 1465, estimated: false, current: true },
      ],
    },
    groundClearanceMm: {
      value: 130,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 130, estimated: true, current: true },
      ],
    },
    trunkLiters: {
      value: 350,
      unit: 'L',
      sources: [
        { label: 'Fixture', value: 350, estimated: false, current: true },
      ],
    },
    ...overrides,
  };
}

describe('buildFichaCompleta', () => {
  it('returns one entity per candidate, in catalog order, kind "candidate"', () => {
    const entities = buildFichaCompleta(threeCarFixture, []);
    expect(entities).toHaveLength(threeCarFixture.length);
    expect(entities.map((e) => e.id)).toEqual(threeCarFixture.map((c) => c.id));
    expect(entities.every((e) => e.kind === 'candidate')).toBe(true);
  });

  it('appends references after candidates, kind "reference"', () => {
    const entities = buildFichaCompleta(threeCarFixture, [referenceFixture()]);
    expect(entities).toHaveLength(threeCarFixture.length + 1);
    const last = entities[entities.length - 1];
    expect(last?.kind).toBe('reference');
    expect(last?.id).toBe('alfa-romeo-giulietta');
  });

  it('extracts a sourced cell with its value, unit and estimated flag', () => {
    const [entity] = buildFichaCompleta([sportageFixture], []);
    expect(entity?.cells.lengthMm).toEqual({
      kind: 'sourced',
      value: 4540,
      unit: 'mm',
      estimated: false,
    });
  });

  it('extracts a rating cell', () => {
    const [entity] = buildFichaCompleta([sportageFixture], []);
    expect(entity?.cells.aestheticsExterior).toEqual({
      kind: 'rating',
      value: sportageFixture.aestheticsExterior.value,
    });
  });

  it('marks a field the reference does not declare as missing', () => {
    const [, reference] = buildFichaCompleta(
      [sportageFixture],
      [referenceFixture()],
    );
    expect(reference?.cells.priceEur).toEqual({ kind: 'missing' });
    expect(reference?.cells.wheelbaseMm).toEqual({ kind: 'missing' });
    expect(reference?.cells.aestheticsExterior).toEqual({ kind: 'missing' });
  });

  it('computes litersPerSquareMeter from length, width and trunk', () => {
    const [entity] = buildFichaCompleta([sportageFixture], []);
    const cell = entity?.cells.litersPerSquareMeter;
    expect(cell?.kind).toBe('sourced');
    if (cell?.kind === 'sourced') {
      // 500 L / (4.54m × 1.865m) del fixture.
      expect(cell.value).toBeCloseTo(500 / (4.54 * 1.865), 3);
      expect(cell.unit).toBe('L/m²');
    }
  });

  it('marks warrantyExtensionYears as missing when the car has no extension', () => {
    const [entity] = buildFichaCompleta([sportageFixture], []);
    expect(entity?.cells.warrantyExtensionYears).toEqual({ kind: 'missing' });
  });

  it('extracts warrantyExtensionYears when the car declares one', () => {
    const withExtension = {
      ...sportageFixture,
      warrantyExtension: {
        years: {
          value: 15,
          unit: 'años',
          sources: [
            { label: 'Fixture', value: 15, estimated: false, current: true },
          ],
        },
        condition: 'Mantenimiento en red oficial',
      },
    };
    const [entity] = buildFichaCompleta([withExtension], []);
    expect(entity?.cells.warrantyExtensionYears).toEqual({
      kind: 'sourced',
      value: 15,
      unit: 'años',
      estimated: false,
    });
  });

  it('carries the photos block through unchanged', () => {
    const withPhoto = {
      ...sportageFixture,
      photos: {
        side: {
          url: 'https://example.com/sportage-lateral.jpg',
          credit: 'Kia Media',
          shows: 'Sportage HEV, gris',
        },
      },
    };
    const [entity] = buildFichaCompleta([withPhoto], []);
    expect(entity?.photos.side?.url).toBe(
      'https://example.com/sportage-lateral.jpg',
    );
  });
});
