import type { CarScoreBreakdown } from './scoring/breakdown';
import { AXIS_ORDER, type AxisId, type AxisWeights } from './scoring/weights';

/**
 * Calibración de los pesos por preferencia revelada (product/0035), sobre la
 * decisión del ADR 0011: una tanda de elecciones cara a cara identifica **la
 * clasificación, no los pesos**, así que aquí no se ajusta ningún modelo
 * continuo — se enumera una rejilla declarada y finita y se mira qué
 * combinaciones siguen explicando lo respondido.
 *
 * Todo el cálculo vive aquí: `src/ui/` recibe el cara a cara que toca, los
 * pesos propuestos y las cifras de avance ya hechos, y no divide ni
 * multiplica nada (requisito 12.3).
 */

/** Los cinco valores que puede tomar cada peso en la rejilla (requisito
 * 3.1). Son enteros de 0 a 10, así que cualquier resultado es representable
 * en los deslizadores tal como están (requisito 3.3). */
export const WEIGHT_LEVELS = [0, 2, 5, 8, 10] as const;

/** `5⁷` combinaciones menos la nula, que no define ninguna clasificación. */
export const GRID_SIZE = WEIGHT_LEVELS.length ** AXIS_ORDER.length - 1;

/** Tope duro de preguntas por tanda (requisito 6.6). Con el catálogo de hoy
 * no se alcanza —la tanda se cierra sola antes, por el requisito 6.4—, y
 * llegar a él no es un error. */
export const MAX_MATCHUPS = 25;

/** Por debajo de cuatro coches no hay bastantes pares para distinguir siete
 * pesos, y la tanda no se ofrece (requisito 11.3). */
export const MIN_CARS_TO_CALIBRATE = 4;

/** Cuántas combinaciones se miran para decidir avance y siguiente pregunta
 * (requisito 6.1). El recorte es determinista y solo existe por coste. */
const COMMITTEE_LIMIT = 1500;

/**
 * El perfil de un coche: sus siete notas de eje, que el ADR 0004 hace
 * independientes de los pesos con que se haya puntuado (requisito 1).
 */
export interface CarProfile {
  carId: string;
  carName: string;
  scores: Record<AxisId, number>;
}

export function profileOf(car: CarScoreBreakdown): CarProfile {
  const scores = {} as Record<AxisId, number>;
  for (const axis of car.axes) {
    scores[axis.axisId] = axis.score;
  }
  return { carId: car.carId, carName: car.carName, scores };
}

/** Un cara a cara: dos coches, en el orden en que se presentan. */
export interface Matchup {
  aCarId: string;
  bCarId: string;
}

/**
 * Lo que ha pasado con un cara a cara. `'none'` es «me da igual»: no aporta
 * ninguna desigualdad, pero marca el par como visto para no repetirlo
 * (requisito 2.3).
 */
export interface MatchupOutcome extends Matchup {
  preferred: 'a' | 'b' | 'none';
}

export interface CalibrationState {
  /** Un representante declarado del conjunto compatible, nunca «los pesos»
   * de quien contesta (ADR 0011, decisión 1; requisito 5.1). */
  proposedWeights: AxisWeights;
  /** Cuántas combinaciones de la rejilla siguen siendo compatibles. */
  compatibleCount: number;
  /** Cuántas respuestas contradice la mejor combinación: 0 salvo que las
   * respuestas se contradigan entre sí (requisito 4.2). */
  contradicted: number;
  /** Coches que pueden todavía ser el primero, en orden de catálogo. */
  possibleLeaderIds: string[];
  /** Enfrentamientos que todas las combinaciones del comité ordenan igual. */
  settledPairs: number;
  totalPairs: number;
  /** El siguiente cara a cara, o `null` si la tanda ha terminado. */
  nextMatchup: Matchup | null;
}

/** La rejilla, aplanada: siete valores por combinación, en el mismo orden
 * siempre (requisito 3.4). Se construye una vez y se reutiliza. */
let gridCache: { values: Uint8Array; sums: Uint8Array } | undefined;

function grid(): { values: Uint8Array; sums: Uint8Array } {
  if (gridCache !== undefined) return gridCache;
  const axes = AXIS_ORDER.length;
  const values = new Uint8Array(GRID_SIZE * axes);
  const sums = new Uint8Array(GRID_SIZE);
  const current = new Array<number>(axes).fill(0);
  let written = 0;

  const walk = (axis: number, sum: number): void => {
    if (axis === axes) {
      // La combinación nula no define ninguna clasificación: fuera.
      if (sum === 0) return;
      for (let a = 0; a < axes; a += 1) {
        values[written * axes + a] = current[a] as number;
      }
      sums[written] = sum;
      written += 1;
      return;
    }
    for (const level of WEIGHT_LEVELS) {
      current[axis] = level;
      walk(axis + 1, sum + level);
    }
  };
  walk(0, 0);

  gridCache = { values, sums };
  return gridCache;
}

