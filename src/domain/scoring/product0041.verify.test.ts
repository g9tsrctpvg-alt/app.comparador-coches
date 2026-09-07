import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../../data/loadCatalog';
import { publishedCars } from '../car';
import { DEFAULT_ASSUMPTIONS } from './assumptions';
import { DEFAULT_WEIGHTS, AXIS_LABELS } from './weights';
import { scoreCatalog, percentageOf } from './score';

/** Verificación de los criterios de aceptación de `product/0041` que se
 * enuncian sobre el catálogo real, no sobre un fixture. Los que se enuncian
 * sobre el eje aislado viven en `axes/fiabilidad.test.ts`. */
describe('product/0041 sobre el catálogo real', () => {
  const cars = publishedCars(loadCatalog());
  const scored = scoreCatalog(
    cars,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    47000,
  );
  const byId = (id: string) => scored.find((car) => car.carId === id)!;
  const axisOf = (id: string) =>
    byId(id).axes.find((axis) => axis.axisId === 'fiabilidad')!;
  const pct = (id: string) => percentageOf(byId(id).total, DEFAULT_WEIGHTS);

  it('el Corolla Cross saca 9,86 y su total pasa a 50,01 %', () => {
    expect(axisOf('toyota-corolla-cross').score).toBeCloseTo(9.86, 2);
    expect(pct('toyota-corolla-cross')).toBeCloseTo(50.01, 2);
  });

  it('el Compass saca 0,00 y su total pasa a 41,60 %', () => {
    expect(axisOf('jeep-compass').score).toBe(0);
    expect(pct('jeep-compass')).toBeCloseTo(41.6, 2);
  });

  it('ningún coche tiene subcomponente de garantía, y todos tienen el del índice OCU', () => {
    for (const car of scored) {
      const axis = axisOf(car.carId);
      expect(axis.subcomponents!.map((sub) => sub.label)).toEqual([
        'Índice OCU',
      ]);
      expect(axis.subcomponents![0]!.scale).toMatchObject({
        goodAnchor: 93,
        badAnchor: 64,
      });
    }
  });

  it('todos muestran los años incondicionales como información que no puntúa', () => {
    for (const car of cars) {
      const info = axisOf(car.id).info!;
      expect(info[0]!.label).toBe('Garantía incondicional (no puntúa)');
      expect(info[0]!.value).toBe(`${car.warrantyYears.value} años`);
    }
  });

  it('los seis coches con extensión condicionada la siguen mostrando', () => {
    const conExtension = cars.filter((car) => car.warrantyExtension);
    expect(conExtension).toHaveLength(6);
    for (const car of conExtension) {
      const info = axisOf(car.id).info!;
      expect(info).toHaveLength(2);
      expect(info[1]!.label).toBe(
        'Extensión de garantía condicionada (no puntúa)',
      );
      expect(info[1]!.value).toContain(
        `${car.warrantyExtension!.years.value} años`,
      );
      expect(info[1]!.value).toContain(car.warrantyExtension!.condition);
    }
  });

  it('el eje se llama Fiabilidad, sin la garantía en el nombre', () => {
    expect(AXIS_LABELS.fiabilidad).toBe('Fiabilidad');
    for (const car of scored) {
      expect(axisOf(car.carId).label).toBe('Fiabilidad');
    }
  });

  it('declara que el índice es por marca y que la garantía no puntúa', () => {
    const formula = axisOf('kia-ev3').formulaDescription;
    expect(formula).toContain('por marca, no por modelo');
    expect(formula).toContain('no puntúan');
  });

  it('la nota del eje es la misma con los dieciocho que con el coche solo', () => {
    for (const car of cars) {
      const alone = scoreCatalog(
        [car],
        DEFAULT_WEIGHTS,
        DEFAULT_ASSUMPTIONS,
        47000,
      )[0]!;
      const aloneAxis = alone.axes.find((a) => a.axisId === 'fiabilidad')!;
      expect(aloneAxis.score, car.id).toBe(axisOf(car.id).score);
    }
  });

  it('dos coches con el mismo índice y distinta garantía empatan en el eje', () => {
    // Corolla Cross (91, 3 años) contra sí mismo con siete años: mismo eje.
    const tresAnios = cars.find((car) => car.id === 'toyota-corolla-cross')!;
    const sieteAnios = {
      ...tresAnios,
      id: 'corolla-siete',
      warrantyYears: { ...tresAnios.warrantyYears, value: 7 },
    };
    const pair = scoreCatalog(
      [tresAnios, sieteAnios],
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      47000,
    );
    const axis = (id: string) =>
      pair
        .find((c) => c.carId === id)!
        .axes.find((a) => a.axisId === 'fiabilidad')!.score;
    expect(axis('toyota-corolla-cross')).toBe(axis('corolla-siete'));
  });
});
