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
 *
 * Vueltos a actualizar por `product/0026`, que re-ancla `diario`, `viaje` y
 * `prestaciones` contra los extremos del mercado en vez de la gama
 * comparada (ADR 0010): las notas bajan en bloque a propósito, y este test
 * fallaba exactamente como se esperaba.
 */
const EXPECTED_TOTALS: Record<string, number> = {
  'hyundai-tucson-hev': 76.64029809397312,
  'hyundai-tucson-phev': 75.18271166681497,
  'kia-sportage-hev': 72.26178160694342,
  'mazda-cx-5': 72.18308520232651,
  'bmw-x1-xdrive25e': 70.88411621663906,
  'kia-ev3': 70.83567451442254,
  'honda-civic-e-hev': 70.71546082351648,
  'hyundai-kona-hev': 68.36543758917576,
  'lexus-nx-350h': 68.04468380080988,
  'kia-ev5': 67.61789032129916,
  'hyundai-kona-electrico': 65.52188849286392,
  'hyundai-ioniq-5': 64.73871203560427,
  'honda-cr-v-e-hev': 64.51370778367581,
  'alfa-romeo-tonale': 63.8576959744103,
  'volkswagen-id4': 62.00890434602242,
  'toyota-corolla-cross': 57.629854422974326,
  'citroen-c5-aircross': 56.5666128175826,
  'jeep-compass': 58.84877038637088,
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
