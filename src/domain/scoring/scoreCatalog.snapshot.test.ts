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
 */
const EXPECTED_TOTALS: Record<string, number> = {
  'kia-sportage-hev': 95.95494712046028,
  'kia-ev3': 94.96757909310845,
  'bmw-x1-xdrive25e': 94.48155332586252,
  'mazda-cx-5': 93.63530710219688,
  'lexus-nx-350h': 90.39068943270804,
  'honda-civic-e-hev': 88.70508047153083,
  'hyundai-kona-electrico': 87.87015152747755,
  'hyundai-kona-hev': 86.80346274152349,
  'alfa-romeo-tonale': 85.10013004606931,
  'honda-cr-v-e-hev': 83.5282629496564,
  'toyota-corolla-cross': 78.1021227241263,
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
