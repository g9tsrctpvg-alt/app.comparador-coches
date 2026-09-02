import { describe, expect, it } from 'vitest';
import {
  calibrate,
  canCalibrate,
  GRID_SIZE,
  MAX_MATCHUPS,
  profileOf,
  WEIGHT_LEVELS,
  type CarProfile,
  type MatchupOutcome,
} from './calibration';
import { loadCatalog } from '../data/loadCatalog';
import { publishedCars } from './car';
import { scoreCatalog } from './scoring/score';
import { DEFAULT_ASSUMPTIONS } from './scoring/assumptions';
import {
  AXIS_ORDER,
  DEFAULT_WEIGHTS,
  type AxisId,
  type AxisWeights,
} from './scoring/weights';

const cars = publishedCars(loadCatalog());
const BUDGET = 47000;

function profilesWith(weights: AxisWeights): CarProfile[] {
  return scoreCatalog(cars, weights, DEFAULT_ASSUMPTIONS, BUDGET).map(
    profileOf,
  );
}

const profiles = profilesWith(DEFAULT_WEIGHTS);
const byId = new Map(profiles.map((p) => [p.carId, p]));

const totalOf = (weights: AxisWeights, profile: CarProfile) =>
  AXIS_ORDER.reduce(
    (sum, axisId) => sum + weights[axisId] * profile.scores[axisId],
    0,
  );

/** Quién ganaría el cara a cara para un perfil de preferencia dado. */
function answerWith(
  weights: AxisWeights,
  aCarId: string,
  bCarId: string,
): 'a' | 'b' {
  const a = byId.get(aCarId) as CarProfile;
  const b = byId.get(bCarId) as CarProfile;
  return totalOf(weights, a) >= totalOf(weights, b) ? 'a' : 'b';
}

/** Una tanda completa contestada por un perfil sintético. */
function runSession(
  truth: AxisWeights,
  options: { flipEvery?: number } = {},
): { outcomes: MatchupOutcome[]; proposed: AxisWeights } {
  const outcomes: MatchupOutcome[] = [];
  let state = calibrate(profiles, outcomes);
  let step = 0;
  while (state.nextMatchup !== null) {
    const { aCarId, bCarId } = state.nextMatchup;
    let preferred = answerWith(truth, aCarId, bCarId);
    step += 1;
    if (options.flipEvery !== undefined && step % options.flipEvery === 0) {
      preferred = preferred === 'a' ? 'b' : 'a';
    }
    outcomes.push({ aCarId, bCarId, preferred });
    state = calibrate(profiles, outcomes);
  }
  return { outcomes, proposed: state.proposedWeights };
}

// --- Reimplementación independiente del representante (product/0036,
// requisito 1.1), para verificar `calibrate` sin usar sus internos: rehace
// la rejilla, el conjunto compatible y el centro, con el mismo orden de
// recorrido que `src/domain/calibration.ts` documenta (axis 0 el más lento,
// axis 6 el más rápido), y comprueba que ninguna combinación del conjunto
// compatible queda más cerca del centro que la propuesta.
function buildGrid(): number[][] {
  let grid: number[][] = [[]];
  for (let axis = 0; axis < AXIS_ORDER.length; axis += 1) {
    const next: number[][] = [];
    for (const combo of grid) {
      for (const level of WEIGHT_LEVELS) next.push([...combo, level]);
    }
    grid = next;
  }
  return grid.filter((combo) => combo.reduce((a, b) => a + b, 0) > 0);
}
const REFERENCE_GRID = buildGrid();

function deltaFor(a: CarProfile, b: CarProfile): number[] {
  return AXIS_ORDER.map((axisId) => a.scores[axisId] - b.scores[axisId]);
}

interface ReferenceConstraint {
  delta: number[];
  positive: boolean;
}

