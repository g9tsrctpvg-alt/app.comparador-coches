import { describe, expect, it } from 'vitest';
import type { Car } from './car';
import type { Reference } from './reference';
import {
  buildTechnicalSheet,
  currentSourceOf,
  litrosPorMetroCuadrado,
} from './technicalSheet';
import { sportageFixture, x1Fixture, ev3Fixture } from './scoring/testFixtures';
import { scoreCatalog } from './scoring/score';
import { DEFAULT_WEIGHTS } from './scoring/weights';
import { DEFAULT_ASSUMPTIONS } from './scoring/assumptions';

function sourced(value: number, unit?: string, estimated = false) {
  return {
    value,
    unit,
    sources: [{ label: 'Fixture de test', value, estimated, current: true }],
  };
}

function referenceFixture(overrides: Partial<Reference> = {}): Reference {
  return {
    id: 'ref-1',
    name: 'Referencia',
    brand: 'Marca',
    technology: 'ICE',
    lengthMm: sourced(4351, 'mm'),
    widthMm: sourced(1798, 'mm'),
    heightMm: sourced(1465, 'mm'),
    groundClearanceMm: sourced(130, 'mm', true),
    trunkLiters: sourced(350, 'L'),
    ...overrides,
  };
}

describe('litrosPorMetroCuadrado', () => {
  it('divides trunk liters by the footprint area, hand-checked with round numbers', () => {
    // 4m de largo × 2m de ancho = 8 m² de huella; 800L / 8m² = 100 L/m².
    expect(litrosPorMetroCuadrado(800, 4000, 2000)).toBeCloseTo(100, 10);
  });
});

const cars: Car[] = [sportageFixture, x1Fixture, ev3Fixture];

