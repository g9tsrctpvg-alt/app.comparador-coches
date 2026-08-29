import { describe, expect, it } from 'vitest';
import type { CarScoreBreakdown } from './breakdown';
import { AXIS_LABELS, AXIS_ORDER, type AxisId } from './weights';
import { percentageOf } from './score';
import {
  crossingsInRange,
  splitScoreGap,
  stableAxes,
  topGapLines,
} from './scoreGap';

/** Pesos de test: los mismos que `DEFAULT_WEIGHTS`, para que la suma —13—
 * coincida con la que se usa a mano abajo para verificar cada cruce. */
const TEST_WEIGHTS: Record<AxisId, number> = {
  viaje: 4,
  diario: 3,
  prestaciones: 1,
  fiabilidad: 2,
  estetica: 2,
  coste: 1,
};

function carBreakdown(
  id: string,
  scores: Record<AxisId, number>,
): CarScoreBreakdown {
  const axes = AXIS_ORDER.map((axisId) => {
    const weight = TEST_WEIGHTS[axisId];
    const score = scores[axisId];
    return {
      axisId,
      label: AXIS_LABELS[axisId],
      formulaDescription: '',
      inputs: [],
      assumptionsUsed: [],
      rawScore: score,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    };
  });
  const total = axes.reduce((sum, axis) => sum + axis.contribution, 0);
  return {
    carId: id,
    carName: id,
    overBudget: false,
    axes,
    total,
    percentage: percentageOf(total, TEST_WEIGHTS),
  };
}

// A gana en viaje (+2) y pierde en prestaciones (-3); los otros cuatro ejes
// empatan. total(A) = 79, total(B) = 74, diferencia = 5 — a mano, para que
// cada aserción de abajo se pueda comprobar sin ejecutar código.
const carA = carBreakdown('a', {
  viaje: 6,
  diario: 5,
  prestaciones: 5,
  fiabilidad: 8,
  estetica: 7,
  coste: 5,
});
const carB = carBreakdown('b', {
  viaje: 4,
  diario: 5,
  prestaciones: 8,
  fiabilidad: 8,
  estetica: 7,
  coste: 5,
});

describe('splitScoreGap', () => {
  it('reports the total difference in both raw and percentage units', () => {
    const gap = splitScoreGap(carA, carB);
    expect(gap.carAId).toBe('a');
    expect(gap.carBId).toBe('b');
    expect(gap.totalDiff).toBeCloseTo(5, 9);
    expect(gap.percentageDiff).toBeCloseTo((5 / (10 * 13)) * 100, 9);
  });

  it('sums the six lines back into the total difference (requisito 1.2)', () => {
    const gap = splitScoreGap(carA, carB);
    const summed = gap.lines.reduce((sum, line) => sum + line.value, 0);
    expect(summed).toBeCloseTo(gap.totalDiff, 9);
    expect(gap.lines).toHaveLength(6);
  });

  it('orders lines by descending absolute value, independent of AXIS_ORDER (requisito 1.3)', () => {
    const gap = splitScoreGap(carA, carB);
    // viaje (8) > prestaciones (-3) > los cuatro empates a 0, que
    // conservan su orden de `AXIS_ORDER` porque el sort es estable.
    expect(gap.lines.map((line) => line.axisId)).toEqual([
      'viaje',
      'prestaciones',
      'diario',
      'fiabilidad',
      'estetica',
      'coste',
    ]);
    expect(gap.lines[0]).toMatchObject({
      axisId: 'viaje',
      weight: 4,
      scoreAdvantage: 2,
      value: 8,
    });
    expect(gap.lines[1]).toMatchObject({
      axisId: 'prestaciones',
      weight: 1,
      scoreAdvantage: -3,
      value: -3,
    });
  });

  it('keeps weight and score advantage separate from their product (requisito 1.4)', () => {
    const gap = splitScoreGap(carA, carB);
    const viaje = gap.lines.find((line) => line.axisId === 'viaje')!;
    expect(viaje.weight).toBe(4);
    expect(viaje.scoreAdvantage).toBe(2);
    expect(viaje.value).toBe(viaje.weight * viaje.scoreAdvantage);
  });

  it('returns a valid zero-value line for an axis where both cars tie (requisito 1.5)', () => {
    const gap = splitScoreGap(carA, carB);
    const diario = gap.lines.find((line) => line.axisId === 'diario')!;
    expect(diario).toMatchObject({ scoreAdvantage: 0, value: 0 });
    expect(diario.crossingWeight).toBeUndefined();
    expect(diario.crossingDirection).toBeUndefined();
  });

  it('computes an exact crossing weight: at that weight the gap is zero (requisito 5.1)', () => {
    const gap = splitScoreGap(carA, carB);
    const viaje = gap.lines.find((line) => line.axisId === 'viaje')!;
    expect(viaje.crossingWeight).toBeCloseTo(1.5, 9);
    expect(viaje.crossingDirection).toBe('below');

    const atCrossing = splitScoreGap(
      reweighAxis(carA, 'viaje', viaje.crossingWeight!),
      reweighAxis(carB, 'viaje', viaje.crossingWeight!),
    );
    expect(atCrossing.totalDiff).toBeCloseTo(0, 9);
  });

  it('computes the crossing weight and direction for an axis where B leads (requisito 5.1)', () => {
    const gap = splitScoreGap(carA, carB);
    const prestaciones = gap.lines.find(
      (line) => line.axisId === 'prestaciones',
    )!;
    expect(prestaciones.crossingWeight).toBeCloseTo(8 / 3, 9);
    expect(prestaciones.crossingDirection).toBe('above');
  });

  it('throws when the rival is missing an axis that A has', () => {
    // `scoreCatalog` siempre construye los seis ejes de `AXIS_ORDER` para
    // todo coche, así que esta rama no ocurre en la aplicación; se
    // comprueba directamente, igual que `inputDatumFrom` comprueba su
    // propia rama defensiva pasándole un dato mal formado a mano.
    const incompleteB: CarScoreBreakdown = {
      ...carB,
      axes: carB.axes.filter((axis) => axis.axisId !== 'coste'),
    };
    expect(() => splitScoreGap(carA, incompleteB)).toThrow(/coste/);
  });
});

