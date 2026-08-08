import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../data/loadCatalog';
import { DEFAULT_ASSUMPTIONS } from './assumptions';
import { DEFAULT_WEIGHTS } from './weights';
import { scoreCatalog } from './score';

/**
 * `product/0009` es un cambio de presentación: la puntuación de los once
 * candidatos del catálogo real, con pesos y supuestos por defecto, debe ser
 * idéntica antes y después (requisito 17, primer criterio de aceptación).
 * Los valores de abajo son la puntuación tal como la calcula el dominio hoy;
 * cualquier cambio en un eje que la mueva debe hacer fallar este test.
 *
 * Actualizados por `product/0017`, que cambia la fórmula del eje `viaje`
 * —el de mayor peso— y por tanto mueve los once totales a propósito. Que
 * este test fallara era la señal esperada, no una regresión.
 */
const EXPECTED_TOTALS: Record<string, number> = {
  'kia-sportage-hev': 97.96663732897088,
  'bmw-x1-xdrive25e': 96.8858574088462,
  'mazda-cx-5': 93.85054990055077,
  'honda-civic-e-hev': 92.09855690437826,
  'lexus-nx-350h': 92.08250900913761,
  'kia-ev3': 91.65061342363553,
  'hyundai-kona-electrico': 91.24811252655694,
  'hyundai-kona-hev': 90.18142374060288,
  'volkswagen-id4': 88.96141434633013,
  'alfa-romeo-tonale': 87.30712480928283,
  'honda-cr-v-e-hev': 85.20253371896445,
  'toyota-corolla-cross': 77.19501728998509,
};

describe('scoreCatalog against the real catalogue (product/0009 regression)', () => {
  const cars = loadCatalog();
  const result = scoreCatalog(
    cars,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    47000,
  );

  it('covers the same eleven candidates as the expectation table', () => {
    expect(result.map((car) => car.carId).sort()).toEqual(
      Object.keys(EXPECTED_TOTALS).sort(),
    );
  });

  it('keeps every total unchanged', () => {
    for (const car of result) {
      expect(car.total).toBeCloseTo(EXPECTED_TOTALS[car.carId]!, 9);
    }
  });
});
