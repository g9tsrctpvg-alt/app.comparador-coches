import { describe, expect, it } from 'vitest';
import {
  ReferenceValidationError,
  loadReferences,
  parseReferences,
} from './loadReferences';

function sourced(value: number, unit?: string) {
  return {
    value,
    unit,
    sources: [
      {
        label: 'Fuente de test',
        value,
        estimated: false,
        current: true,
      },
    ],
  };
}

function minimalReference(overrides: Record<string, unknown> = {}) {
  return {
    id: 'alfa-romeo-giulietta',
    name: 'Giulietta',
    brand: 'Alfa Romeo',
    technology: 'ICE',
    generation: { launchYear: sourced(2010), code: '940' },
    lengthMm: sourced(4351, 'mm'),
    widthMm: sourced(1798, 'mm'),
    heightMm: sourced(1465, 'mm'),
    groundClearanceMm: sourced(130, 'mm'),
    trunkLiters: sourced(350, 'L'),
    photos: {},
    ...overrides,
  };
}

describe('parseReferences', () => {
  it('returns the parsed references for a valid list', () => {
    const raw = [minimalReference()];
    expect(parseReferences(raw)).toEqual(raw);
  });

  it('accepts an empty list: a reference is optional, unlike the candidate catalog', () => {
    expect(parseReferences([])).toEqual([]);
  });

  it('names the field and the record for a reference with a wrong-typed field', () => {
    const raw = [
      minimalReference({
        trunkLiters: {
          value: 'trescientos cincuenta',
          unit: 'L',
          sources: [
            {
              label: 'Fuente de test',
              value: 'trescientos cincuenta',
              estimated: false,
              current: true,
            },
          ],
        },
      }),
    ];

    expect(() => parseReferences(raw)).toThrow(ReferenceValidationError);
    expect(() => parseReferences(raw)).toThrow(/alfa-romeo-giulietta/);
    expect(() => parseReferences(raw)).toThrow(/trunkLiters/);
  });

  it('falls back to the record index when it has no readable id', () => {
    const raw = [{ id: 123, trunkLiters: { value: 'no numérico' } }];

    expect(() => parseReferences(raw)).toThrow(/índice 0/);
  });

  it('rejects a list that is not an array', () => {
    expect(() => parseReferences({ not: 'an array' })).toThrow(
      ReferenceValidationError,
    );
  });
});

describe('loadReferences', () => {
  it('loads the bundled references without throwing, with the Giulietta', () => {
    const references = loadReferences();
    expect(references).toHaveLength(1);
    expect(references[0]?.id).toBe('alfa-romeo-giulietta');
  });

  it('marks the ground clearance as estimated, per the original artifact', () => {
    const [giulietta] = loadReferences();
    const current = giulietta?.groundClearanceMm.sources.find(
      (source) => source.current,
    );
    expect(current?.estimated).toBe(true);
  });

  it('marks length, width, height and trunk as sourced, not estimated', () => {
    const [giulietta] = loadReferences();
    for (const field of [
      'lengthMm',
      'widthMm',
      'heightMm',
      'trunkLiters',
    ] as const) {
      const current = giulietta?.[field].sources.find((s) => s.current);
      expect(current?.estimated).toBe(false);
    }
  });
});
