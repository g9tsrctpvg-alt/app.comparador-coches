import { AXIS_LABELS, type AxisId, type AxisWeights } from './weights';
import type { CarScoreBreakdown } from './breakdown';
import { percentageOf } from './score';

/**
 * Cuánto explica un eje de la diferencia de nota entre dos coches
 * (product/0029, requisito 1). `value` es
 * `peso × (score(A) − score(B))`, que por construcción coincide con
 * `contribution(A) − contribution(B)`; la suma de los seis `value` de un
 * `ScoreGap` reproduce exactamente `totalDiff`.
 *
 * `crossingWeight` es el valor de este peso —con los otros cinco fijos— en
 * el que la diferencia de nota cambia de signo (requisito 5.1). Ausente
 * cuando `scoreAdvantage` es 0: ningún peso multiplicando a cero cambia el
 * resultado (requisito 5.4). No está acotado a 0-10 aquí — el rango real
 * del deslizador lo aplica `crossingsInRange`, porque «este eje no tiene
 * cruce dentro del recorrido» y «este eje no tiene cruce en absoluto» son
 * datos distintos que la interfaz distingue.
 */
export interface AxisGapLine {
  axisId: AxisId;
  label: string;
  weight: number;
  scoreAdvantage: number;
  value: number;
  crossingWeight?: number;
  crossingDirection?: 'below' | 'above';
}

export interface ScoreGap {
  carAId: string;
  carBId: string;
  /** total(A) − total(B), en las unidades crudas de `CarScoreBreakdown.total`. */
  totalDiff: number;
  /** La misma diferencia, en puntos porcentuales del máximo alcanzable —la
   * unidad que ya usa `percentage` en pantalla (requisito 2). */
  percentageDiff: number;
  /** Las seis líneas, ordenadas por valor absoluto descendente (requisito 1.3). */
  lines: AxisGapLine[];
}

function axisWeights(car: CarScoreBreakdown): AxisWeights {
  const weights = {} as AxisWeights;
  for (const axis of car.axes) {
    weights[axis.axisId] = axis.weight;
  }
  return weights;
}

/**
 * Reparte la diferencia de nota entre dos coches ya puntuados en la
 * aportación de cada uno de los seis ejes, y calcula el peso de cruce de
 * cada eje (product/0029, requisitos 1 y 5).
 *
 * `a` y `b` deben venir del mismo `scoreCatalog` — mismos pesos y mismos
 * supuestos — para que la diferencia tenga sentido; esta función no lo
 * comprueba, igual que `scoreCatalog` no comprueba que sus coches vengan
 * del mismo catálogo.
 */
export function splitScoreGap(
  a: CarScoreBreakdown,
  b: CarScoreBreakdown,
): ScoreGap {
  const byAxisB = new Map(b.axes.map((axis) => [axis.axisId, axis]));
  const totalDiff = a.total - b.total;

  const unsorted: AxisGapLine[] = a.axes.map((axisA) => {
    const axisB = byAxisB.get(axisA.axisId);
    if (!axisB) {
      // `a` y `b` vienen de `scoreCatalog`, que siempre construye los seis
      // ejes de `AXIS_ORDER` para todo coche; esta rama es defensiva.
      throw new Error(`Eje «${axisA.axisId}» sin contrapartida en el rival`);
    }
    const scoreAdvantage = axisA.score - axisB.score;
    const value = axisA.weight * scoreAdvantage;
    const rest = totalDiff - value;

    if (scoreAdvantage === 0) {
      return {
        axisId: axisA.axisId,
        label: AXIS_LABELS[axisA.axisId],
        weight: axisA.weight,
        scoreAdvantage,
        value,
      };
    }

    const crossingWeight = -rest / scoreAdvantage;
    const crossingDirection: 'below' | 'above' =
      Math.sign(scoreAdvantage) === Math.sign(totalDiff) ? 'below' : 'above';

    return {
      axisId: axisA.axisId,
      label: AXIS_LABELS[axisA.axisId],
      weight: axisA.weight,
      scoreAdvantage,
      value,
      crossingWeight,
      crossingDirection,
    };
  });

  const lines = [...unsorted].sort(
    (x, y) => Math.abs(y.value) - Math.abs(x.value),
  );

  return {
    carAId: a.carId,
    carBId: b.carId,
    totalDiff,
    percentageDiff: percentageOf(totalDiff, axisWeights(a)),
    lines,
  };
}

const WEIGHT_MIN = 0;
const WEIGHT_MAX = 10;

/** Las líneas cuyo peso de cruce cae dentro del recorrido real del
 * deslizador —0 a 10— (requisito 5.2): mover ese peso, y solo ese, puede
 * darle la vuelta al resultado. */
export function crossingsInRange(gap: ScoreGap): AxisGapLine[] {
  return gap.lines.filter(
    (line) =>
      line.crossingWeight !== undefined &&
      line.crossingWeight >= WEIGHT_MIN &&
      line.crossingWeight <= WEIGHT_MAX,
  );
}

/** Los ejes que no cambian el resultado en todo el recorrido del
 * deslizador —sin cruce, o con cruce fuera de 0-10— (requisito 5.3). */
export function stableAxes(gap: ScoreGap): AxisGapLine[] {
  const inRange = new Set(crossingsInRange(gap).map((line) => line.axisId));
  return gap.lines.filter((line) => !inRange.has(line.axisId));
}

/** Los ejes que más explican la diferencia, uno de cada signo cuando lo
 * haya (product/0029, requisito 4): el resumen de una línea de la
 * clasificación no necesita las seis, solo el que más pesa a favor y el
 * que más pesa en contra —el top absoluto por sí solo podría ser dos ejes
 * del mismo lado, que cuentan la mitad de la historia. */
export function topGapLines(gap: ScoreGap): AxisGapLine[] {
  // `splitScoreGap` construye `lines` a partir de `a.axes`, que siempre
  // tiene las seis entradas de `AXIS_ORDER`: nunca vacío.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- invariante de splitScoreGap
  const top = gap.lines[0]!;
  if (top.value === 0) return [top];
  const opposite = gap.lines.find(
    (line) => Math.sign(line.value) === -Math.sign(top.value),
  );
  return opposite ? [top, opposite] : [top];
}
