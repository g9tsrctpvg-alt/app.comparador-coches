import type { CarScoreBreakdown } from './scoring/breakdown';
import { AXIS_ORDER, type AxisId, type AxisWeights } from './scoring/weights';

/**
 * Calibración de los pesos por preferencia revelada (product/0035), sobre la
 * decisión del ADR 0011: una tanda de elecciones cara a cara identifica **la
 * clasificación, no los pesos**, así que aquí no se ajusta ningún modelo
 * continuo — se enumera una rejilla declarada y finita y se mira qué
 * combinaciones siguen explicando lo respondido.
 *
 * `product/0036` corrige el criterio de representante y añade la atribución
 * de ejes: el representante propuesto es la combinación compatible más
 * cercana al **centro** del conjunto compatible, no la de mayor margen —que
 * sobre un conjunto que es un cono siempre cae en una esquina—; y quien
 * contesta puede marcar qué ejes decidieron su elección, lo que añade una
 * segunda desigualdad por respuesta en vez de dejar que el algoritmo la
 * invente.
 *
 * Todo el cálculo vive aquí: `src/ui/` recibe el cara a cara que toca, los
 * pesos propuestos y las cifras de avance ya hechos, y no divide ni
 * multiplica nada (requisito 12.3 de `product/0035`).
 */

/** Los cinco valores que puede tomar cada peso en la rejilla (requisito
 * 3.1). Son enteros de 0 a 10, así que cualquier resultado es representable
 * en los deslizadores tal como están (requisito 3.3). */
export const WEIGHT_LEVELS = [0, 2, 5, 8, 10] as const;

/** `5⁸` combinaciones menos la nula, que no define ninguna clasificación —el
 * tamaño de la rejilla **completa**, sobre los ocho ejes de `AXIS_ORDER`
 * (product/0037 añadió `prueba`, el octavo). Es el tope de reserva de
 * `indicesScratch`, no necesariamente lo que una tanda concreta enumera:
 * `calibrate` recorta la rejilla a los ejes activos de esa tanda (ver
 * `activeAxesOf`), casi siempre menos de ocho. */
export const GRID_SIZE = WEIGHT_LEVELS.length ** AXIS_ORDER.length - 1;

function gridSizeFor(axisCount: number): number {
  return WEIGHT_LEVELS.length ** axisCount - 1;
}

/** Umbral por debajo del cual dos notas del mismo eje se consideran
 * empatadas para decidir si el eje varía en el conjunto (requisito 7.1 de
 * product/0037). Las notas de eje son sumas de fracciones simples de un
 * peso entero de 0 a 10; un margen mucho más fino que cualquier diferencia
 * real basta para no confundir un empate genuino con un redondeo de coma
 * flotante. */
const CONSTANT_AXIS_EPSILON = 1e-9;

/**
 * Los ejes cuyo perfil **no** es constante en el conjunto de coches que
 * entra en la tanda (requisito 7.1 de product/0037): los únicos que pueden
 * decidir algún duelo, porque un eje constante aporta 0 a
 * `Σ pesoᵢ × Δᵢ` sea cual sea su peso — su Δ es 0 para cualquier par. La
 * rejilla se enumera solo sobre ellos (requisito 7.2), en el mismo orden de
 * `AXIS_ORDER` (requisito 3.4 de `product/0035`, que sigue rigiendo).
 * Exportada para que la interfaz no ofrezca un eje constante como decisivo
 * (requisito 7.4): marcarlo afirmaría una desigualdad que sus notas no
 * pueden sostener.
 */
export function activeAxesOf(profiles: CarProfile[]): AxisId[] {
  if (profiles.length === 0) return [];
  const first = profiles[0] as CarProfile;
  return AXIS_ORDER.filter((axisId) =>
    profiles.some(
      (profile) =>
        Math.abs(profile.scores[axisId] - first.scores[axisId]) >
        CONSTANT_AXIS_EPSILON,
    ),
  );
}

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
 * (requisito 2.3 de `product/0035`).
 */
