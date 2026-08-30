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
 *
 * Vueltas a medir tras cambiar `DEFAULT_WEIGHTS` (viaje 10, diario 7,
 * fiabilidad 7, estética 6, prestaciones 5, coste 5 — suma 40, antes 13):
 * mover los pesos por defecto cambia tanto las cifras como, en el segundo
 * caso, qué ejes cruzan dentro del recorrido 0-10, porque el peso de cruce
 * de un eje depende de los otros cinco.
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

  it('splits the EV3-vs-Civic e:HEV gap as measured: +5,6 estética, -3,0 diario, -2,8 viaje, total +2,2', () => {
    const gap = splitScoreGap(byId('kia-ev3'), byId('honda-civic-e-hev'));
    expect(gap.percentageDiff).toBeCloseTo(2.2, 1);

    const byAxis = (axisId: string) =>
      gap.lines.find((line) => line.axisId === axisId)!;
    const ppOf = (value: number) => (value / (10 * 40)) * 100;

    expect(ppOf(byAxis('estetica').value)).toBeCloseTo(5.6, 1);
    expect(ppOf(byAxis('diario').value)).toBeCloseTo(-3.0, 1);
    expect(ppOf(byAxis('viaje').value)).toBeCloseTo(-2.8, 1);

    const summed = gap.lines.reduce((sum, line) => sum + line.value, 0);
    expect(summed).toBeCloseTo(gap.totalDiff, 9);
  });

  it('crosses prestaciones (6,0), viaje (7,7) and coste (1,8) for Tucson HEV vs Tucson PHEV', () => {
    const gap = splitScoreGap(
      byId('hyundai-tucson-hev'),
      byId('hyundai-tucson-phev'),
    );

    expect(crossingsInRange(gap).map((line) => line.axisId)).toEqual([
      'prestaciones',
      'viaje',
      'coste',
    ]);

    const viaje = gap.lines.find((line) => line.axisId === 'viaje')!;
    const prestaciones = gap.lines.find(
      (line) => line.axisId === 'prestaciones',
    )!;
    const coste = gap.lines.find((line) => line.axisId === 'coste')!;
    expect(viaje.crossingWeight).toBeCloseTo(7.7, 1);
    expect(viaje.crossingDirection).toBe('below');
    expect(prestaciones.crossingWeight).toBeCloseTo(6.0, 1);
    expect(prestaciones.crossingDirection).toBe('above');
    expect(coste.crossingWeight).toBeCloseTo(1.8, 1);
    expect(coste.crossingDirection).toBe('below');

    // diario, fiabilidad y estética empatan entre las dos motorizaciones
    // del Tucson (mismo cuerpo, mismo interior, misma fiabilidad OCU): son
    // los tres que quedan en el resumen. Con los pesos por defecto en 40 en
    // vez de 13, coste sí cruza dentro de 0-10 (antes no).
    expect(
      stableAxes(gap)
        .map((line) => line.axisId)
        .sort(),
    ).toEqual(['diario', 'estetica', 'fiabilidad'].sort());
  });
});
