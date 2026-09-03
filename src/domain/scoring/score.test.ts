import { describe, expect, it } from 'vitest';
import { DEFAULT_ASSUMPTIONS } from './assumptions';
import { AXIS_ORDER, DEFAULT_WEIGHTS, type AxisWeights } from './weights';
import { threeCarFixture } from './testFixtures';
import { percentageOf, scoreCatalog } from './score';
import { EmptyCandidateSetError } from './normalize';
import { defaultTestDriveLog, setJudgement } from '../testDrives';

const ZERO_WEIGHTS: AxisWeights = {
  carga: 0,
  habitabilidad: 0,
  diario: 0,
  prestaciones: 0,
  fiabilidad: 0,
  estetica: 0,
  prueba: 0,
  coste: 0,
};

describe('scoreCatalog', () => {
  it('refuses an empty catalogue by name, not with a TypeError from reduce', () => {
    // El camino real del fallo: `App` llamaba aquí con `[]` en la rama de
    // error de carga, y el `TypeError` opaco se llevaba toda la aplicación.
    expect(() =>
      scoreCatalog([], DEFAULT_WEIGHTS, DEFAULT_ASSUMPTIONS, 47000),
    ).toThrow(EmptyCandidateSetError);
  });

  it('returns one breakdown per car, covering all eight axes', () => {
    const result = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    expect(result).toHaveLength(3);
    for (const carBreakdown of result) {
      expect(carBreakdown.axes.map((axis) => axis.axisId)).toEqual([
        'carga',
        'habitabilidad',
        'diario',
        'prestaciones',
        'fiabilidad',
        'estetica',
        'prueba',
        'coste',
      ]);
    }
  });

  it('reproduces the full breakdown of a specific axis for a specific model, not just its score', () => {
    const result = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    const sportage = result.find((car) => car.carId === 'kia-sportage-hev')!;
    const coste = sportage.axes.find((axis) => axis.axisId === 'coste')!;

    expect(coste.label).toBe('Coste total');
    expect(coste.formulaDescription).toContain('escala(precio)');
    expect(coste.inputs.map((input) => input.label)).toEqual([
      'Precio',
      'Consumo',
      'Mantenimiento anual',
    ]);
    expect(coste.inputs[0]).toMatchObject({
      value: 36000,
      unit: '€',
      estimated: false,
      sourceLabel: 'Fixture de test',
      discardedSources: [],
    });
    expect(coste.assumptionsUsed.length).toBeGreaterThan(0);
    expect(coste.subcomponents).toBeDefined();
    expect(coste.normalization).toBeUndefined();
    expect(coste.penalties).toEqual([]);
    expect(coste.weight).toBe(DEFAULT_WEIGHTS.coste);
    expect(coste.contribution).toBeCloseTo(
      coste.score * DEFAULT_WEIGHTS.coste,
      9,
    );
  });

  it('sums the seven axis contributions into the total, within floating-point tolerance', () => {
    const result = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    for (const carBreakdown of result) {
      const summedContributions = carBreakdown.axes.reduce(
        (sum, axis) => sum + axis.contribution,
        0,
      );
      expect(carBreakdown.total).toBeCloseTo(summedContributions, 9);
    }
  });

  it('flags a car as over budget when its price exceeds the budget', () => {
    const result = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      40000,
    );
    const x1 = result.find((car) => car.carId === 'bmw-x1-xdrive25e')!;
    const ev3 = result.find((car) => car.carId === 'kia-ev3')!;
    expect(x1.overBudget).toBe(true);
    expect(ev3.overBudget).toBe(false);
  });

  it('reports percentage as total over 10 × the sum of weights', () => {
    const result = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    const weightSum = AXIS_ORDER.reduce(
      (sum, id) => sum + DEFAULT_WEIGHTS[id],
      0,
    );
    for (const car of result) {
      expect(car.percentage).toBeCloseTo(
        (car.total / (10 * weightSum)) * 100,
        9,
      );
    }
  });

  it('shows the electric penalty as an explicit line with its condition and effect', () => {
    const result = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    const ev3 = result.find((car) => car.carId === 'kia-ev3')!;
    const diario = ev3.axes.find((axis) => axis.axisId === 'diario')!;
    expect(diario.penalties).toEqual([
      {
        label: 'Sin punto de carga en casa',
        condition: 'Vehículo eléctrico y el usuario no tiene carga en casa',
        active: true,
        effect: -1.5,
      },
    ]);
  });

  it('defaults to no test drives at all: the prueba axis scores every car the neutral', () => {
    const result = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    for (const carBreakdown of result) {
      const prueba = carBreakdown.axes.find(
        (axis) => axis.axisId === 'prueba',
      )!;
      expect(prueba.score).toBe(5);
    }
  });

  it('threads a given test-drive log into the prueba axis (requisito 2.8)', () => {
    const carId = threeCarFixture[0]!.id;
    const log = setJudgement(
      defaultTestDriveLog(),
      carId,
      'posture',
      5,
      '2026-09-01',
    );
    const result = scoreCatalog(
      threeCarFixture,
      { ...DEFAULT_WEIGHTS, prueba: 5 },
      DEFAULT_ASSUMPTIONS,
      47000,
      log,
    );
    const tested = result.find((car) => car.carId === carId)!;
    const untested = result.find((car) => car.carId !== carId)!;
    const testedPrueba = tested.axes.find((axis) => axis.axisId === 'prueba')!;
    const untestedPrueba = untested.axes.find(
      (axis) => axis.axisId === 'prueba',
    )!;
    expect(testedPrueba.score).toBeGreaterThan(untestedPrueba.score);
  });
});

describe('percentageOf', () => {
  it('is 0 rather than dividing by zero when every weight is 0', () => {
    expect(percentageOf(0, ZERO_WEIGHTS)).toBe(0);
    expect(percentageOf(123, ZERO_WEIGHTS)).toBe(0);
  });

  it('is 100 for a car that scored 10 on all seven axes', () => {
    const weightSum = AXIS_ORDER.reduce(
      (sum, id) => sum + DEFAULT_WEIGHTS[id],
      0,
    );
    expect(percentageOf(10 * weightSum, DEFAULT_WEIGHTS)).toBe(100);
  });
});
