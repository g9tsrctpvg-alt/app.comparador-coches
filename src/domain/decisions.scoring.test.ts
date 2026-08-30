import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../data/loadCatalog';
import { publishedCars } from './car';
import { defaultDecisionLog, setDecision } from './decisions';
import { DEFAULT_ASSUMPTIONS } from './scoring/assumptions';
import { DEFAULT_BUDGET_EUR } from './config';
import { DEFAULT_WEIGHTS } from './scoring/weights';
import { scoreCatalog } from './scoring/score';

/**
 * Criterio de aceptación de `product/0030`: la puntuación de un coche es
 * idéntica antes y después de descartarlo. `scoreCatalog` no recibe —ni
 * puede recibir— ningún `DecisionLog`: esta prueba no ejercita ninguna
 * rama nueva, deja escrito por qué. Contra el catálogo real, para cada
 * coche publicado.
 */
describe('scoring stays independent of the decision log (product/0030)', () => {
  const cars = publishedCars(loadCatalog());
  const before = scoreCatalog(
    cars,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    DEFAULT_BUDGET_EUR,
  );

  it('scores every published car exactly the same whether it is discarded or not', () => {
    // Descartar a todos los coches de golpe: si algo del reparto de
    // decisiones se colara en el cálculo, sería aquí donde se vería.
    let log = defaultDecisionLog();
    for (const car of cars) {
      log = setDecision(log, car.id, 'discarded', undefined, '2026-08-30');
    }
    expect(Object.keys(log.entries)).toHaveLength(cars.length);

    const after = scoreCatalog(
      cars,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      DEFAULT_BUDGET_EUR,
    );
    expect(after).toEqual(before);
  });
});
