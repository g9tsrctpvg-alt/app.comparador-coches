import { describe, expect, it } from 'vitest';
import { loadCatalog } from '../data/loadCatalog';
import { publishedCars } from './car';
import { DEFAULT_BUDGET_EUR } from './config';
import { evaluateRules, type EliminatoryRule } from './eliminatoryRules';
import { numericFieldValues } from './ficha';
import { DEFAULT_ASSUMPTIONS } from './scoring/assumptions';
import { scoreCatalog } from './scoring/score';
import { DEFAULT_WEIGHTS } from './scoring/weights';

/**
 * Criterio de aceptación de `product/0031`: un coche que incumple una regla
 * eliminatoria puntúa exactamente igual que si esa regla no existiera.
 * `scoreCatalog` no recibe —ni puede recibir, por su propia firma— ninguna
 * `EliminatoryRule`: esta prueba no ejercita ninguna rama nueva, deja
 * escrito por qué. Contra el catálogo real, con pesos y supuestos por
 * defecto (ADR 0004).
 */
describe('scoring stays independent of eliminatory rules (product/0031)', () => {
  const cars = publishedCars(loadCatalog());
  const before = scoreCatalog(
    cars,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    DEFAULT_BUDGET_EUR,
  );

  it('scores every published car exactly the same whether it fails a rule or not', () => {
    // Un imprescindible tan estricto que ningún coche real lo cumple: si
    // algo de la evaluación de reglas se colara en el cálculo, sería aquí
    // donde se vería.
    const strictRule: EliminatoryRule = {
      field: 'trunkLiters',
      operator: 'min',
      value: 100000,
    };
    const failures = cars.map((car) =>
      evaluateRules(numericFieldValues(car), [strictRule]),
    );
    expect(failures.every((f) => f.length === 1)).toBe(true);

    const after = scoreCatalog(
      cars,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      DEFAULT_BUDGET_EUR,
    );
    expect(after).toEqual(before);
  });
});