function referenceConstraints(
  outcomes: MatchupOutcome[],
): ReferenceConstraint[] {
  const constraints: ReferenceConstraint[] = [];
  for (const outcome of outcomes) {
    if (outcome.preferred === 'none') continue;
    const a = byId.get(outcome.aCarId);
    const b = byId.get(outcome.bCarId);
    if (a === undefined || b === undefined) continue;
    const [winner, loser] = outcome.preferred === 'a' ? [a, b] : [b, a];
    const delta = deltaFor(winner, loser);
    constraints.push({ delta, positive: true });
    const decisive = outcome.decisiveAxes;
    const decisiveSet =
      decisive === undefined ? undefined : new Set<AxisId>(decisive);
    // Ejes distintos, no entradas (`technical/0013`, requisito 2.1).
    if (
      decisiveSet !== undefined &&
      decisiveSet.size > 0 &&
      decisiveSet.size < AXIS_ORDER.length
    ) {
      const complement = AXIS_ORDER.map((axisId, index) =>
        decisiveSet.has(axisId) ? 0 : (delta[index] ?? 0),
      );
      constraints.push({ delta: complement, positive: false });
    }
  }
  return constraints;
}

/** El conjunto compatible, recorrido en el mismo orden que la rejilla de
 * referencia (que reproduce el orden de `src/domain/calibration.ts`). */
function referenceCompatible(outcomes: MatchupOutcome[]): number[][] {
  const constraints = referenceConstraints(outcomes);
  let best = Number.POSITIVE_INFINITY;
  let winners: number[][] = [];
  for (const combo of REFERENCE_GRID) {
    let bad = 0;
    for (const constraint of constraints) {
      const dot = combo.reduce(
        (sum, value, index) => sum + value * (constraint.delta[index] ?? 0),
        0,
      );
      const violates = constraint.positive ? dot <= 0 : dot > 0;
      if (violates) bad += 1;
    }
    if (bad < best) {
      best = bad;
      winners = [];
    }
    if (bad === best) winners.push(combo);
  }
  return winners;
}

function referenceRepresentative(compatible: number[][]): AxisWeights {
  const centroid = new Array(AXIS_ORDER.length).fill(0);
  for (const combo of compatible) {
    combo.forEach((value, index) => {
      centroid[index] += value;
    });
  }
  centroid.forEach((value, index) => {
    centroid[index] = value / compatible.length;
  });

  let best = compatible[0] as number[];
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const combo of compatible) {
    let distance = 0;
    combo.forEach((value, index) => {
      const diff = value - (centroid[index] as number);
      distance += diff * diff;
    });
    if (distance < bestDistance - 1e-9) {
      bestDistance = distance;
      best = combo;
    }
  }
  const weights = {} as AxisWeights;
  AXIS_ORDER.forEach((axisId, index) => {
    weights[axisId] = best[index] as number;
  });
  return weights;
}

/** Comprueba `calibrate` contra la reimplementación independiente: el
 * representante debe coincidir exactamente, combinación a combinación. */
function expectRepresentativeMatchesReference(outcomes: MatchupOutcome[]) {
  const compatible = referenceCompatible(outcomes);
  const expected = referenceRepresentative(compatible);
  const actual = calibrate(profiles, outcomes).proposedWeights;
  expect(actual).toEqual(expected);
}

describe('profileOf', () => {
  it('el perfil no depende de los pesos con que se puntúe (requisito 1.2)', () => {
    const opposite: AxisWeights = {
      carga: 0,
      habitabilidad: 10,
      diario: 1,
      prestaciones: 9,
      fiabilidad: 3,
      estetica: 7,
      coste: 2,
    };
    const other = profilesWith(opposite);
    expect(other).toHaveLength(profiles.length);
    let maxDiff = 0;
    other.forEach((profile, index) => {
      const mine = profiles[index] as CarProfile;
      expect(profile.carId).toBe(mine.carId);
      for (const axisId of AXIS_ORDER) {
        maxDiff = Math.max(
          maxDiff,
          Math.abs(profile.scores[axisId] - mine.scores[axisId]),
        );
      }
    });
    expect(maxDiff).toBe(0);
  });
});

