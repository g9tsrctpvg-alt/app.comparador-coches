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
import { scoreCatalog, percentageOf } from './scoring/score';
import { DEFAULT_ASSUMPTIONS } from './scoring/assumptions';
import {
  AXIS_ORDER,
  DEFAULT_WEIGHTS,
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
  let state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
  let step = 0;
  while (state.nextMatchup !== null) {
    const { aCarId, bCarId } = state.nextMatchup;
    let preferred = answerWith(truth, aCarId, bCarId);
    step += 1;
    if (options.flipEvery !== undefined && step % options.flipEvery === 0) {
      preferred = preferred === 'a' ? 'b' : 'a';
    }
    outcomes.push({ aCarId, bCarId, preferred });
    state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
  }
  return { outcomes, proposed: state.proposedWeights };
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
    expect(calibrate(profiles, outcomes, DEFAULT_WEIGHTS).compatibleCount).toBe(
      78124,
    );
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
  it('sin respuestas propone la combinación más cercana a los pesos vigentes', () => {
    const state = calibrate(profiles, [], DEFAULT_WEIGHTS);
    // DEFAULT_WEIGHTS es 5,5,7,5,7,6,5: los 7 y el 6 no están en la rejilla,
    // así que se redondean al nivel más cercano sin cruzarse con nadie.
    expect(state.proposedWeights).toEqual({
      carga: 5,
      habitabilidad: 5,
      diario: 8,
      prestaciones: 5,
      fiabilidad: 8,
      estetica: 5,
      coste: 5,
    });
    expect(state.contradicted).toBe(0);
  });

  it('el primer cara a cara es el par de perfiles más lejanos (requisito 6.2)', () => {
    const state = calibrate(profiles, [], DEFAULT_WEIGHTS);
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
      DEFAULT_WEIGHTS,
    );
    expect(again.nextMatchup).toEqual(state.nextMatchup);
  });

  it('de partida trece coches pueden liderar y ningún par está decidido', () => {
    const state = calibrate(profiles, [], DEFAULT_WEIGHTS);
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
    const first = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
    const second = calibrate(profiles, [...outcomes], DEFAULT_WEIGHTS);
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
    expect(calibrate(profiles, outcomes, DEFAULT_WEIGHTS).contradicted).toBe(0);
  });

  it('absorbe dos respuestas que se contradicen entre sí (requisito 4.2)', () => {
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'b' },
    ];
    const state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
    expect(state.contradicted).toBe(1);
    expect(state.compatibleCount).toBeGreaterThan(0);
    for (const axisId of AXIS_ORDER) {
      expect(Number.isFinite(state.proposedWeights[axisId])).toBe(true);
    }
  });

  it('«me da igual» no cambia nada y no repite el par (requisito 2.3)', () => {
    const base = calibrate(profiles, [], DEFAULT_WEIGHTS);
    const skipped: MatchupOutcome[] = [
      {
        ...(base.nextMatchup as { aCarId: string; bCarId: string }),
        preferred: 'none',
      },
    ];
    const state = calibrate(profiles, skipped, DEFAULT_WEIGHTS);
    expect(state.proposedWeights).toEqual(base.proposedWeights);
    expect(state.compatibleCount).toBe(base.compatibleCount);
    expect(state.possibleLeaderIds).toEqual(base.possibleLeaderIds);
    expect(state.nextMatchup).not.toEqual(base.nextMatchup);
  });

  it('deshacer devuelve el estado exacto anterior (requisito 8.2)', () => {
    const first: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
    ];
    const before = calibrate(profiles, first, DEFAULT_WEIGHTS);
    const after = calibrate(
      profiles,
      [...first, { aCarId: 'mazda-cx-5', bCarId: 'kia-ev5', preferred: 'b' }],
      DEFAULT_WEIGHTS,
    );
    expect(after).not.toEqual(before);
    expect(calibrate(profiles, first, DEFAULT_WEIGHTS)).toEqual(before);
  });

  it('a igual margen propone la combinación más cercana a los deslizadores', () => {
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
    ];
    const low: AxisWeights = {
      carga: 0,
      habitabilidad: 0,
      diario: 0,
      prestaciones: 0,
      fiabilidad: 0,
      estetica: 0,
      coste: 2,
    };
    const high: AxisWeights = {
      carga: 10,
      habitabilidad: 10,
      diario: 10,
      prestaciones: 10,
      fiabilidad: 10,
      estetica: 10,
      coste: 10,
    };
    const near = calibrate(profiles, outcomes, low).proposedWeights;
    const far = calibrate(profiles, outcomes, high).proposedWeights;
    const distance = (w: AxisWeights, anchor: AxisWeights) =>
      AXIS_ORDER.reduce((s, a) => s + Math.abs(w[a] - anchor[a]), 0);
    expect(distance(near, low)).toBeLessThan(distance(far, low));
    expect(distance(far, high)).toBeLessThan(distance(near, high));
  });

  it('la tanda se cierra sola y el avance solo mejora (requisitos 6.4 y 9.1)', () => {
    const outcomes: MatchupOutcome[] = [];
    let state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
    let previousSettled = -1;
    let previousLeaders = Number.POSITIVE_INFINITY;
    while (state.nextMatchup !== null) {
      const { aCarId, bCarId } = state.nextMatchup;
      outcomes.push({
        aCarId,
        bCarId,
        preferred: answerWith(DEFAULT_WEIGHTS, aCarId, bCarId),
      });
      state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
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
    let state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
    const seen = new Set<string>();
    while (state.nextMatchup !== null) {
      const key = `${state.nextMatchup.aCarId}|${state.nextMatchup.bCarId}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      outcomes.push({ ...state.nextMatchup, preferred: 'none' });
      state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
      if (outcomes.length > MAX_MATCHUPS) break;
    }
    expect(outcomes.length).toBeLessThanOrEqual(MAX_MATCHUPS);
  });

  it('el tope de preguntas cierra la tanda (requisito 6.6)', () => {
    const outcomes: MatchupOutcome[] = [];
    let state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
    while (state.nextMatchup !== null && outcomes.length < MAX_MATCHUPS) {
      outcomes.push({ ...state.nextMatchup, preferred: 'none' });
      state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
    }
    expect(outcomes).toHaveLength(MAX_MATCHUPS);
    expect(state.nextMatchup).toBeNull();
  });

  it('ignora respuestas sobre coches que no están en el conjunto', () => {
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'no-existe', bCarId: 'jeep-compass', preferred: 'a' },
      { aCarId: 'kia-ev3', bCarId: 'tampoco-existe', preferred: 'b' },
    ];
    const state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
    expect(state.compatibleCount).toBe(GRID_SIZE);
    expect(state.contradicted).toBe(0);
  });

  it('con dos coches hay un par y ningún líder imposible', () => {
    const two = profiles.slice(0, 2);
    const state = calibrate(two, [], DEFAULT_WEIGHTS);
    expect(state.totalPairs).toBe(1);
    expect(state.nextMatchup).not.toBeNull();
    expect(state.possibleLeaderIds.length).toBeGreaterThanOrEqual(1);
  });

  it('sin coches no hay par que ofrecer', () => {
    const state = calibrate([], [], DEFAULT_WEIGHTS);
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

describe('la unidad del margen', () => {
  it('es la misma que `percentageOf` (requisito 5.2)', () => {
    const weights: AxisWeights = {
      carga: 2,
      habitabilidad: 5,
      diario: 8,
      prestaciones: 0,
      fiabilidad: 10,
      estetica: 2,
      coste: 5,
    };
    const a = byId.get('kia-ev3') as CarProfile;
    const b = byId.get('jeep-compass') as CarProfile;
    const difference = totalOf(weights, a) - totalOf(weights, b);
    const sum = AXIS_ORDER.reduce((s, axisId) => s + weights[axisId], 0);
    expect(percentageOf(difference, weights)).toBeCloseTo(
      (difference / (10 * sum)) * 100,
      12,
    );
  });
});
