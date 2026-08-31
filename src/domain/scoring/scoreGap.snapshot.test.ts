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
 *
 * Vueltas a medir de nuevo tras `product/0033`: `viaje` se parte en `carga`
 * y `habitabilidad` con peso 5 cada uno en vez de 10. La suma de pesos
 * (40) y el total de cada coche no cambian —es la equivalencia exacta que
 * demuestra el requisito 4.2 de la spec—, pero la línea de `viaje` se
 * reparte en dos: su valor de antes es, en cada caso, la suma de los
 * nuevos valores de `carga` y `habitabilidad`.
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

  it('sums its seven lines back into the total difference, for every pair of published candidates', () => {
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

  it('splits the EV3-vs-Civic e:HEV gap as measured: +5,6 estética, -3,0 diario, +1,2 carga, -4,0 habitabilidad, total +2,2', () => {
    const gap = splitScoreGap(byId('kia-ev3'), byId('honda-civic-e-hev'));
    expect(gap.percentageDiff).toBeCloseTo(2.2, 1);

    const byAxis = (axisId: string) =>
      gap.lines.find((line) => line.axisId === axisId)!;
    const ppOf = (value: number) => (value / (10 * 40)) * 100;

    expect(ppOf(byAxis('estetica').value)).toBeCloseTo(5.6, 1);
    expect(ppOf(byAxis('diario').value)).toBeCloseTo(-3.0, 1);
    // `viaje` valía aquí -2,8 pp antes de `product/0033`; repartido en los
    // dos ejes nuevos suma lo mismo: 1,2 + (-4,0) = -2,8.
    expect(ppOf(byAxis('carga').value)).toBeCloseTo(1.2, 1);
    expect(ppOf(byAxis('habitabilidad').value)).toBeCloseTo(-4.0, 1);

    const summed = gap.lines.reduce((sum, line) => sum + line.value, 0);
    expect(summed).toBeCloseTo(gap.totalDiff, 9);
  });

  it('crosses prestaciones (6,0), carga (3,8) and coste (1,8) for Tucson HEV vs Tucson PHEV', () => {
    const gap = splitScoreGap(
      byId('hyundai-tucson-hev'),
      byId('hyundai-tucson-phev'),
    );

    expect(crossingsInRange(gap).map((line) => line.axisId)).toEqual([
      'prestaciones',
      'carga',
      'coste',
    ]);

    const carga = gap.lines.find((line) => line.axisId === 'carga')!;
    const prestaciones = gap.lines.find(
      (line) => line.axisId === 'prestaciones',
    )!;
    const coste = gap.lines.find((line) => line.axisId === 'coste')!;
    expect(carga.crossingWeight).toBeCloseTo(3.8, 1);
    expect(carga.crossingDirection).toBe('below');
    expect(prestaciones.crossingWeight).toBeCloseTo(6.0, 1);
    expect(prestaciones.crossingDirection).toBe('above');
    expect(coste.crossingWeight).toBeCloseTo(1.8, 1);
    expect(coste.crossingDirection).toBe('below');

    // diario, fiabilidad, estética y habitabilidad empatan entre las dos
    // motorizaciones del Tucson (mismo cuerpo, misma batalla, misma
    // anchura de hombros, mismo interior, misma fiabilidad OCU): solo el
    // maletero difiere, por dónde va la batería del PHEV, así que `carga`
    // es el único de los dos ejes de espacio que separa a los dos.
    expect(
      stableAxes(gap)
        .map((line) => line.axisId)
        .sort(),
    ).toEqual(['diario', 'estetica', 'fiabilidad', 'habitabilidad'].sort());
  });
});