export interface MatchupOutcome extends Matchup {
  preferred: 'a' | 'b' | 'none';
  /** Los ejes que quien contesta marcó como determinantes en esta elección
   * (product/0036, requisito 2). Ausente o vacío: la respuesta no atribuye
   * y se comporta exactamente como antes de esta spec. Con las siete claves:
   * equivalente a no atribuir (requisito 2.3), porque «lo decidió todo
   * junto» no es una atribución. Ignorado cuando `preferred === 'none'`
   * (requisito 2.5): sin elección no hay nada que atribuir. */
  decisiveAxes?: AxisId[];
}

export interface CalibrationState {
  /** Un representante declarado del conjunto compatible, nunca «los pesos»
   * de quien contesta (ADR 0011, decisión 1; requisito 5.1). */
  proposedWeights: AxisWeights;
  /** Cuántas combinaciones de la rejilla siguen siendo compatibles. */
  compatibleCount: number;
  /** Cuántas **desigualdades** contradice la mejor combinación: 0 salvo que
   * lo contestado se contradiga consigo mismo (requisito 4.2). Una respuesta
   * aporta una desigualdad, o dos si además atribuye ejes
   * (`product/0036`, requisito 2.4), así que esta cifra no es un recuento de
   * respuestas (`technical/0013`, requisito 1.1). */
  contradicted: number;
  /** Coches que pueden todavía ser el primero, en orden de catálogo. */
  possibleLeaderIds: string[];
  /** Enfrentamientos que todas las combinaciones del comité ordenan igual. */
  settledPairs: number;
  totalPairs: number;
  /** El siguiente cara a cara, o `null` si la tanda ha terminado. */
  nextMatchup: Matchup | null;
}

/** La rejilla, aplanada: un valor por eje **activo** y por combinación, en
 * el mismo orden que `activeAxes` (requisito 3.4 de `product/0035`;
 * recortada a los ejes activos por el requisito 7 de `product/0037`).
 * Memoiza la última combinación de ejes activos que se pidió: dentro de una
 * tanda no cambia, salvo que registrar una prueba real active `prueba`
 * (requisito 7.5) — momento en que la rejilla vuelve a construirse una
 * vez, no en cada respuesta. */
let gridCache: { key: string; size: number; values: Uint8Array } | undefined;

