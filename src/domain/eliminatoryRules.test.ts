import { describe, expect, it } from 'vitest';
import {
  evaluateRules,
  isOperatorAllowed,
  requiredOperatorFor,
  RULE_OPERATORS,
  type EliminatoryRule,
} from './eliminatoryRules';
import { FICHA_FIELDS, numericFieldValues, polarityOf } from './ficha';
import { sportageFixture, x1Fixture } from './scoring/testFixtures';

describe('evaluateRules', () => {
  const values = numericFieldValues(sportageFixture);

  it('returns no failure when the car meets a min rule', () => {
    const rule: EliminatoryRule = {
      field: 'trunkLiters',
      operator: 'min',
      value: 400,
    };
    expect(evaluateRules(values, [rule])).toEqual([]);
  });

  it('returns a failure with threshold and actual when the car misses a min rule', () => {
    const rule: EliminatoryRule = {
      field: 'trunkLiters',
      operator: 'min',
      value: 600,
    };
    expect(evaluateRules(values, [rule])).toEqual([
      { field: 'trunkLiters', operator: 'min', threshold: 600, actual: 500 },
    ]);
  });

  it('returns no failure when the car meets a max rule', () => {
    const rule: EliminatoryRule = {
      field: 'lengthMm',
      operator: 'max',
      value: 4600,
    };
    expect(evaluateRules(values, [rule])).toEqual([]);
  });

  it('returns a failure when the car exceeds a max rule', () => {
    const rule: EliminatoryRule = {
      field: 'lengthMm',
      operator: 'max',
      value: 4000,
    };
    expect(evaluateRules(values, [rule])).toEqual([
      { field: 'lengthMm', operator: 'max', threshold: 4000, actual: 4540 },
    ]);
  });

  it('does not count a car missing the field as a failure (requisito 1.4)', () => {
    // sportageFixture es HEV: no declara electricRangeKm.
    const rule: EliminatoryRule = {
      field: 'electricRangeKm',
      operator: 'min',
      value: 100,
    };
    expect(evaluateRules(values, [rule])).toEqual([]);
  });

  it('a car that does declare the field can still fail the same rule', () => {
    const x1Values = numericFieldValues(x1Fixture);
    const rule: EliminatoryRule = {
      field: 'electricRangeKm',
      operator: 'min',
      value: 100,
    };
    expect(evaluateRules(x1Values, [rule])).toEqual([
      { field: 'electricRangeKm', operator: 'min', threshold: 100, actual: 83 },
    ]);
  });

  it('evaluates every rule independently and collects every failure', () => {
    const rules: EliminatoryRule[] = [
      { field: 'trunkLiters', operator: 'min', value: 600 },
      { field: 'lengthMm', operator: 'max', value: 4000 },
      { field: 'priceEur', operator: 'max', value: 50000 },
    ];
    const failures = evaluateRules(values, rules);
    expect(failures.map((f) => f.field)).toEqual(['trunkLiters', 'lengthMm']);
  });

  it('with no rules, nothing ever fails', () => {
    expect(evaluateRules(values, [])).toEqual([]);
  });
});

describe('requiredOperatorFor and isOperatorAllowed (requisito 1.2)', () => {
  it('forces "min" for every moreIsBetter field and "max" for every moreIsWorse field', () => {
    for (const field of FICHA_FIELDS) {
      const polarity = polarityOf(field);
      const required = requiredOperatorFor(field);
      if (polarity === 'moreIsBetter') expect(required).toBe('min');
      if (polarity === 'moreIsWorse') expect(required).toBe('max');
      if (polarity === 'neutral') expect(required).toBeNull();
    }
  });

  it('allows both operators on a neutral field', () => {
    expect(polarityOf('heightMm')).toBe('neutral');
    for (const operator of RULE_OPERATORS) {
      expect(isOperatorAllowed('heightMm', operator)).toBe(true);
    }
  });

  it('allows only the forced operator on a directional field', () => {
    expect(isOperatorAllowed('trunkLiters', 'min')).toBe(true);
    expect(isOperatorAllowed('trunkLiters', 'max')).toBe(false);
    expect(isOperatorAllowed('lengthMm', 'max')).toBe(true);
    expect(isOperatorAllowed('lengthMm', 'min')).toBe(false);
  });
});
