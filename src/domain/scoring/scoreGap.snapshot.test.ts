import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../data/loadCatalog';
import { publishedCars } from '../car';
import { DEFAULT_ASSUMPTIONS } from './assumptions';
import { DEFAULT_BUDGET_EUR } from '../config';
import { DEFAULT_WEIGHTS } from './weights';
import { scoreCatalog } from './score';
import { crossingsInRange, splitScoreGap, stableAxes } from './scoreGap';

/**
 * Los dos casos medidos en el *Contexto* de `product/0029` el 2026-08-29,
 * contra el catálogo real —los candidatos publicados, con pesos y supuestos
 * por defecto—. Sirven de criterio de aceptación (dos de los suyos citan
 * estas cifras) y de regresión: si un cambio en un eje las mueve, este test
 * falla a propósito, igual que `scoreCatalog.snapshot.test.ts`.
 */
describe('splitScoreGap against the real catalogue', () => {
  const cars = publishedCars(loadCatalog());
  const scored = scoreCatalog(
    cars,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    DEFAULT_BUDGET_EUR,
  );
  const byId = (id: string) => scored.find((car) => car.carId === id)!;

  it('sums its six lines back into the total difference, for every pair of published candidates', () => {
    for (const a of scored) {
      for (const b of scored) {
        if (a.carId === b.carId) continue;
        const gap = splitScoreGap(a, b);
        const summed = gap.lines.reduce((sum, line) => sum + line.value, 0);
        expect(summed, `${a.carId} vs ${b.carId}`).toBeCloseTo(
          gap.totalDiff,
          9,
        );
        expect(gap.totalDiff, `${a.carId} vs ${b.carId}`).toBeCloseTo(
          a.total - b.total,
          9,
        );
      }
    }
  });

  it('splits the EV3-vs-Civic e:HEV gap as measured: +5,8 estética, -3,9 diario, -3,5 viaje, total +0,1', () => {
    const gap = splitScoreGap(byId('kia-ev3'), byId('honda-civic-e-hev'));
    expect(gap.percentageDiff).toBeCloseTo(0.1, 1);

    const byAxis = (axisId: string) =>
      gap.lines.find((line) => line.axisId === axisId)!;
    const ppOf = (value: number) => (value / (10 * 13)) * 100;

    expect(ppOf(byAxis('estetica').value)).toBeCloseTo(5.8, 1);
    expect(ppOf(byAxis('diario').value)).toBeCloseTo(-3.9, 1);
    expect(ppOf(byAxis('viaje').value)).toBeCloseTo(-3.5, 1);

    const summed = gap.lines.reduce((sum, line) => sum + line.value, 0);
    expect(summed).toBeCloseTo(gap.totalDiff, 9);
  });

  it('crosses only viaje (1,5) and prestaciones (2,1) for Tucson HEV vs Tucson PHEV', () => {
    const gap = splitScoreGap(
      byId('hyundai-tucson-hev'),
      byId('hyundai-tucson-phev'),
    );

    expect(crossingsInRange(gap).map((line) => line.axisId)).toEqual([
      'viaje',
      'prestaciones',
    ]);

    const viaje = gap.lines.find((line) => line.axisId === 'viaje')!;
    const prestaciones = gap.lines.find(
      (line) => line.axisId === 'prestaciones',
    )!;
    expect(viaje.crossingWeight).toBeCloseTo(1.5, 1);
    expect(viaje.crossingDirection).toBe('below');
    expect(prestaciones.crossingWeight).toBeCloseTo(2.1, 1);
    expect(prestaciones.crossingDirection).toBe('above');

    // diario, fiabilidad y estética empatan entre las dos motorizaciones
    // del Tucson (mismo cuerpo, mismo interior, misma fiabilidad OCU) y
    // coste no cruza dentro de 0-10: los cuatro quedan en el resumen.
    expect(
      stableAxes(gap)
        .map((line) => line.axisId)
        .sort(),
    ).toEqual(['coste', 'diario', 'estetica', 'fiabilidad'].sort());
  });
});
