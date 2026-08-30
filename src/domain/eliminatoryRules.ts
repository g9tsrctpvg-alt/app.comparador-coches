import { forcedRuleOperator, type FichaField } from './ficha';

/** Los dos únicos operadores de un imprescindible (product/0031, requisito
 * 1.1): un mínimo o un máximo, nunca un rango. */
export const RULE_OPERATORS = ['min', 'max'] as const;
export type RuleOperator = (typeof RULE_OPERATORS)[number];

/**
 * Un imprescindible: magnitud, operador y umbral (requisito 1.1). El
 * presupuesto no es una `EliminatoryRule` — sigue siendo `budgetEur` y
 * `car.overBudget`, ver `docs/estado/dominio.md` — así que esta forma solo
 * cubre las veinticinco magnitudes de `FICHA_FIELDS`.
 */
export interface EliminatoryRule {
  field: FichaField;
  operator: RuleOperator;
  value: number;
}

/** Por qué falla un coche una regla concreta: el umbral pedido y el valor
 * real, para que quien lee el tramo no elegible de la clasificación
 * (requisito 4.2) no tenga que adivinar. */
export interface RuleFailure {
  field: FichaField;
  operator: RuleOperator;
  threshold: number;
  actual: number;
}

/** Verdadero cuando `actual` no llega al mínimo o se pasa del máximo. */
function fails(rule: EliminatoryRule, actual: number): boolean {
  return rule.operator === 'min' ? actual < rule.value : actual > rule.value;
}

/**
 * Evalúa un conjunto de reglas contra los valores numéricos de un coche
 * (`numericFieldValues`/`numericValuesFromCells` en `ficha.ts`). Puro: no
 * toca `scoreCatalog` ni ningún otro cálculo (ADR 0004, requisito 4 de la
 * spec) — separa qué se ve, nunca qué se puntúa.
 *
 * Un coche sin la magnitud de una regla —`actual === undefined`— no cuenta
 * como fallo de esa regla (requisito 1.4): no hay dato, no hay
 * incumplimiento que afirmar.
 */
export function evaluateRules(
  values: Partial<Record<FichaField, number>>,
  rules: EliminatoryRule[],
): RuleFailure[] {
  const failures: RuleFailure[] = [];
  for (const rule of rules) {
    const actual = values[rule.field];
    if (actual === undefined) continue;
    if (fails(rule, actual)) {
      failures.push({
        field: rule.field,
        operator: rule.operator,
        threshold: rule.value,
        actual,
      });
    }
  }
  return failures;
}

/**
 * El operador que le corresponde a `field` según su polaridad declarada
 * (requisito 1.2): `'min'` en los `moreIsBetter`, `'max'` en los
 * `moreIsWorse`, y `null` en los `neutral` — ahí la interfaz ofrece las dos
 * opciones. Vive aquí, no en `ficha.ts`, porque el vocabulario de
 * operadores es de esta spec; `ficha.ts` solo expone la polaridad cruda
 * (`forcedRuleOperator`, envoltorio de `polarityOf`).
 */
export function requiredOperatorFor(field: FichaField): RuleOperator | null {
  return forcedRuleOperator(field);
}

/** Verdadero si `operator` es el único que la polaridad de `field` permite,
 * o si `field` es `neutral` y por tanto acepta los dos (requisito 3.3, la
 * comprobación que la restauración de `AppConfig` usa para descartar una
 * regla que contradice la polaridad declarada). */
export function isOperatorAllowed(
  field: FichaField,
  operator: RuleOperator,
): boolean {
  const required = requiredOperatorFor(field);
  return required === null || required === operator;
}