describe('crossingsInRange', () => {
  it('keeps only the axes whose crossing weight falls within the 0-10 slider range (requisito 5.2)', () => {
    const gap = splitScoreGap(carA, carB);
    expect(crossingsInRange(gap).map((line) => line.axisId)).toEqual([
      'viaje',
      'prestaciones',
    ]);
  });

  it('is empty when A leads every axis and no single weight can flip the result (requisito 5.5)', () => {
    // A gana los seis ejes por 1 punto; con los pesos por defecto sumando
    // 13, ningún eje puede aportar por sí solo más de 4 (su peso máximo,
    // viaje), así que ninguno cruza dentro de 0-10.
    const dominant = carBreakdown('dominant', {
      viaje: 6,
      diario: 6,
      prestaciones: 6,
      fiabilidad: 6,
      estetica: 6,
      coste: 6,
    });
    const dominated = carBreakdown('dominated', {
      viaje: 5,
      diario: 5,
      prestaciones: 5,
      fiabilidad: 5,
      estetica: 5,
      coste: 5,
    });
    const gap = splitScoreGap(dominant, dominated);
    expect(crossingsInRange(gap)).toEqual([]);
    expect(stableAxes(gap)).toHaveLength(6);
  });
});

describe('stableAxes', () => {
  it('returns exactly the complement of crossingsInRange (requisito 5.3)', () => {
    const gap = splitScoreGap(carA, carB);
    const inRangeIds = new Set(
      crossingsInRange(gap).map((line) => line.axisId),
    );
    for (const line of stableAxes(gap)) {
      expect(inRangeIds.has(line.axisId)).toBe(false);
    }
    expect(stableAxes(gap).map((line) => line.axisId)).toEqual([
      'diario',
      'fiabilidad',
      'estetica',
      'coste',
    ]);
  });

  it('includes a zero-advantage axis, which never has a crossing (requisito 5.4)', () => {
    const gap = splitScoreGap(carA, carB);
    const stableIds = stableAxes(gap).map((line) => line.axisId);
    expect(stableIds).toContain('diario');
  });
});

describe('topGapLines', () => {
  it('returns the top axis and the top axis of the opposite sign (requisito 4)', () => {
    const gap = splitScoreGap(carA, carB);
    // viaje (+8) es el mayor en valor absoluto; prestaciones (-3) es el
    // mayor de signo contrario.
    expect(topGapLines(gap).map((line) => line.axisId)).toEqual([
      'viaje',
      'prestaciones',
    ]);
  });

  it('returns only the top axis when no other axis has the opposite sign', () => {
    const dominant = carBreakdown('dominant', {
      viaje: 8,
      diario: 5,
      prestaciones: 8,
      fiabilidad: 8,
      estetica: 7,
      coste: 5,
    });
    // Igual que B salvo en viaje: los otros cinco ejes empatan en 0.
    const gap = splitScoreGap(dominant, carB);
    expect(topGapLines(gap).map((line) => line.axisId)).toEqual(['viaje']);
  });

  it('returns just the top empty-value line when the two cars tie on every axis', () => {
    const tie = splitScoreGap(carA, carA);
    expect(tie.totalDiff).toBe(0);
    const top = topGapLines(tie);
    expect(top).toHaveLength(1);
    expect(top[0]?.value).toBe(0);
  });
});

/** Reconstruye un `CarScoreBreakdown` con el peso de un eje cambiado —para
 * comprobar, en el propio eje, qué pasa exactamente en su peso de cruce. */
function reweighAxis(
  car: CarScoreBreakdown,
  axisId: AxisId,
  weight: number,
): CarScoreBreakdown {
  const axes = car.axes.map((axis) =>
    axis.axisId === axisId
      ? { ...axis, weight, contribution: axis.score * weight }
      : axis,
  );
  return {
    ...car,
    axes,
    total: axes.reduce((sum, axis) => sum + axis.contribution, 0),
  };
}
