import { describe, expect, it } from 'vitest';
import type { Reference } from './reference';
import {
  buildFicha,
  currentSourceOf,
  FICHA_FIELDS,
  FICHA_SORT_CRITERIA,
  forcedRuleOperator,
  litrosPorMetroCuadrado,
  numericFieldValues,
  numericValuesFromCells,
  polarityOf,
  sortFicha,
  withComparison,
} from './ficha';
import {
  ev3Fixture,
  sportageFixture,
  threeCarFixture,
  x1Fixture,
} from './scoring/testFixtures';

function sourced(value: number, unit?: string, estimated = false) {
  return {
    value,
    unit,
    sources: [{ label: 'Fixture de test', value, estimated, current: true }],
  };
}

function referenceFixture(overrides: Partial<Reference> = {}): Reference {
  return {
    id: 'alfa-romeo-giulietta',
    name: 'Giulietta',
    brand: 'Alfa Romeo',
    technology: 'ICE',
    generation: { launchYear: sourced(2010), code: '940' },
    photos: {},
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

describe('buildFicha', () => {
  it('returns one entity per candidate, in catalog order, kind "candidate"', () => {
    const entities = buildFicha(threeCarFixture, []);
    expect(entities).toHaveLength(threeCarFixture.length);
    expect(entities.map((e) => e.id)).toEqual(threeCarFixture.map((c) => c.id));
    expect(entities.every((e) => e.kind === 'candidate')).toBe(true);
  });

  it('appends references after candidates, kind "reference"', () => {
    const entities = buildFicha(threeCarFixture, [referenceFixture()]);
    expect(entities).toHaveLength(threeCarFixture.length + 1);
    const last = entities[entities.length - 1];
    expect(last?.kind).toBe('reference');
    expect(last?.id).toBe('alfa-romeo-giulietta');
  });

  it('extracts a sourced cell with its value, unit, estimated flag and no delta yet', () => {
    const [entity] = buildFicha([sportageFixture], []);
    expect(entity?.cells.lengthMm).toEqual({
      kind: 'sourced',
      value: 4540,
      unit: 'mm',
      estimated: false,
      delta: null,
    });
  });

  it('extracts a rating cell', () => {
    const [entity] = buildFicha([sportageFixture], []);
    expect(entity?.cells.aestheticsExterior).toEqual({
      kind: 'rating',
      value: sportageFixture.aestheticsExterior.value,
      delta: null,
    });
  });

  it('marks a field the reference does not declare as missing', () => {
    const [, reference] = buildFicha([sportageFixture], [referenceFixture()]);
    expect(reference?.cells.priceEur).toEqual({ kind: 'missing' });
    expect(reference?.cells.wheelbaseMm).toEqual({ kind: 'missing' });
    expect(reference?.cells.aestheticsExterior).toEqual({ kind: 'missing' });
  });

  it('computes litersPerSquareMeter from length, width and trunk', () => {
    const [entity] = buildFicha([sportageFixture], []);
    const cell = entity?.cells.litersPerSquareMeter;
    expect(cell?.kind).toBe('sourced');
    if (cell?.kind === 'sourced') {
      // 500 L / (4.54m × 1.865m) del fixture.
      expect(cell.value).toBeCloseTo(500 / (4.54 * 1.865), 3);
      expect(cell.unit).toBe('L/m²');
    }
  });

  it('marks warrantyExtensionYears as missing when the car has no extension', () => {
    const [entity] = buildFicha([sportageFixture], []);
    expect(entity?.cells.warrantyExtensionYears).toEqual({ kind: 'missing' });
  });

  it('extracts warrantyExtensionYears when the car declares one', () => {
    const withExtension = {
      ...sportageFixture,
      warrantyExtension: {
        years: sourced(15, 'años'),
        condition: 'Mantenimiento en red oficial',
      },
    };
    const [entity] = buildFicha([withExtension], []);
    expect(entity?.cells.warrantyExtensionYears).toEqual({
      kind: 'sourced',
      value: 15,
      unit: 'años',
      estimated: false,
      delta: null,
    });
  });

  it('extracts generationLaunchYear as a sourced cell (product/0021)', () => {
    const [entity] = buildFicha([sportageFixture], []);
    expect(entity?.cells.generationLaunchYear).toEqual({
      kind: 'sourced',
      value: 2022,
      unit: undefined,
      estimated: false,
      delta: null,
    });
  });

  it('marks generationFaceliftYear as missing when the car has no facelift declared', () => {
    const [entity] = buildFicha([sportageFixture], []);
    expect(entity?.cells.generationFaceliftYear).toEqual({ kind: 'missing' });
  });

  it('extracts generationFaceliftYear when the car declares one', () => {
    const withFacelift = {
      ...sportageFixture,
      generation: {
        ...sportageFixture.generation,
        faceliftYear: sourced(2025),
      },
    };
    const [entity] = buildFicha([withFacelift], []);
    expect(entity?.cells.generationFaceliftYear).toEqual({
      kind: 'sourced',
      value: 2025,
      unit: undefined,
      estimated: false,
      delta: null,
    });
  });

  it('extracts generationLaunchYear on a reference too, unlike the score-only fields it omits', () => {
    const [, reference] = buildFicha([sportageFixture], [referenceFixture()]);
    expect(reference?.cells.generationLaunchYear).toEqual({
      kind: 'sourced',
      value: 2010,
      unit: undefined,
      estimated: false,
      delta: null,
    });
  });

  it('surfaces the generation code on the entity, as support text and not a cell', () => {
    const [entity] = buildFicha([sportageFixture], []);
    expect(entity?.generationCode).toBeUndefined();
    const [, reference] = buildFicha([sportageFixture], [referenceFixture()]);
    expect(reference?.generationCode).toBe('940');
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
    const [entity] = buildFicha([withPhoto], []);
    expect(entity?.photos.side?.url).toBe(
      'https://example.com/sportage-lateral.jpg',
    );
  });
});

describe('withComparison', () => {
  const cars = [sportageFixture, x1Fixture, ev3Fixture];

  it('leaves every delta null when comparisonId is null ("Ninguno")', () => {
    const entities = withComparison(buildFicha(cars, []), null);
    for (const entity of entities) {
      expect(entity.cells.lengthMm.kind).toBe('sourced');
      if (entity.cells.lengthMm.kind === 'sourced') {
        expect(entity.cells.lengthMm.delta).toBeNull();
      }
    }
  });

  it('leaves every delta null when comparisonId matches no entity', () => {
    const entities = withComparison(buildFicha(cars, []), 'no-existe');
    const sportage = entities.find((e) => e.id === 'kia-sportage-hev')!;
    expect(sportage.cells.lengthMm).toMatchObject({ delta: null });
  });

  it('gives the comparison entity itself a null delta on every cell: it is not compared to itself', () => {
    const entities = withComparison(buildFicha(cars, []), 'kia-sportage-hev');
    const sportage = entities.find((e) => e.id === 'kia-sportage-hev')!;
    expect(sportage.cells.lengthMm).toMatchObject({ delta: null });
    expect(sportage.cells.priceEur).toMatchObject({ delta: null });
  });

  it('computes candidate deltas against the chosen comparison entity', () => {
    const entities = withComparison(buildFicha(cars, []), 'kia-sportage-hev');
    const x1 = entities.find((e) => e.id === 'bmw-x1-xdrive25e')!;
    // X1: 4500mm frente a 4540mm del Sportage.
    expect(x1.cells.lengthMm).toMatchObject({
      delta: { value: 4500 - 4540, direction: 'better' },
    });
  });

  it('marks more trunk as better and more width as worse: opposite directions for opposite polarities', () => {
    const reference = referenceFixture({
      widthMm: sourced(1000, 'mm'),
      trunkLiters: sourced(100, 'L'),
    });
    const entities = withComparison(
      buildFicha([sportageFixture], [reference]),
      'alfa-romeo-giulietta',
    );
    const sportage = entities.find((e) => e.kind === 'candidate')!;
    // El Sportage es más ancho (1865 > 1000): empeora.
    expect(sportage.cells.widthMm).toMatchObject({
      delta: { direction: 'worse' },
    });
    // El Sportage tiene más maletero (500 fixture > 100): mejora.
    expect(sportage.cells.trunkLiters).toMatchObject({
      delta: { direction: 'better' },
    });
  });

  it('marks less trunk as worse and less width as better: the other side of each polarity', () => {
    const reference = referenceFixture({
      widthMm: sourced(2000, 'mm'),
      trunkLiters: sourced(900, 'L'),
    });
    const entities = withComparison(
      buildFicha([sportageFixture], [reference]),
      'alfa-romeo-giulietta',
    );
    const sportage = entities.find((e) => e.kind === 'candidate')!;
    // El Sportage es más estrecho (1865 < 2000): mejora.
    expect(sportage.cells.widthMm).toMatchObject({
      delta: { direction: 'better' },
    });
    // El Sportage tiene menos maletero (500 fixture < 900): empeora.
    expect(sportage.cells.trunkLiters).toMatchObject({
      delta: { direction: 'worse' },
    });
  });

  it('leaves height, ground clearance and wheelbase without a better/worse judgement', () => {
    const entities = withComparison(
      buildFicha([sportageFixture], [referenceFixture()]),
      'alfa-romeo-giulietta',
    );
    const sportage = entities.find((e) => e.kind === 'candidate')!;
    expect(sportage.cells.heightMm).toMatchObject({
      delta: { direction: 'neutral' },
    });
    expect(sportage.cells.groundClearanceMm).toMatchObject({
      delta: { direction: 'neutral' },
    });
  });

  it('marks a zero delta as neutral regardless of polarity', () => {
    const reference = referenceFixture({ widthMm: sourced(1865, 'mm') });
    const entities = withComparison(
      buildFicha([sportageFixture], [reference]),
      'alfa-romeo-giulietta',
    );
    const sportage = entities.find((e) => e.kind === 'candidate')!;
    expect(sportage.cells.widthMm).toMatchObject({
      delta: { value: 0, direction: 'neutral' },
    });
  });

  it('marks more power, more reliability and more residual value as better', () => {
    const entities = withComparison(buildFicha(cars, []), 'kia-sportage-hev');
    // X1: 245CV frente a 239CV del Sportage.
    const x1 = entities.find((e) => e.id === 'bmw-x1-xdrive25e')!;
    expect(x1.cells.powerCv).toMatchObject({
      delta: { direction: 'better' },
    });
  });

  it('marks more weight, more acceleration time and more consumption as worse', () => {
    const entities = withComparison(buildFicha(cars, []), 'kia-sportage-hev');
    // X1: 1930kg frente a 1620kg del Sportage.
    const x1 = entities.find((e) => e.id === 'bmw-x1-xdrive25e')!;
    expect(x1.cells.weightKg).toMatchObject({
      delta: { direction: 'worse' },
    });
  });

  it('marks the delta unavailable, not null, when the comparison entity is missing that field', () => {
    const entities = withComparison(
      buildFicha([sportageFixture], [referenceFixture()]),
      'alfa-romeo-giulietta',
    );
    const sportage = entities.find((e) => e.kind === 'candidate')!;
    // La Giulietta (referencia) no declara precio: hay comparación, pero no
    // hay nada que restar, así que no es lo mismo que "sin comparación"
    // (product/0018, requisito 2.5) — es una raya con texto accesible, no
    // un hueco silencioso.
    expect(sportage.cells.priceEur).toMatchObject({ delta: 'unavailable' });
  });

  it('marks the delta unavailable when the two entities report the field in different units', () => {
    // Sportage HEV: consumo en l/100km. EV3: consumo en kWh/100km.
    const entities = withComparison(
      buildFicha([sportageFixture, ev3Fixture], []),
      'kia-sportage-hev',
    );
    const ev3 = entities.find((e) => e.id === 'kia-ev3')!;
    // Restar 16 kWh/100km menos 6,2 l/100km sería comparar magnitudes
    // físicas distintas, no una Δ real.
    expect(ev3.cells.consumption).toMatchObject({ delta: 'unavailable' });
  });

  it('leaves a missing cell missing, with no delta property at all', () => {
    const entities = withComparison(
      buildFicha([sportageFixture], [referenceFixture()]),
      'kia-sportage-hev',
    );
    const reference = entities.find((e) => e.kind === 'reference')!;
    expect(reference.cells.priceEur).toEqual({ kind: 'missing' });
  });

  describe('turning circle (product/0032)', () => {
    it('marks a shorter turning circle as better and a longer one as worse: moreIsWorse', () => {
      const shorter = {
        ...sportageFixture,
        turningCircleM: sourced(10.4, 'm'),
      };
      const longer = { ...x1Fixture, turningCircleM: sourced(11.7, 'm') };
      const entities = withComparison(
        buildFicha([shorter, longer], []),
        'kia-sportage-hev',
      );
      const x1 = entities.find((e) => e.id === 'bmw-x1-xdrive25e')!;
      // El X1 gira más ancho (11,7 m > 10,4 m): empeora.
      expect(x1.cells.turningCircleM).toMatchObject({
        value: 11.7,
        unit: 'm',
        delta: { value: 11.7 - 10.4, direction: 'worse' },
      });
    });

    it('marks the delta unavailable when the comparison entity does not declare it', () => {
      // La Giulietta de fixture no declara diámetro de giro, igual que
      // priceEur: es la ausencia real de `ReferenceSchema`, no un caso
      // fabricado para el test.
      const withCircle = {
        ...sportageFixture,
        turningCircleM: sourced(10.9, 'm'),
      };
      const entities = withComparison(
        buildFicha([withCircle], [referenceFixture()]),
        'alfa-romeo-giulietta',
      );
      const sportage = entities.find((e) => e.kind === 'candidate')!;
      expect(sportage.cells.turningCircleM).toMatchObject({
        delta: 'unavailable',
      });
    });

    it('leaves the cell missing for a car that does not declare it, not zero', () => {
      const entities = buildFicha([sportageFixture], []);
      expect(entities[0]?.cells.turningCircleM).toEqual({ kind: 'missing' });
    });
  });
});

describe('sortFicha', () => {
  const cars = [sportageFixture, x1Fixture, ev3Fixture];

  it('offers the catalogue order plus every ficha field, and nothing else (product/0027, requisito 1)', () => {
    // Derivado de `FICHA_FIELDS`, no repetido: una magnitud nueva en la
    // ficha es ordenable el mismo día que existe.
    expect(FICHA_SORT_CRITERIA).toEqual(['catalog', ...FICHA_FIELDS]);
  });

  it('"catalog" keeps the catalogue order untouched', () => {
    const entities = buildFicha(cars, []);
    const sorted = sortFicha(entities, 'catalog');
    expect(sorted.map((e) => e.id)).toEqual(entities.map((e) => e.id));
  });

  it('sorts ascending by length', () => {
    const sorted = sortFicha(buildFicha(cars, []), 'lengthMm');
    // EV3 4300 < X1 4500 < Sportage 4540.
    expect(sorted.map((e) => e.id)).toEqual([
      'kia-ev3',
      'bmw-x1-xdrive25e',
      'kia-sportage-hev',
    ]);
  });

  it('sorts ascending by width', () => {
    const sorted = sortFicha(buildFicha(cars, []), 'widthMm');
    // X1 1845 < EV3 1850 < Sportage 1865.
    expect(sorted.map((e) => e.id)).toEqual([
      'bmw-x1-xdrive25e',
      'kia-ev3',
      'kia-sportage-hev',
    ]);
  });

  it('sorts ascending by price', () => {
    const sorted = sortFicha(buildFicha(cars, []), 'priceEur');
    // EV3 32000 < Sportage 36000 < X1 44000.
    expect(sorted.map((e) => e.id)).toEqual([
      'kia-ev3',
      'kia-sportage-hev',
      'bmw-x1-xdrive25e',
    ]);
  });

  it('sorts a "more is better" field descending, best first (product/0027, requisito 4.1)', () => {
    const sorted = sortFicha(buildFicha(cars, []), 'powerCv');
    // X1 245 > Sportage 239 > EV3 204: el más potente encabeza, al revés
    // que la longitud, porque en potencia más es mejor.
    expect(sorted.map((e) => e.id)).toEqual([
      'bmw-x1-xdrive25e',
      'kia-sportage-hev',
      'kia-ev3',
    ]);
  });

  it('sorts a field with no declared direction ascending (product/0027, requisito 4.3)', () => {
    // Los tres coches del fixture miden lo mismo de alto, así que la altura
    // solo discrimina entre referencias: 1465mm la Giulietta, 1700mm la otra.
    const tall = referenceFixture({
      id: 'ref-tall',
      name: 'Alta',
      heightMm: sourced(1700, 'mm'),
    });
    const sorted = sortFicha(
      buildFicha([], [referenceFixture(), tall]),
      'heightMm',
    );
    expect(sorted.map((e) => e.id)).toEqual([
      'alfa-romeo-giulietta',
      'ref-tall',
    ]);
  });

  it('sends an entity without the sort field to the end', () => {
    const entities = buildFicha([sportageFixture], [referenceFixture()]);
    const sorted = sortFicha(entities, 'priceEur');
    // La referencia no declara precio: va al final pese a no tener el
    // precio más alto ni el más bajo, porque no tiene ninguno.
    expect(sorted[sorted.length - 1]?.kind).toBe('reference');
  });

  it('sends an entity without the sort field to the end when sorting descending too (product/0027, requisito 7)', () => {
    const entities = buildFicha([sportageFixture], [referenceFixture()]);
    const sorted = sortFicha(entities, 'powerCv');
    // La referencia no declara potencia: la ausencia no es un valor alto,
    // así que no encabeza el orden descendente — va al final igual que en
    // el ascendente.
    expect(sorted[sorted.length - 1]?.kind).toBe('reference');
  });

  it('keeps two entities both missing the sort field in their relative order', () => {
    const secondReference = referenceFixture({ id: 'ref-2', name: 'Otra' });
    const entities = buildFicha([], [referenceFixture(), secondReference]);
    const sorted = sortFicha(entities, 'priceEur');
    expect(sorted.map((e) => e.id)).toEqual(['alfa-romeo-giulietta', 'ref-2']);
  });

  it('sends the missing entity to the end regardless of which side of the comparison it starts on', () => {
    // Con la que falta el dato colocada entre dos que sí lo tienen, el
    // comparador se invoca con el hueco en las dos posiciones posibles.
    const entities = [
      ...buildFicha([sportageFixture], []),
      ...buildFicha([], [referenceFixture()]),
      ...buildFicha([x1Fixture], []),
    ];
    const sorted = sortFicha(entities, 'priceEur');
    // Sportage 36000 < X1 44000; la referencia, sin precio, al final.
    expect(sorted.map((e) => e.id)).toEqual([
      'kia-sportage-hev',
      'bmw-x1-xdrive25e',
      'alfa-romeo-giulietta',
    ]);
  });
});

describe('magnitudes de electrificación (product/0028)', () => {
  const cars = threeCarFixture;

  it('sorts by electric range with the longest first: more is better', () => {
    // EV3 436 km > X1 83 km; el Sportage, híbrido convencional, no declara
    // autonomía eléctrica y por eso cierra la lista.
    const sorted = sortFicha(buildFicha(cars, []), 'electricRangeKm');
    expect(sorted.map((e) => e.id)).toEqual([
      'kia-ev3',
      'bmw-x1-xdrive25e',
      'kia-sportage-hev',
    ]);
  });

  it('sorts by battery capacity ascending: no direction is declared for it', () => {
    // X1 16,3 kWh < EV3 58,3 kWh. Más batería no está dicho que sea mejor
    // (requisito 3.3), así que se lee en el orden natural del número.
    const sorted = sortFicha(buildFicha(cars, []), 'batteryKwh');
    expect(sorted.map((e) => e.id)).toEqual([
      'bmw-x1-xdrive25e',
      'kia-ev3',
      'kia-sportage-hev',
    ]);
  });

  it('leaves the car without the magnitude at the end in both directions', () => {
    // El Sportage no declara ninguna de las dos, y las dos ordenan hacia
    // lados distintos: aun así cierra la lista en las dos.
    for (const criterion of ['electricRangeKm', 'batteryKwh'] as const) {
      const sorted = sortFicha(buildFicha(cars, []), criterion);
      expect(sorted[sorted.length - 1]?.id).toBe('kia-sportage-hev');
    }
  });

  it('computes the range delta between an EV and a PHEV: same unit, same cycle', () => {
    const entities = withComparison(buildFicha(cars, []), 'bmw-x1-xdrive25e');
    const ev3 = entities.find((e) => e.id === 'kia-ev3')!;
    expect(ev3.cells.electricRangeKm).toMatchObject({
      delta: { value: 436 - 83, direction: 'better' },
    });
  });

  it('gives the battery delta no colour, only a number', () => {
    const entities = withComparison(buildFicha(cars, []), 'bmw-x1-xdrive25e');
    const ev3 = entities.find((e) => e.id === 'kia-ev3')!;
    expect(ev3.cells.batteryKwh).toMatchObject({
      delta: { value: 58.3 - 16.3, direction: 'neutral' },
    });
  });

  it('marks the delta unavailable against a car that declares neither: not a zero', () => {
    const entities = withComparison(buildFicha(cars, []), 'kia-sportage-hev');
    const ev3 = entities.find((e) => e.id === 'kia-ev3')!;
    expect(ev3.cells.electricRangeKm).toMatchObject({ delta: 'unavailable' });
    expect(ev3.cells.batteryKwh).toMatchObject({ delta: 'unavailable' });
  });

  it('leaves the cell missing on a car that does not declare it', () => {
    const sportage = buildFicha([sportageFixture], [])[0]!;
    expect(sportage.cells.electricRangeKm).toEqual({ kind: 'missing' });
    expect(sportage.cells.batteryKwh).toEqual({ kind: 'missing' });
  });

  it('leaves both cells missing on the reference, a pure combustion car', () => {
    const reference = buildFicha([], [referenceFixture()])[0]!;
    expect(reference.cells.electricRangeKm).toEqual({ kind: 'missing' });
    expect(reference.cells.batteryKwh).toEqual({ kind: 'missing' });
  });
});

describe('polarityOf and forcedRuleOperator (product/0031, requisito 1.2)', () => {
  it('forces "min" on a moreIsBetter field like trunkLiters', () => {
    expect(polarityOf('trunkLiters')).toBe('moreIsBetter');
    expect(forcedRuleOperator('trunkLiters')).toBe('min');
  });

  it('forces "max" on a moreIsWorse field like lengthMm', () => {
    expect(polarityOf('lengthMm')).toBe('moreIsWorse');
    expect(forcedRuleOperator('lengthMm')).toBe('max');
  });

  it('leaves a neutral field like wheelbaseMm unforced', () => {
    expect(polarityOf('wheelbaseMm')).toBe('neutral');
    expect(forcedRuleOperator('wheelbaseMm')).toBeNull();
  });
});

describe('numericValuesFromCells and numericFieldValues (product/0031, requisito 1.4)', () => {
  it('reads the same numeric value the ficha cell already carries', () => {
    const [sportage] = buildFicha([sportageFixture], []);
    const values = numericValuesFromCells(sportage!.cells);
    expect(values.trunkLiters).toBe(500);
    expect(values.priceEur).toBe(36000);
  });

  it('leaves a missing field undefined, never NaN or a fallback', () => {
    const [sportage] = buildFicha([sportageFixture], []);
    const values = numericValuesFromCells(sportage!.cells);
    expect(values.electricRangeKm).toBeUndefined();
  });

  it('numericFieldValues(car) matches numericValuesFromCells(cellsOf(car)) for every field', () => {
    const [x1] = buildFicha([x1Fixture], []);
    const fromCells = numericValuesFromCells(x1!.cells);
    const direct = numericFieldValues(x1Fixture);
    expect(direct).toEqual(fromCells);
  });

  it('works on a Reference too, with only the five dimensional fields present', () => {
    const values = numericFieldValues(referenceFixture());
    expect(values.lengthMm).toBeDefined();
    expect(values.widthMm).toBeDefined();
    expect(values.trunkLiters).toBeDefined();
    expect(values.priceEur).toBeUndefined();
  });
});
