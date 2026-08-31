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
 *
 * Vueltos a actualizar tras cambiar `DEFAULT_WEIGHTS` (viaje 10, diario 7,
 * fiabilidad 7, estética 6, prestaciones 5, coste 5): es una prioridad
 * personal, no una fórmula del negocio (`docs/estado/dominio.md`), y mover
 * los seis pesos por defecto sube los totales en bloque a propósito.
 *
 * **No tocados por `product/0033`**, a propósito: partir `viaje` en `carga`
 * y `habitabilidad` con pesos 5 y 5 es una equivalencia aritmética exacta
 * con el `viaje` de peso 10 anterior (requisito 4.2 de la spec), así que
 * este test sigue en verde sin cambiar una sola cifra — es el criterio de
 * aceptación que lo demuestra.
 */
const EXPECTED_TOTALS: Record<string, number> = {
  'hyundai-tucson-hev': 241.86342157153587,
  'hyundai-tucson-phev': 240.49144853205905,
  'kia-sportage-hev': 232.68125998320298,
  'mazda-cx-5': 222.1500051017747,
  'bmw-x1-xdrive25e': 217.30430796428354,
  'kia-ev3': 236.8658679126243,
  'honda-civic-e-hev': 228.11517767231123,
  'hyundai-kona-hev': 217.33337259474501,
  'lexus-nx-350h': 212.3620228757981,
  'kia-ev5': 216.28313700458864,
  'hyundai-kona-electrico': 215.24537882786342,
  'hyundai-ioniq-5': 206.6177184743785,
  'honda-cr-v-e-hev': 199.6827626891658,
  'alfa-romeo-tonale': 198.08606996874985,
  'volkswagen-id4': 199.65102109590532,
  'toyota-corolla-cross': 183.87060309758877,
  'citroen-c5-aircross': 176.62035617260113,
  'jeep-compass': 176.12611004352019,
  'nissan-qashqai-e-power': 222.07922337385097,
  'nissan-x-trail-e-power': 221.13874945494933,
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