/**
 * Qué coche gana con cada combinación de la rejilla. **No depende de las
 * respuestas**: solo de los perfiles, que en una tanda no cambian
 * (requisito 11.2). Se calcula una vez por conjunto de perfiles y se
 * reutiliza en cada respuesta, que es lo que deja el recuento de posibles
 * líderes en una lectura por combinación en vez de un producto entero.
 *
 * Memoiza la última llamada, que es la que se repite: dentro de una tanda
 * los perfiles son siempre los mismos.
 */
let leaderCache: { key: string; leaders: Uint8Array } | undefined;

function leaderByCombination(profiles: CarProfile[]): Uint8Array {
  const key = profiles
    .map(
      (profile) =>
        `${profile.carId}:${AXIS_ORDER.map((axisId) => profile.scores[axisId]).join(',')}`,
    )
    .join('|');
  if (leaderCache !== undefined && leaderCache.key === key) {
    return leaderCache.leaders;
  }

  const { values } = grid();
  const axes = AXIS_ORDER.length;
  const matrix = profileMatrix(profiles);
  const leaders = new Uint8Array(GRID_SIZE);
  for (let index = 0; index < GRID_SIZE; index += 1) {
    const base = index * axes;
    let leader = 0;
    let bestTotal = Number.NEGATIVE_INFINITY;
    for (let position = 0; position < profiles.length; position += 1) {
      const row = position * axes;
      let total = 0;
      for (let a = 0; a < axes; a += 1) {
        total += (values[base + a] as number) * (matrix[row + a] as number);
      }
      if (total > bestTotal) {
        bestTotal = total;
        leader = position;
      }
    }
    leaders[index] = leader;
  }

  leaderCache = { key, leaders };
  return leaders;
}

/**
 * La diferencia de nota en puntos porcentuales del máximo alcanzable, que es
 * la unidad que ya usa la pantalla (requisito 5.2). Es `percentageOf`
 * evaluado sobre una diferencia de totales en vez de sobre un total; se
 * escribe aquí para no construir un `AxisWeights` por combinación dentro del
 * bucle, y un test comprueba que las dos formas coinciden.
 */
function marginPP(dot: number, weightSum: number): number {
  return (dot / (10 * weightSum)) * 100;
}

function weightsFrom(values: Uint8Array, index: number): AxisWeights {
  const weights = {} as AxisWeights;
  AXIS_ORDER.forEach((axisId, a) => {
    weights[axisId] = values[index * AXIS_ORDER.length + a] as number;
  });
  return weights;
}

/** Vector de diferencia de perfiles, en el orden de `AXIS_ORDER`. */
function deltaOf(a: CarProfile, b: CarProfile): Float64Array {
  const delta = new Float64Array(AXIS_ORDER.length);
  AXIS_ORDER.forEach((axisId, index) => {
    delta[index] = a.scores[axisId] - b.scores[axisId];
  });
  return delta;
}

/** Las notas de todos los coches en una sola tira, para que los bucles
 * calientes no busquen propiedades por nombre ni creen cierres. */
function profileMatrix(profiles: CarProfile[]): Float64Array {
  const axes = AXIS_ORDER.length;
  const matrix = new Float64Array(profiles.length * axes);
  profiles.forEach((profile, position) => {
    AXIS_ORDER.forEach((axisId, a) => {
      matrix[position * axes + a] = profile.scores[axisId];
    });
  });
  return matrix;
}

function dotOf(values: Uint8Array, index: number, delta: Float64Array): number {
  const axes = AXIS_ORDER.length;
  const base = index * axes;
  let dot = 0;
  for (let a = 0; a < axes; a += 1) {
    dot += (values[base + a] as number) * (delta[a] as number);
  }
  return dot;
}

interface Pair {
  i: number;
  j: number;
  delta: Float64Array;
  distance: number;
}

function pairsOf(profiles: CarProfile[]): Pair[] {
  const pairs: Pair[] = [];
  for (let i = 0; i < profiles.length; i += 1) {
    for (let j = i + 1; j < profiles.length; j += 1) {
      const delta = deltaOf(
        profiles[i] as CarProfile,
        profiles[j] as CarProfile,
      );
      let square = 0;
      for (const component of delta) square += component * component;
      const distance = Math.sqrt(square);
      pairs.push({ i, j, delta, distance });
    }
  }
  return pairs;
}

/**
 * Las respuestas que aportan desigualdad, ya como vector de diferencia
 * orientado hacia el coche preferido: `dot > 0` significa «esta combinación
 * explica esta respuesta». Un «me da igual», o una respuesta cuyos coches ya
 * no están en el conjunto, no aporta ninguna.
 */
