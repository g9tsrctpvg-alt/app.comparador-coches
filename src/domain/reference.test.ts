import { describe, expect, it } from 'vitest';
import { ReferenceSchema } from './reference';

function sourced(value: number, unit?: string) {
  return {
    value,
    unit,
    sources: [
      {
        label: 'Fixture de test',
        value,
        estimated: false,
        current: true,
      },
    ],
  };
}

const validReference = {
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
};

describe('ReferenceSchema', () => {
  it('accepts a fully populated reference with single-source data', () => {
    const result = ReferenceSchema.safeParse(validReference);
    expect(result.success).toBe(true);
  });

  it('rejects a reference missing a required field', () => {
    const withoutWidth: Record<string, unknown> = { ...validReference };
    delete withoutWidth.widthMm;
    const result = ReferenceSchema.safeParse(withoutWidth);
    expect(result.success).toBe(false);
  });

  it('rejects a reference carrying score-only fields alongside the schema fields', () => {
    // No es un error de zod (los campos de más se ignoran), pero el tipo
    // inferido no los expone: es la propiedad que hace que `scoreCatalog`
    // no acepte una referencia sin recompilar.
    const result = ReferenceSchema.safeParse({
      ...validReference,
      priceEur: sourced(20000, '€'),
    });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty('priceEur');
  });

  it('enforces the same sourced-value invariants as CarSchema, e.g. exactly one current source', () => {
    const result = ReferenceSchema.safeParse({
      ...validReference,
      trunkLiters: {
        value: 350,
        sources: [
          { label: 'Fuente', value: 350, estimated: false, current: false },
        ],
      },
    });
    expect(result.success).toBe(false);
  });

  it('requires a generation, unlike the rest of the score-only fields it omits (product/0021)', () => {
    const withoutGeneration: Record<string, unknown> = { ...validReference };
    delete withoutGeneration.generation;
    const result = ReferenceSchema.safeParse(withoutGeneration);
    expect(result.success).toBe(false);
  });

  it('rejects a facelift year earlier than the launch year, same invariant as CarSchema', () => {
    const result = ReferenceSchema.safeParse({
      ...validReference,
      generation: {
        launchYear: sourced(2010),
        faceliftYear: sourced(2005),
      },
    });
    expect(result.success).toBe(false);
  });
});