describe('buildTechnicalSheet', () => {
  it('returns one row per candidate plus one per reference', () => {
    const rows = buildTechnicalSheet(cars, [referenceFixture()]);
    expect(rows).toHaveLength(4);
    expect(rows.filter((r) => r.kind === 'reference')).toHaveLength(1);
    expect(rows.filter((r) => r.kind === 'candidate')).toHaveLength(3);
  });

  it('sorts all rows together by ascending length, reference included', () => {
    const rows = buildTechnicalSheet(cars, [referenceFixture()]);
    const lengths = rows.map((r) => r.lengthMm.valueMm);
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
  });

  it('gives the reference row a null delta on every dimension: it is not compared to itself', () => {
    const rows = buildTechnicalSheet(cars, [referenceFixture()]);
    const reference = rows.find((r) => r.kind === 'reference')!;
    expect(reference.lengthMm.delta).toBeNull();
    expect(reference.widthMm.delta).toBeNull();
    expect(reference.trunkLiters.delta).toBeNull();
  });

  it('computes candidate deltas against the current (first) reference', () => {
    const rows = buildTechnicalSheet(cars, [referenceFixture()]);
    const sportage = rows.find((r) => r.id === 'kia-sportage-hev')!;
    // Sportage: 4540mm de largo, la referencia fixture 4351mm.
    expect(sportage.lengthMm.delta?.value).toBe(4540 - 4351);
  });

  it('marks more trunk as better and more width as worse: opposite directions for opposite polarities', () => {
    const rows = buildTechnicalSheet(
      [sportageFixture],
      [
        referenceFixture({
          widthMm: sourced(1000, 'mm'),
          trunkLiters: sourced(100, 'L'),
        }),
      ],
    );
    const sportage = rows.find((r) => r.kind === 'candidate')!;
    // El Sportage es más ancho (1865 > 1000): empeora.
    expect(sportage.widthMm.delta?.direction).toBe('worse');
    // El Sportage tiene más maletero (587 fixture > 100): mejora.
    expect(sportage.trunkLiters.delta?.direction).toBe('better');
  });

  it('marks less trunk as worse and less width as better: the other side of each polarity', () => {
    const rows = buildTechnicalSheet(
      [sportageFixture],
      [
        referenceFixture({
          widthMm: sourced(2000, 'mm'),
          trunkLiters: sourced(900, 'L'),
        }),
      ],
    );
    const sportage = rows.find((r) => r.kind === 'candidate')!;
    // El Sportage es más estrecho (1865 < 2000): mejora.
    expect(sportage.widthMm.delta?.direction).toBe('better');
    // El Sportage tiene menos maletero (587 fixture < 900): empeora.
    expect(sportage.trunkLiters.delta?.direction).toBe('worse');
  });

  it('leaves height and ground clearance without a better/worse judgement', () => {
    const rows = buildTechnicalSheet([sportageFixture], [referenceFixture()]);
    const sportage = rows.find((r) => r.kind === 'candidate')!;
    expect(sportage.heightMm.delta?.direction).toBe('neutral');
    expect(sportage.groundClearanceMm.delta?.direction).toBe('neutral');
  });

  it('marks a zero delta as neutral regardless of polarity', () => {
    const rows = buildTechnicalSheet(
      [sportageFixture],
      [referenceFixture({ widthMm: sourced(1865, 'mm') })],
    );
    const sportage = rows.find((r) => r.kind === 'candidate')!;
    expect(sportage.widthMm.delta?.direction).toBe('neutral');
    expect(sportage.widthMm.delta?.value).toBe(0);
  });

  it('marks a candidate cell as estimated only when its current source is estimated', () => {
    const rows = buildTechnicalSheet([sportageFixture], [referenceFixture()]);
    const sportage = rows.find((r) => r.kind === 'candidate')!;
    expect(sportage.lengthMm.estimated).toBe(false);
  });

  it('marks the reference ground clearance as estimated, propagated from its source', () => {
    const rows = buildTechnicalSheet([sportageFixture], [referenceFixture()]);
    const reference = rows.find((r) => r.kind === 'reference')!;
    expect(reference.groundClearanceMm.estimated).toBe(true);
  });

  it('leaves every delta null when there is no reference', () => {
    const rows = buildTechnicalSheet(cars, []);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.lengthMm.delta).toBeNull();
    }
  });

  it('adding a second reference does not require touching this function: deltas still use the first', () => {
    const withOne = buildTechnicalSheet(
      [sportageFixture],
      [referenceFixture()],
    );
    const withTwo = buildTechnicalSheet(
      [sportageFixture],
      [
        referenceFixture(),
        referenceFixture({ id: 'ref-2', widthMm: sourced(2000, 'mm') }),
      ],
    );
    const deltaWithOne = withOne.find((r) => r.kind === 'candidate')!.widthMm
      .delta?.value;
    const deltaWithTwo = withTwo.find((r) => r.kind === 'candidate')!.widthMm
      .delta?.value;
    expect(deltaWithOne).toBe(deltaWithTwo);
    expect(withTwo.filter((r) => r.kind === 'reference')).toHaveLength(2);
  });
});

describe('currentSourceOf', () => {
  it('returns the source marked current', () => {
    const current = currentSourceOf(sourced(100, 'mm'));
    expect(current.value).toBe(100);
    expect(current.current).toBe(true);
  });

  it('throws a descriptive error when no source is marked current', () => {
    const broken = { value: 100, sources: [] };
    expect(() => currentSourceOf(broken)).toThrow(/fuente vigente/);
  });
});

describe('scoring stays untouched by references', () => {
  it('scoreCatalog does not accept a Reference in place of a Car: a type error, not a runtime check', () => {
    // Nunca se llama: lo único que importa es que `tsc` marque esta línea
    // como error. Si `Reference` se volviera asignable a `Car`, el
    // `@ts-expect-error` dejaría de tener error que suprimir y `npm run
    // typecheck` fallaría por eso.
    const neverCalled = (references: Reference[]): void => {
      // @ts-expect-error — una lista de referencias no es una lista de candidatos.
      scoreCatalog(references, DEFAULT_WEIGHTS, DEFAULT_ASSUMPTIONS, 47000);
    };
    expect(typeof neverCalled).toBe('function');
  });

  it('produces the same totals for the eleven candidates whether or not a reference has been registered', () => {
    const before = scoreCatalog(
      cars,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    buildTechnicalSheet(cars, [referenceFixture()]);
    const after = scoreCatalog(
      cars,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    expect(after).toEqual(before);
  });
});