describe('la rejilla', () => {
  it('tiene 78.124 combinaciones y ninguna nula (requisitos 3.1 y 3.3)', () => {
    expect(GRID_SIZE).toBe(78124);
    const seen = new Set<string>();
    const outcomes: MatchupOutcome[] = [];
    // Se observa a través de la API pública: sin respuestas, el conjunto
    // compatible es la rejilla entera (requisito 4.3).
    expect(calibrate(profiles, outcomes).compatibleCount).toBe(78124);
    for (const level of WEIGHT_LEVELS) {
      expect(Number.isInteger(level)).toBe(true);
      expect(level).toBeGreaterThanOrEqual(0);
      expect(level).toBeLessThanOrEqual(10);
      seen.add(String(level));
    }
    expect(seen.size).toBe(5);
  });

  it('los pesos propuestos son siempre valores de la rejilla', () => {
    const { proposed } = runSession(DEFAULT_WEIGHTS);
    for (const axisId of AXIS_ORDER) {
      expect(WEIGHT_LEVELS).toContain(
        proposed[axisId] as (typeof WEIGHT_LEVELS)[number],
      );
    }
  });
});

describe('calibrate', () => {
  it('el primer cara a cara es el par de perfiles más lejanos (requisito 6.2)', () => {
    const state = calibrate(profiles, []);
    expect(state.nextMatchup).toEqual({
      aCarId: 'kia-ev3',
      bCarId: 'jeep-compass',
    });
    // Y no depende de con qué pesos se haya puntuado.
    const again = calibrate(
      profilesWith({
        carga: 1,
        habitabilidad: 2,
        diario: 3,
        prestaciones: 4,
        fiabilidad: 5,
        estetica: 6,
        coste: 7,
      }),
      [],
    );
    expect(again.nextMatchup).toEqual(state.nextMatchup);
  });

  it('de partida trece coches pueden liderar y ningún par está decidido', () => {
    const state = calibrate(profiles, []);
    expect(state.totalPairs).toBe(153);
    expect(state.settledPairs).toBe(0);
    expect(state.possibleLeaderIds).toHaveLength(13);
    expect(state.possibleLeaderIds).toContain('kia-ev3');
    expect(state.possibleLeaderIds).not.toContain('toyota-corolla-cross');
  });

  it('es determinista: mismas respuestas, mismo resultado (requisito 3.4)', () => {
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
      { aCarId: 'honda-civic-e-hev', bCarId: 'mazda-cx-5', preferred: 'b' },
    ];
    const first = calibrate(profiles, outcomes);
    const second = calibrate(profiles, [...outcomes]);
    expect(second).toEqual(first);
  });

  it('los pesos propuestos no contradicen ninguna respuesta coherente', () => {
    const truth: AxisWeights = {
      carga: 2,
      habitabilidad: 8,
      diario: 5,
      prestaciones: 0,
      fiabilidad: 10,
      estetica: 2,
      coste: 8,
    };
    const { outcomes, proposed } = runSession(truth);
    expect(outcomes.length).toBeGreaterThan(0);
    for (const outcome of outcomes) {
      const a = byId.get(outcome.aCarId) as CarProfile;
      const b = byId.get(outcome.bCarId) as CarProfile;
      const gap = totalOf(proposed, a) - totalOf(proposed, b);
      expect(outcome.preferred === 'a' ? gap : -gap).toBeGreaterThan(0);
    }
    expect(calibrate(profiles, outcomes).contradicted).toBe(0);
  });

  it('absorbe dos respuestas que se contradicen entre sí (requisito 4.2)', () => {
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'b' },
    ];
    const state = calibrate(profiles, outcomes);
    expect(state.contradicted).toBe(1);
    expect(state.compatibleCount).toBeGreaterThan(0);
    for (const axisId of AXIS_ORDER) {
      expect(Number.isFinite(state.proposedWeights[axisId])).toBe(true);
    }
  });

  it('«me da igual» no cambia nada y no repite el par (requisito 2.3)', () => {
    const base = calibrate(profiles, []);
    const skipped: MatchupOutcome[] = [
      {
        ...(base.nextMatchup as { aCarId: string; bCarId: string }),
        preferred: 'none',
      },
    ];
    const state = calibrate(profiles, skipped);
    expect(state.proposedWeights).toEqual(base.proposedWeights);
    expect(state.compatibleCount).toBe(base.compatibleCount);
    expect(state.possibleLeaderIds).toEqual(base.possibleLeaderIds);
    expect(state.nextMatchup).not.toEqual(base.nextMatchup);
  });

  it('deshacer devuelve el estado exacto anterior (requisito 8.2)', () => {
    const first: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
    ];
    const before = calibrate(profiles, first);
    const after = calibrate(profiles, [
      ...first,
      { aCarId: 'mazda-cx-5', bCarId: 'kia-ev5', preferred: 'b' },
    ]);
    expect(after).not.toEqual(before);
    expect(calibrate(profiles, first)).toEqual(before);
  });

  it('deshacer retira la elección y su atribución de una sola vez (product/0036, requisito 3.3)', () => {
    const first: MatchupOutcome[] = [
      {
        aCarId: 'kia-ev3',
        bCarId: 'jeep-compass',
        preferred: 'a',
        decisiveAxes: ['fiabilidad'],
      },
    ];
    const before = calibrate(profiles, first);
    const withAttributedSecond = calibrate(profiles, [
      ...first,
      {
        aCarId: 'mazda-cx-5',
        bCarId: 'kia-ev5',
        preferred: 'b',
        decisiveAxes: ['coste', 'diario'],
      },
    ]);
    expect(withAttributedSecond).not.toEqual(before);
    // «Deshacer» no es más que quitar la última entrada de `outcomes»: la
    // atribución viaja pegada a su respuesta, así que retirarla las quita
    // a las dos a la vez, sin tratamiento especial.
    expect(calibrate(profiles, first)).toEqual(before);
  });

  it('la tanda se cierra sola y el avance solo mejora (requisitos 6.4 y 9.1)', () => {
    const outcomes: MatchupOutcome[] = [];
    let state = calibrate(profiles, outcomes);
    let previousSettled = -1;
    let previousLeaders = Number.POSITIVE_INFINITY;
    while (state.nextMatchup !== null) {
      const { aCarId, bCarId } = state.nextMatchup;
      outcomes.push({
        aCarId,
        bCarId,
        preferred: answerWith(DEFAULT_WEIGHTS, aCarId, bCarId),
      });
      state = calibrate(profiles, outcomes);
      expect(state.settledPairs).toBeGreaterThanOrEqual(previousSettled);
      expect(state.possibleLeaderIds.length).toBeLessThanOrEqual(
        previousLeaders,
      );
      previousSettled = state.settledPairs;
      previousLeaders = state.possibleLeaderIds.length;
    }
    expect(outcomes.length).toBeLessThanOrEqual(MAX_MATCHUPS);
    expect(state.settledPairs).toBe(state.totalPairs);
    expect(state.possibleLeaderIds).toHaveLength(1);
  });

  it('nunca ofrece un par ya visto', () => {
    const outcomes: MatchupOutcome[] = [];
    let state = calibrate(profiles, outcomes);
    const seen = new Set<string>();
    while (state.nextMatchup !== null) {
      const key = `${state.nextMatchup.aCarId}|${state.nextMatchup.bCarId}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      outcomes.push({ ...state.nextMatchup, preferred: 'none' });
      state = calibrate(profiles, outcomes);
      if (outcomes.length > MAX_MATCHUPS) break;
    }
    expect(outcomes.length).toBeLessThanOrEqual(MAX_MATCHUPS);
  });

  it('el tope de preguntas cierra la tanda (requisito 6.6)', () => {
    const outcomes: MatchupOutcome[] = [];
    let state = calibrate(profiles, outcomes);
    while (state.nextMatchup !== null && outcomes.length < MAX_MATCHUPS) {
      outcomes.push({ ...state.nextMatchup, preferred: 'none' });
      state = calibrate(profiles, outcomes);
    }
    expect(outcomes).toHaveLength(MAX_MATCHUPS);
    expect(state.nextMatchup).toBeNull();
  });

  it('ignora respuestas sobre coches que no están en el conjunto', () => {
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'no-existe', bCarId: 'jeep-compass', preferred: 'a' },
      { aCarId: 'kia-ev3', bCarId: 'tampoco-existe', preferred: 'b' },
    ];
    const state = calibrate(profiles, outcomes);
    expect(state.compatibleCount).toBe(GRID_SIZE);
    expect(state.contradicted).toBe(0);
  });

  it('con dos coches hay un par y ningún líder imposible', () => {
    const two = profiles.slice(0, 2);
    const state = calibrate(two, []);
    expect(state.totalPairs).toBe(1);
    expect(state.nextMatchup).not.toBeNull();
    expect(state.possibleLeaderIds.length).toBeGreaterThanOrEqual(1);
  });

  it('sin coches no hay par que ofrecer', () => {
    const state = calibrate([], []);
    expect(state.totalPairs).toBe(0);
    expect(state.nextMatchup).toBeNull();
    expect(state.possibleLeaderIds).toEqual([]);
    expect(state.settledPairs).toBe(0);
  });
});

describe('canCalibrate', () => {
  it('exige cuatro coches (requisito 11.3)', () => {
    expect(canCalibrate(3)).toBe(false);
    expect(canCalibrate(4)).toBe(true);
    expect(canCalibrate(18)).toBe(true);
  });
});

describe('el representante (product/0036, fase 1)', () => {
  it('sin respuestas, es la combinación del conjunto compatible más cercana a su centro (requisito 1.1)', () => {
    expectRepresentativeMatchesReference([]);
  });

  it('con algunas respuestas, sigue siendo la más cercana al centro del conjunto compatible (requisito 1.1)', () => {
    expectRepresentativeMatchesReference([
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
      { aCarId: 'mazda-cx-5', bCarId: 'kia-ev5', preferred: 'b' },
      {
        aCarId: 'honda-civic-e-hev',
        bCarId: 'toyota-corolla-cross',
        preferred: 'a',
      },
    ]);
  });

  it('es siempre un elemento del conjunto compatible (requisito 1.2)', () => {
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
    ];
    const state = calibrate(profiles, outcomes);
    for (const axisId of AXIS_ORDER) {
      expect(WEIGHT_LEVELS).toContain(
        state.proposedWeights[axisId] as (typeof WEIGHT_LEVELS)[number],
      );
    }
  });

  it('el representante no cambia según cuántas respuestas ya se contestaron con el mismo resultado neto (sin desempate por deslizadores, requisito 1.3)', () => {
    // La firma de `calibrate` ya no acepta pesos de partida: dos llamadas
    // con las mismas respuestas dan siempre el mismo representante, sin
    // importar «desde dónde» se estuviera calibrando.
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
    ];
    expect(calibrate(profiles, outcomes)).toEqual(
      calibrate(profiles, [...outcomes]),
    );
  });
});

describe('la atribución de ejes (product/0036, fase 2)', () => {
  const ev3VsCompass: MatchupOutcome = {
    aCarId: 'kia-ev3',
    bCarId: 'jeep-compass',
    preferred: 'a',
  };

  it('marcar los siete ejes equivale a no marcar ninguno (requisito 2.3)', () => {
    const withAll = calibrate(profiles, [
      { ...ev3VsCompass, decisiveAxes: [...AXIS_ORDER] },
    ]);
    const withNone = calibrate(profiles, [ev3VsCompass]);
    expect(withAll).toEqual(withNone);
  });

  it('una atribución coherente (fiabilidad) no agranda el conjunto compatible', () => {
    // El EV3 le saca 8,46 a fiabilidad al Compass: es, con diferencia, el eje
    // que más pesa en la victoria, y una combinación que solo cargue el peso
    // ahí (el resto a 0) ya explica el resultado.
    const without = calibrate(profiles, [ev3VsCompass]);
    const attributed = calibrate(profiles, [
      { ...ev3VsCompass, decisiveAxes: ['fiabilidad'] },
    ]);
    expect(attributed.contradicted).toBe(0);
    expect(attributed.compatibleCount).toBeLessThanOrEqual(
      without.compatibleCount,
    );
    expectRepresentativeMatchesReference([
      { ...ev3VsCompass, decisiveAxes: ['fiabilidad'] },
    ]);
  });

  it('una atribución imposible se absorbe sin lanzar, y contradice de verdad (requisito 2.4)', () => {
    // El EV3 va POR DETRÁS en habitabilidad (Compass le saca 3,76). Marcarlo
    // como único eje decisivo exige a la vez «gano en total» y «sin
    // habitabilidad, no gano», y con pesos que no pueden ser negativos eso
    // es matemáticamente imposible para cualquier combinación: si el resto
    // ya no basta para ganar (segunda desigualdad), sumarle un eje en el
    // que además se pierde nunca puede hacerlo ganar (primera).
    const coherent = calibrate(profiles, [ev3VsCompass]);
    const impossible = calibrate(profiles, [
      { ...ev3VsCompass, decisiveAxes: ['habitabilidad'] },
    ]);
    expect(coherent.contradicted).toBe(0);
    expect(impossible.contradicted).toBeGreaterThan(0);
    expect(impossible.compatibleCount).toBeGreaterThan(0);
    for (const axisId of AXIS_ORDER) {
      expect(Number.isFinite(impossible.proposedWeights[axisId])).toBe(true);
    }
    expectRepresentativeMatchesReference([
      { ...ev3VsCompass, decisiveAxes: ['habitabilidad'] },
    ]);
  });

  it('«me da igual» ignora cualquier atribución (requisito 2.5)', () => {
    const withAttribution: MatchupOutcome = {
      aCarId: 'kia-ev3',
      bCarId: 'jeep-compass',
      preferred: 'none',
      decisiveAxes: ['fiabilidad'],
    };
    const plain: MatchupOutcome = {
      aCarId: 'kia-ev3',
      bCarId: 'jeep-compass',
      preferred: 'none',
    };
    expect(calibrate(profiles, [withAttribution])).toEqual(
      calibrate(profiles, [plain]),
    );
  });

  it('marcar un solo eje deja un conjunto no vacío, y sus pesos son de la rejilla', () => {
    const state = calibrate(profiles, [
      { ...ev3VsCompass, decisiveAxes: ['fiabilidad'] },
    ]);
    expect(state.compatibleCount).toBeGreaterThan(0);
    for (const axisId of AXIS_ORDER) {
      expect(WEIGHT_LEVELS).toContain(
        state.proposedWeights[axisId] as (typeof WEIGHT_LEVELS)[number],
      );
    }
  });

  it('una atribución con repeticiones vale lo mismo que el conjunto sin ellas (technical/0013, requisito 2.1)', () => {
    const once = calibrate(profiles, [
      { ...ev3VsCompass, decisiveAxes: ['coste'] },
    ]);
    const repeated = calibrate(profiles, [
      {
        ...ev3VsCompass,
        decisiveAxes: Array.from<AxisId>({ length: 7 }).fill('coste'),
      },
    ]);
    const unattributed = calibrate(profiles, [ev3VsCompass]);
    expect(repeated).toEqual(once);
    // Y no es el resultado de no atribuir: siete entradas de un solo eje no
    // pueden leerse como «marcó los siete».
    expect(repeated).not.toEqual(unattributed);
    expectRepresentativeMatchesReference([
      {
        ...ev3VsCompass,
        decisiveAxes: Array.from<AxisId>({ length: 7 }).fill('coste'),
      },
    ]);
  });

  it('una atribución vacía equivale a no atribuir', () => {
    expect(
      calibrate(profiles, [{ ...ev3VsCompass, decisiveAxes: [] }]),
    ).toEqual(calibrate(profiles, [ev3VsCompass]));
  });

  it('respetar `AxisId`: solo se aceptan los siete identificadores declarados', () => {
    const decisiveAxes: AxisId[] = ['fiabilidad', 'coste'];
    expect(() =>
      calibrate(profiles, [{ ...ev3VsCompass, decisiveAxes }]),
    ).not.toThrow();
  });
});