function constraintsOf(
  outcomes: MatchupOutcome[],
  byId: Map<string, CarProfile>,
): Float64Array[] {
  const constraints: Float64Array[] = [];
  for (const outcome of outcomes) {
    if (outcome.preferred === 'none') continue;
    const a = byId.get(outcome.aCarId);
    const b = byId.get(outcome.bCarId);
    if (a === undefined || b === undefined) continue;
    const [winner, loser] = outcome.preferred === 'a' ? [a, b] : [b, a];
    constraints.push(deltaOf(winner as CarProfile, loser as CarProfile));
  }
  return constraints;
}

/** Buffer de trabajo del conjunto compatible: hasta `GRID_SIZE` índices.
 * Es de módulo y no por llamada porque en el caso peor son 312 KB, y
 * `calibrate` es síncrona — termina antes de que nadie pueda volver a
 * entrar—, así que reutilizarlo no puede mezclar dos conjuntos. */
const indicesScratch = new Int32Array(GRID_SIZE);

/** Los índices de la rejilla que contradicen el mínimo posible de respuestas,
 * cuántos son y cuál es ese mínimo (requisito 4). */
function compatibleIndices(constraints: Float64Array[]): {
  indices: Int32Array;
  contradicted: number;
} {
  const { values } = grid();
  let best = Number.POSITIVE_INFINITY;
  let count = 0;

  // Bucles indexados y producto escalar en línea, no `for…of` ni una llamada
  // por combinación: este bucle se recorre 78.124 veces por respuesta, y a
  // esa escala el iterador que `for…of` construye en cada vuelta cuesta más
  // que la propia aritmética. Medido, no supuesto.
  const axes = AXIS_ORDER.length;
  for (let index = 0; index < GRID_SIZE; index += 1) {
    const base = index * axes;
    let bad = 0;
    for (let c = 0; c < constraints.length; c += 1) {
      const delta = constraints[c] as Float64Array;
      let dot = 0;
      for (let a = 0; a < axes; a += 1) {
        dot += (values[base + a] as number) * (delta[a] as number);
      }
      // Empate incluido: una diferencia de 0 no confirma una preferencia
      // (requisito 2.2).
      if (dot <= 0) bad += 1;
      // En cuanto contradice más que el mejor visto ya no puede entrar ni
      // mover el mínimo, así que no hace falta terminar de contar. Con
      // respuestas coherentes el mínimo es 0 y casi toda la rejilla sale en
      // la primera desigualdad que incumple.
      if (bad > best) break;
    }
    if (bad < best) {
      best = bad;
      count = 0;
    }
    if (bad === best) {
      indicesScratch[count] = index;
      count += 1;
    }
  }
  return { indices: indicesScratch.subarray(0, count), contradicted: best };
}

/** El representante: mayor margen mínimo, luego menor distancia a los pesos
 * vigentes, luego orden de recorrido (requisito 5.1). */