function grid(activeAxes: AxisId[]): { size: number; values: Uint8Array } {
  const key = activeAxes.join(',');
  if (gridCache !== undefined && gridCache.key === key) {
    return gridCache;
  }

  const axes = activeAxes.length;
  const size = gridSizeFor(axes);
  const values = new Uint8Array(size * axes);
  const current = new Array<number>(axes).fill(0);
  let written = 0;

  const walk = (axis: number, sum: number): void => {
    if (axis === axes) {
      // La combinación nula no define ninguna clasificación: fuera.
      if (sum === 0) return;
      for (let a = 0; a < axes; a += 1) {
        values[written * axes + a] = current[a] as number;
      }
      written += 1;
      return;
    }
    for (const level of WEIGHT_LEVELS) {
      current[axis] = level;
      walk(axis + 1, sum + level);
    }
  };
  walk(0, 0);

  gridCache = { key, size, values };
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

/**
 * Un eje constante en el conjunto (fuera de `activeAxes`) aporta el mismo
 * término a la suma de **todos** los coches, cualquiera que sea su peso —su
 * nota es igual para todos—, así que nunca cambia quién tiene el total más
 * alto. Excluirlo del cálculo es exactamente equivalente a incluirlo con
 * cualquier peso, y más barato.
 */
function leaderByCombination(
  profiles: CarProfile[],
  activeAxes: AxisId[],
): Uint8Array {
  const key = `${activeAxes.join(',')}|${profiles
    .map(
      (profile) =>
        `${profile.carId}:${activeAxes.map((axisId) => profile.scores[axisId]).join(',')}`,
    )
    .join('|')}`;
  if (leaderCache !== undefined && leaderCache.key === key) {
    return leaderCache.leaders;
  }

  const { size, values } = grid(activeAxes);
  const axes = activeAxes.length;
  const matrix = profileMatrix(profiles, activeAxes);
  const leaders = new Uint8Array(size);
  for (let index = 0; index < size; index += 1) {
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
 * Los pesos completos que propone una combinación de la rejilla: los ejes
 * activos toman el valor que la rejilla les dio, y los excluidos —constantes
 * en este conjunto— conservan el peso que ya tenían (requisito 7.5 de
 * `product/0037`): la tanda no los propone ni los toca.
 */
function weightsFrom(
  values: Uint8Array,
  index: number,
  activeAxes: AxisId[],
  currentWeights: AxisWeights,
): AxisWeights {
  const weights = { ...currentWeights };
  const axes = activeAxes.length;
  activeAxes.forEach((axisId, a) => {
    weights[axisId] = values[index * axes + a] as number;
  });
  return weights;
}

/** Vector de diferencia de perfiles, en el orden de `activeAxes`. Un eje
 * excluido no entra —su diferencia es 0 para cualquier par, por
 * definición—, así que omitirlo no cambia ningún resultado (requisito 7.2
 * de `product/0037`). */
function deltaOf(
  a: CarProfile,
  b: CarProfile,
  activeAxes: AxisId[],
): Float64Array {
  const delta = new Float64Array(activeAxes.length);
  activeAxes.forEach((axisId, index) => {
    delta[index] = a.scores[axisId] - b.scores[axisId];
  });
  return delta;
}

/** Las notas de todos los coches en una sola tira, para que los bucles
 * calientes no busquen propiedades por nombre ni creen cierres. Solo los
 * ejes activos: los mismos que enumera `grid`. */
function profileMatrix(
  profiles: CarProfile[],
  activeAxes: AxisId[],
): Float64Array {
  const axes = activeAxes.length;
  const matrix = new Float64Array(profiles.length * axes);
  profiles.forEach((profile, position) => {
    activeAxes.forEach((axisId, a) => {
      matrix[position * axes + a] = profile.scores[axisId];
    });
  });
  return matrix;
}

/** El tamaño de `delta` es siempre el número de ejes activos de la tanda en
 * curso —lo mismo que `values` enumera—, así que no hace falta pasarlo
 * aparte: `delta.length` ya lo dice. */
function dotOf(values: Uint8Array, index: number, delta: Float64Array): number {
  const axes = delta.length;
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

/** La distancia entre dos perfiles sobre los ejes activos es idéntica a la
 * distancia sobre todos los ejes: un eje excluido aporta 0 a la diferencia
 * de cualquier par (por ser constante), así que su término al cuadrado es
 * siempre 0 y no cambia la suma. */
function pairsOf(profiles: CarProfile[], activeAxes: AxisId[]): Pair[] {
  const pairs: Pair[] = [];
  for (let i = 0; i < profiles.length; i += 1) {
    for (let j = i + 1; j < profiles.length; j += 1) {
      const delta = deltaOf(
        profiles[i] as CarProfile,
        profiles[j] as CarProfile,
        activeAxes,
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
 * Una desigualdad sobre los siete pesos: `dot(w, delta)` debe ser `> 0`
 * cuando `positive` es verdadero, o `<= 0` cuando es falso. Las dos formas
 * conviven en la misma lista para que `compatibleIndices` las recorra en un
 * único bucle, sin ramificar por tipo de respuesta.
 */
interface Constraint {
  delta: Float64Array;
  positive: boolean;
}

/**
 * Las respuestas que aportan desigualdad. Un «me da igual», o una respuesta
 * cuyos coches ya no están en el conjunto, no aporta ninguna.
 *
 * Cada preferencia aporta **como mínimo** una desigualdad —`dot > 0`, la de
 * siempre (product/0035, requisito 2.2)— y, si además atribuye a un
 * subconjunto propio y no vacío de ejes, una segunda (product/0036,
 * requisito 2.2): sin los ejes marcados, la decisión no se sostiene —
 * `Σ pesoᵢ × Δᵢ ≤ 0` sobre los ejes que quedan fuera de la atribución—. Las
 * dos cuentan por separado en el recuento de contradicciones (requisito
 * 2.4): no se funden en una.
 */
function constraintsOf(
  outcomes: MatchupOutcome[],
  byId: Map<string, CarProfile>,
  activeAxes: AxisId[],
): Constraint[] {
  const constraints: Constraint[] = [];
  for (const outcome of outcomes) {
    if (outcome.preferred === 'none') continue;
    const a = byId.get(outcome.aCarId);
    const b = byId.get(outcome.bCarId);
    if (a === undefined || b === undefined) continue;
    const [winner, loser] = outcome.preferred === 'a' ? [a, b] : [b, a];
    const delta = deltaOf(
      winner as CarProfile,
      loser as CarProfile,
      activeAxes,
    );
    constraints.push({ delta, positive: true });

    const decisive = outcome.decisiveAxes;
    if (decisive !== undefined) {
      const decisiveSet = new Set(decisive);
      // Ejes **distintos**, no entradas: una lista con repeticiones describe
      // el mismo subconjunto que la lista sin ellas
      // (`technical/0013`, requisito 2.1). Se compara contra los ejes
      // **activos** (requisito 7.4 de `product/0037`): un eje excluido
      // nunca se ofrece como decisivo, así que no puede aparecer aquí en
      // una tanda nueva.
      if (decisiveSet.size === 0 || decisiveSet.size === activeAxes.length) {
        continue;
      }
      const complement = new Float64Array(activeAxes.length);
      activeAxes.forEach((axisId, index) => {
        // `delta` es un `Float64Array` de `activeAxes.length` posiciones,
        // recorridas aquí una a una: el índice siempre existe. El `?? 0`
        // que exigiría `noUncheckedIndexedAccess` sería una rama muerta que
        // ningún test podría alcanzar de verdad.
        complement[index] = decisiveSet.has(axisId)
          ? 0
          : (delta[index] as number);
      });
      constraints.push({ delta: complement, positive: false });
    }
  }
  return constraints;
}

/** Buffer de trabajo del conjunto compatible: hasta `GRID_SIZE` índices.
 * Es de módulo y no por llamada porque en el caso peor son 312 KB, y
 * `calibrate` es síncrona — termina antes de que nadie pueda volver a
 * entrar—, así que reutilizarlo no puede mezclar dos conjuntos. */
const indicesScratch = new Int32Array(GRID_SIZE);

/** Los índices de la rejilla que contradicen el mínimo posible de respuestas,
 * cuántos son y cuál es ese mínimo (requisito 4 de `product/0035`). */
function compatibleIndices(
  constraints: Constraint[],
  activeAxes: AxisId[],
): {
  indices: Int32Array;
  contradicted: number;
} {
  const { size, values } = grid(activeAxes);
  let best = Number.POSITIVE_INFINITY;
  let count = 0;

  // Bucles indexados y producto escalar en línea, no `for…of` ni una llamada
  // por combinación: este bucle se recorre hasta 78.124 veces por respuesta
  // (menos si algún eje queda excluido, product/0037), y a esa escala el
  // iterador que `for…of` construye en cada vuelta cuesta más que la propia
  // aritmética. Medido, no supuesto.
  const axes = activeAxes.length;
  for (let index = 0; index < size; index += 1) {
    const base = index * axes;
    let bad = 0;
    for (let c = 0; c < constraints.length; c += 1) {
      const constraint = constraints[c] as Constraint;
      const delta = constraint.delta;
      let dot = 0;
      for (let a = 0; a < axes; a += 1) {
        dot += (values[base + a] as number) * (delta[a] as number);
      }
      // Empate incluido: una diferencia de 0 no confirma una preferencia
      // ni una atribución (requisito 2.2 de `product/0035` y de
      // `product/0036`).
      const violates = constraint.positive ? dot <= 0 : dot > 0;
      if (violates) bad += 1;
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

/**
 * El representante (product/0036, requisito 1.1): la combinación **del
 * conjunto compatible** más cercana, en distancia euclídea, al centro de ese
 * mismo conjunto. Se busca dentro del conjunto y no en el centro redondeado
 * sin más, para conservar la garantía de que la propuesta no contradice
 * ninguna respuesta coherente (requisito 1.2; `product/0035`, requisito
 * 5.3): el centro crudo puede caer fuera del conjunto.
 *
 * No hay desempate por cercanía a los pesos vigentes (requisito 1.3): el
 * criterio de `product/0035` nunca llegó a activarse —la distancia al
 * centro, como el margen que sustituye, es una cantidad continua que
 * prácticamente nunca empata—, así que mantenerlo prometía una propiedad que
 * el sistema no daba. El desempate que queda es el orden de recorrido de la
 * rejilla, coherente con el resto del módulo.
 */
function representativeOf(indices: Int32Array, activeAxes: AxisId[]): number {
  const { values } = grid(activeAxes);
  const axes = activeAxes.length;

  const centroid = new Float64Array(axes);
  for (let position = 0; position < indices.length; position += 1) {
    const base = (indices[position] as number) * axes;
    for (let a = 0; a < axes; a += 1) {
      centroid[a] = (centroid[a] as number) + (values[base + a] as number);
    }
  }
  for (let a = 0; a < axes; a += 1) {
    centroid[a] = (centroid[a] as number) / indices.length;
  }

  let best = indices[0] as number;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let position = 0; position < indices.length; position += 1) {
    const index = indices[position] as number;
    const base = index * axes;
    let distance = 0;
    for (let a = 0; a < axes; a += 1) {
      const diff = (values[base + a] as number) - (centroid[a] as number);
      distance += diff * diff;
    }
    if (distance < bestDistance - 1e-9) {
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
 * Función pura y determinista: las mismas respuestas devuelven exactamente
 * lo mismo, sin muestreo ni semilla (requisito 3.4 de `product/0035`).
 * `currentWeights` no participa en ningún desempate —`product/0036`,
 * requisito 1.3, retiró ese uso—: entra de nuevo aquí solo para que los
 * ejes excluidos de la rejilla (requisito 7 de `product/0037`) conserven el
 * peso que ya tenían en `proposedWeights`, sin que la tanda los proponga ni
 * los toque.
 */
export function calibrate(
  profiles: CarProfile[],
  outcomes: MatchupOutcome[],
  currentWeights: AxisWeights,
): CalibrationState {
  const activeAxes = activeAxesOf(profiles);
  const { values } = grid(activeAxes);
  const byId = new Map(profiles.map((profile) => [profile.carId, profile]));
  const constraints = constraintsOf(outcomes, byId, activeAxes);
  const { indices, contradicted } = compatibleIndices(constraints, activeAxes);
  const committee = committeeOf(indices);
  const pairs = pairsOf(profiles, activeAxes);

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
    const leaders = leaderByCombination(profiles, activeAxes);
    for (let position = 0; position < indices.length; position += 1) {
      leaderSeen[leaders[indices[position] as number] as number] = 1;
    }
  }

  const finished = outcomes.length >= MAX_MATCHUPS || nextPair === undefined;

  return {
    proposedWeights: weightsFrom(
      values,
      representativeOf(indices, activeAxes),
      activeAxes,
      currentWeights,
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
