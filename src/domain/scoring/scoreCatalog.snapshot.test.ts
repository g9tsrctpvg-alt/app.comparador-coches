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
 *
 * Vueltos a actualizar por `product/0038` y `product/0039` (2026-09-06), a
 * propósito: `coste` deja de leer el consumo ponderado de los dos `PHEV`
 * cuando declaran modo sostenido y no se carga en casa, y `habitabilidad`
 * puntúa el espacio de piernas atrás en vez de la batalla. El catálogo pasó
 * además de once a veintiún registros entre medias, así que las cifras de
 * abajo no son comparables con las de más arriba fila a fila.
 *
 * Vuelto a actualizar solo para `bmw-x1-xdrive25e` (2026-09-06): su
 * `rearShoulderWidthMm` se corrige de 138 a 141 cm —«Anchura hombros
 * máxima» de km77, confirmado por el usuario—, y el anterior queda como
 * fuente descartada en `cars.json` con su motivo. Es un dato de catálogo,
 * no una spec: mueve solo este registro.
 *
 * Vuelto a actualizar por `product/0040` (2026-09-07), a propósito y solo
 * en los dos registros con banqueta trasera deslizante: `rearLegroomMm`
 * pasa a declarar el máximo del rango publicado en vez del mínimo —el
 * X-Trail e-Power de 560 a 770 mm, el X1 xDrive25e de 620 a 760 mm—, así
 * que su nota de `habitabilidad` sube. Ningún otro total cambia.
 */
const EXPECTED_TOTALS: Record<string, number> = {
  'kia-ev3': 245.69364308167013,
  'hyundai-kona-hev': 228.61475583572926,
  'hyundai-kona-electrico': 226.52676206884763,
  'toyota-corolla-cross': 187.59907792854295,
  'bmw-x1-xdrive25e': 243.09356674549537,
  'alfa-romeo-tonale': 205.34281371874985,
  'kia-sportage-hev': 248.4586970605884,
  'honda-civic-e-hev': 239.11661447558416,
  'lexus-nx-350h': 228.6204486805267,
  'mazda-cx-5': 224.81873486066428,
  'honda-cr-v-e-hev': 215.46078820092563,
  'volkswagen-id4': 212.33339309204013,
  'kia-ev5': 228.93586705072403,
  'hyundai-ioniq-5': 208.34515555176395,
  'hyundai-tucson-hev': 257.64085864892127,
  'hyundai-tucson-phev': 252.74589285395749,
  'citroen-c5-aircross': 183.88761207042228,
  'jeep-compass': 174.66062309944914,
  'nissan-qashqai-e-power': 231.53860254680305,
  'nissan-x-trail-e-power': 235.82933350499098,
  'honda-zr-v': 206.54844756159966,
};

describe('scoreCatalog against the real catalogue (product/0009 regression)', () => {
  const cars = loadCatalog();
  const result = scoreCatalog(
    cars,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    47000,
  );

  it('covers the same candidates as the expectation table', () => {
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
