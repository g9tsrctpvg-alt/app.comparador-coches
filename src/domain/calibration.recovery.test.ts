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

/**
 * Los ejes que, según su propio criterio verdadero, un perfil sintético
 * marcaría como determinantes en un cara a cara (product/0036, requisito
 * 2.6): el conjunto mínimo —por orden de mayor aportación a la victoria—
 * que basta para explicarla por sí solo. Es la mejor atribución posible, y
 * por eso las cifras de esta sección son un techo y no una previsión: una
 * persona se equivocará más de lo que un perfil sintético jamás se
 * equivoca (dependencias y supuestos de la spec).
 */
function decisiveAxesFor(
  truth: AxisWeights,
  winner: CarProfile,
  loser: CarProfile,
): AxisId[] {
  const contributions = AXIS_ORDER.map((axisId) => ({
    axisId,
    value: truth[axisId] * (winner.scores[axisId] - loser.scores[axisId]),
  })).sort((a, b) => b.value - a.value);

  const marked = new Set<AxisId>();
  for (const { axisId } of contributions) {
    marked.add(axisId);
    let rest = 0;
    for (const other of AXIS_ORDER) {
      if (marked.has(other)) continue;
      rest += truth[other] * (winner.scores[other] - loser.scores[other]);
    }
    if (rest <= 0) break;
  }
  return [...marked];
}

/** Como `runSession`, pero atribuyendo cada elección con `decisiveAxesFor`. */
function runSessionAttributing(truth: AxisWeights): {
  outcomes: MatchupOutcome[];
  proposed: AxisWeights;
} {
  const outcomes: MatchupOutcome[] = [];
  let state = calibrate(profiles, outcomes);
  while (state.nextMatchup !== null) {
    const { aCarId, bCarId } = state.nextMatchup;
    const a = byId.get(aCarId) as CarProfile;
    const b = byId.get(bCarId) as CarProfile;
    const preferred = answerWith(truth, aCarId, bCarId);
    const [winner, loser] = preferred === 'a' ? [a, b] : [b, a];
    const decisiveAxes = decisiveAxesFor(truth, winner, loser);
    outcomes.push({ aCarId, bCarId, preferred, decisiveAxes });
    state = calibrate(profiles, outcomes);
  }
  return { outcomes, proposed: state.proposedWeights };
}

/** Cuántos de los siete pesos propuestos son exactamente 0. */
function zeroAxes(weights: AxisWeights): number {
  return AXIS_ORDER.filter((axisId) => weights[axisId] === 0).length;
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
 * `product/0035` (requisitos 6.5 y 10.3) y de `product/0036` (requisitos
 * 1.4 y 2.6) sobre lo que una tanda recupera.
 *
 * **Vive fuera de la CI por omisión, y se ejecuta con `npm run test:recovery`.**
 * No se puede abaratar sin dejar de comprobar lo que comprueba: son cientos
 * de tandas y pasos de tanda, y cada uno recorre las 78.124 combinaciones de
 * la rejilla. Bajo la instrumentación de cobertura pasa de una decena de
 * segundos a varios minutos, que es justo por lo que no entra en
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

/**
 * Lo que corrige `product/0036`: el representante de `product/0035` era el
 * de mayor margen mínimo, que sobre un conjunto compatible que es un cono
 * (ADR 0011) siempre cae en una esquina. Con pocas respuestas eso dejaba
 * varios ejes clavados en 0. Se mide sobre los mismos treinta perfiles del
 * diagnóstico que motivó la spec.
 */
describe('el representante ya no es extremo (product/0036, fase 1)', () => {
  it('con pocas respuestas, ya no deja los ejes en cero', () => {
    const truths = syntheticProfiles(30, 4242);
    const stops = [3, 5, 8, 12];
    const acc: Record<number, { n: number; zero: number; agree: number }> = {};
    for (const stop of stops) acc[stop] = { n: 0, zero: 0, agree: 0 };

    for (const truth of truths) {
      const outcomes: MatchupOutcome[] = [];
      let state = calibrate(profiles, outcomes);
      let step = 0;
      while (state.nextMatchup !== null && step < Math.max(...stops)) {
        const { aCarId, bCarId } = state.nextMatchup;
        outcomes.push({
          aCarId,
          bCarId,
          preferred: answerWith(truth, aCarId, bCarId),
        });
        state = calibrate(profiles, outcomes);
        step += 1;
        if (stops.includes(step)) {
          const entry = acc[step] as { n: number; zero: number; agree: number };
          entry.n += 1;
          entry.zero += zeroAxes(state.proposedWeights);
          entry.agree += agreement(state.proposedWeights, truth);
        }
      }
    }

    const at3 = acc[3] as { n: number; zero: number; agree: number };
    const at5 = acc[5] as { n: number; zero: number; agree: number };
    // Requisito 1.4: de 4,50 ejes en cero a 0,5 o menos con tres respuestas;
    // de 0,715 a 0,82 de acuerdo como mínimo.
    expect(at3.zero / at3.n).toBeLessThanOrEqual(0.5);
    expect(at3.agree / at3.n).toBeGreaterThanOrEqual(0.82);
    // Con cinco respuestas, de 0,786 a 0,86 como mínimo.
    expect(at5.agree / at5.n).toBeGreaterThanOrEqual(0.86);
  }, 180000);
});

/**
 * Lo que añade `product/0036`: marcar qué ejes decidieron una elección
 * añade una segunda desigualdad por respuesta, en vez de dejar que el
 * algoritmo la invente. Se mide sobre los mismos treinta perfiles.
 */
describe('atribuir acorta la tanda y mejora el acuerdo (product/0036, fase 2)', () => {
  it('con cinco respuestas, atribuir da más acuerdo que no atribuir, y la tanda es más corta', () => {
    const truths = syntheticProfiles(30, 4242);
    let lengthPlain = 0;
    let lengthAttributed = 0;
    let agreeAt5Plain = 0;
    let agreeAt5Attributed = 0;

    for (const truth of truths) {
      const plain = runSession(truth);
      lengthPlain += plain.outcomes.length;

      const attributed = runSessionAttributing(truth);
      lengthAttributed += attributed.outcomes.length;

      // El acuerdo a cinco respuestas de cada protocolo, recalculando el
      // estado en ese punto exacto de su propia tanda.
      const plainAt5 = calibrate(profiles, plain.outcomes.slice(0, 5));
      agreeAt5Plain += agreement(plainAt5.proposedWeights, truth);
      const attributedAt5 = calibrate(
        profiles,
        attributed.outcomes.slice(0, 5),
      );
      agreeAt5Attributed += agreement(attributedAt5.proposedWeights, truth);
    }

    const n = truths.length;
    // Requisito 2.6: la tanda se cierra en menos preguntas atribuyendo.
    expect(lengthAttributed / n).toBeLessThan(lengthPlain / n);
    // Y con cinco respuestas, al menos 0,90 de acuerdo atribuyendo.
    expect(agreeAt5Attributed / n).toBeGreaterThanOrEqual(0.9);
    expect(agreeAt5Attributed / n).toBeGreaterThan(agreeAt5Plain / n);
  }, 180000);
});