function representativeOf(
  indices: Int32Array,
  constraints: Float64Array[],
  currentWeights: AxisWeights,
): number {
  const { values, sums } = grid();
  const axes = AXIS_ORDER.length;
  const anchor = AXIS_ORDER.map((axisId) => currentWeights[axisId]);

  let best = indices[0] as number;
  let bestMargin = Number.NEGATIVE_INFINITY;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const index of indices) {
    let margin = 0;
    if (constraints.length > 0) {
      margin = Number.POSITIVE_INFINITY;
      const sum = sums[index] as number;
      for (let c = 0; c < constraints.length; c += 1) {
        const pp = marginPP(
          dotOf(values, index, constraints[c] as Float64Array),
          sum,
        );
        if (pp < margin) margin = pp;
      }
    }
    let distance = 0;
    for (let a = 0; a < axes; a += 1) {
      distance += Math.abs(
        (values[index * axes + a] as number) - (anchor[a] as number),
      );
    }
    if (
      margin > bestMargin + 1e-9 ||
      (Math.abs(margin - bestMargin) <= 1e-9 && distance < bestDistance)
    ) {
      bestMargin = margin;
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

/** El comité: el conjunto compatible entero, o un recorrido a paso fijo de
 * él cuando pasa de `COMMITTEE_LIMIT` (requisito 6.1). */
function committeeOf(indices: Int32Array): Int32Array {
  if (indices.length <= COMMITTEE_LIMIT) return indices;
  const stride = Math.ceil(indices.length / COMMITTEE_LIMIT);
  const committee = new Int32Array(Math.ceil(indices.length / stride));
  for (
    let position = 0, written = 0;
    position < indices.length;
    position += stride
  ) {
    committee[written] = indices[position] as number;
    written += 1;
  }
  return committee;
}

export function canCalibrate(carCount: number): boolean {
  return carCount >= MIN_CARS_TO_CALIBRATE;
}

/**
 * El estado completo de una tanda tras las respuestas dadas: qué pesos se
 * proponen, qué han fijado las respuestas y qué se pregunta ahora.
 *
 * Función pura y determinista: las mismas respuestas y los mismos pesos de
 * partida devuelven exactamente lo mismo, sin muestreo ni semilla
 * (requisito 3.4).
 */
export function calibrate(
  profiles: CarProfile[],
  outcomes: MatchupOutcome[],
  currentWeights: AxisWeights,
): CalibrationState {
  const { values } = grid();
  const byId = new Map(profiles.map((profile) => [profile.carId, profile]));
  const constraints = constraintsOf(outcomes, byId);
  const { indices, contradicted } = compatibleIndices(constraints);
  const committee = committeeOf(indices);
  const pairs = pairsOf(profiles);

  const seen = new Set(
    outcomes.map((outcome) => `${outcome.aCarId}|${outcome.bCarId}`),
  );

  // Los enfrentamientos ya decididos se cuentan sobre el conjunto compatible
  // **entero**, no sobre el comité (requisito 9.1): es una cifra que se
  // enseña, y sobre una muestra se puede afirmar que un par está decidido
  // cuando alguna combinación compatible lo ordena al revés. Sale barato
  // porque un par que no está decidido se detecta en cuanto aparecen las dos
  // orientaciones, que con el conjunto ancho pasa casi siempre a la primera;
  // y cuando el conjunto es estrecho, recorrerlo entero ya no cuesta nada.
  let settledPairs = 0;
  const splitsBySeenPair = new Map<Pair, boolean>();

  for (const pair of pairs) {
    let ahead = false;
    let behind = false;
    const delta = pair.delta;
    for (let position = 0; position < indices.length; position += 1) {
      if (dotOf(values, indices[position] as number, delta) > 0) ahead = true;
      else behind = true;
      if (ahead && behind) break;
    }
    const splits = ahead && behind;
    if (!splits) settledPairs += 1;
    splitsBySeenPair.set(pair, splits);
  }

  // El comité, en cambio, solo decide **qué se pregunta** (requisito 6.1).
  // Una muestra basta para eso: afecta al orden de las preguntas, nunca a
  // una cifra que se afirme en pantalla.
  let nextPair: Pair | undefined;
  let bestSplit = Number.POSITIVE_INFINITY;
  let bestDistance = Number.NEGATIVE_INFINITY;

  for (const pair of pairs) {
    const a = profiles[pair.i] as CarProfile;
    const b = profiles[pair.j] as CarProfile;
    if (
      splitsBySeenPair.get(pair) !== true ||
      seen.has(`${a.carId}|${b.carId}`)
    ) {
      continue;
    }
    let ahead = 0;
    for (let position = 0; position < committee.length; position += 1) {
      if (dotOf(values, committee[position] as number, pair.delta) > 0) {
        ahead += 1;
      }
    }
    const split = Math.abs(ahead / committee.length - 0.5);
    if (
      split < bestSplit - 1e-12 ||
      (Math.abs(split - bestSplit) <= 1e-12 && pair.distance > bestDistance)
    ) {
      bestSplit = split;
      bestDistance = pair.distance;
      nextPair = pair;
    }
  }

  // El primero de la tanda no lo elige el comité —que todavía es la rejilla
  // entera— sino la distancia entre perfiles: el par de coches más distintos
  // (requisito 6.2).
  if (outcomes.length === 0) {
    nextPair = undefined;
    for (const pair of pairs) {
      if (nextPair === undefined || pair.distance > nextPair.distance) {
        nextPair = pair;
      }
    }
  }

  // Los posibles líderes, por el mismo motivo, salen del conjunto compatible
  // entero: sobre una muestra se perderían coches que sí pueden ganar, que es
  // el error que peor sienta en una cifra pensada para no prometer de más.
  const leaderSeen = new Uint8Array(profiles.length);
  if (profiles.length > 0) {
    const leaders = leaderByCombination(profiles);
    for (let position = 0; position < indices.length; position += 1) {
      leaderSeen[leaders[indices[position] as number] as number] = 1;
    }
  }

  const finished = outcomes.length >= MAX_MATCHUPS || nextPair === undefined;

  return {
    proposedWeights: weightsFrom(
      values,
      representativeOf(indices, constraints, currentWeights),
    ),
    compatibleCount: indices.length,
    contradicted,
    possibleLeaderIds: profiles
      .filter((_, position) => leaderSeen[position] === 1)
      .map((profile) => profile.carId),
    settledPairs,
    totalPairs: pairs.length,
    nextMatchup: finished
      ? null
      : {
          aCarId: (profiles[(nextPair as Pair).i] as CarProfile).carId,
          bCarId: (profiles[(nextPair as Pair).j] as CarProfile).carId,
        },
  };
}
