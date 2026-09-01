import { describe, expect, it } from 'vitest';
import {
  calibrate,
  profileOf,
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

/** Proporción de los enfrentamientos que dos vectores de pesos ordenan
 * igual: la medida de «reproduce la clasificación» del requisito 10.3. */
function agreement(a: AxisWeights, b: AxisWeights): number {
  let ok = 0;
  let pairs = 0;
  for (let i = 0; i < profiles.length; i += 1) {
    for (let j = i + 1; j < profiles.length; j += 1) {
      const p = profiles[i] as CarProfile;
      const q = profiles[j] as CarProfile;
      const da = totalOf(a, p) - totalOf(a, q);
      const db = totalOf(b, p) - totalOf(b, q);
      pairs += 1;
      if (da === 0 || db === 0) ok += 0.5;
      else if (Math.sign(da) === Math.sign(db)) ok += 1;
    }
  }
  return ok / pairs;
}

/** Perfiles sintéticos reproducibles, sin depender de `Math.random`. */
function syntheticProfiles(count: number, seed: number): AxisWeights[] {
  let state = seed >>> 0;
  const next = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const result: AxisWeights[] = [];
  while (result.length < count) {
    const weights = {} as AxisWeights;
    let sum = 0;
    for (const axisId of AXIS_ORDER) {
      const value = Math.floor(next() * 11);
      weights[axisId] = value;
      sum += value;
    }
    if (sum > 0) result.push(weights);
  }
  return result;
}

/**
 * La medición empírica que sostiene los criterios de aceptación de
 * `product/0035` sobre lo que una tanda recupera (requisitos 6.5 y 10.3).
 *
 * **Vive fuera de la CI por omisión, y se ejecuta con `npm run test:recovery`.**
 * No se puede abaratar sin dejar de comprobar lo que comprueba: son setenta
 * tandas completas, y cada respuesta recorre las 78.124 combinaciones de la
 * rejilla. Tarda unos 17 segundos suelta; bajo la instrumentación de
 * cobertura, dos minutos y medio, que es justo por lo que no entra en
 * `npm run test:coverage`.
 *
 * **Cuándo hay que ejecutarlo** —la condición es mecánica, no un juicio—: al
 * tocar `src/domain/calibration.ts`, cualquier eje de `src/domain/scoring/`,
 * `DEFAULT_WEIGHTS` o `src/data/cars.json`. Son las cuatro entradas de la
 * medición; si ninguna cambia, el resultado no puede cambiar.
 */

/**
 * Setenta tandas completas —sesenta limpias y diez con ruido—, cada respuesta
 * recorriendo las 78.124 combinaciones. Es el precio de tener un criterio de
 * aceptación empírico comprobado de verdad y no declarado de palabra.
 */
describe('lo que una tanda recupera', () => {
  it('reproduce la clasificación mucho mejor que los pesos por defecto', () => {
    const truths = syntheticProfiles(60, 12345);
    let lengths = 0;
    let longest = 0;
    let derived = 0;
    let baseline = 0;
    for (const truth of truths) {
      const { outcomes, proposed } = runSession(truth);
      lengths += outcomes.length;
      longest = Math.max(longest, outcomes.length);
      derived += agreement(proposed, truth);
      baseline += agreement(DEFAULT_WEIGHTS, truth);
    }
    const n = truths.length;
    // Requisito 6.5 y criterio de aceptación: 18 preguntas o menos.
    expect(longest).toBeLessThanOrEqual(18);
    expect(lengths / n).toBeLessThan(18);
    // Requisito 10.3: al menos el 95 %, contra el 81,2 % de la línea base.
    expect(derived / n).toBeGreaterThanOrEqual(0.95);
    expect(baseline / n).toBeLessThan(0.83);
  }, 120000);

  it('aguanta una de cada diez respuestas invertida', () => {
    const truths = syntheticProfiles(10, 999);
    let derived = 0;
    for (const truth of truths) {
      const { proposed } = runSession(truth, { flipEvery: 10 });
      derived += agreement(proposed, truth);
    }
    expect(derived / truths.length).toBeGreaterThanOrEqual(0.9);
  }, 120000);
});
