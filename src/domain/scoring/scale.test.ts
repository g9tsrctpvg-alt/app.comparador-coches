import { describe, expect, it } from 'vitest';
import { scoreOnAbsoluteScale } from './scale';

describe('scoreOnAbsoluteScale', () => {
  it('gives 10 at and beyond the good anchor when higher is better', () => {
    expect(scoreOnAbsoluteScale(2850, 2850, 2400)).toBe(10);
    expect(scoreOnAbsoluteScale(3000, 2850, 2400)).toBe(10);
  });

  it('gives 0 at and beyond the bad anchor when higher is better', () => {
    expect(scoreOnAbsoluteScale(2400, 2850, 2400)).toBe(0);
    expect(scoreOnAbsoluteScale(2200, 2850, 2400)).toBe(0);
  });

  it('gives 10 at and below the good anchor when lower is better', () => {
    expect(scoreOnAbsoluteScale(1765, 1765, 2000)).toBe(10);
    expect(scoreOnAbsoluteScale(1663, 1765, 2000)).toBe(10);
  });

  it('gives 0 at and above the bad anchor when lower is better', () => {
    expect(scoreOnAbsoluteScale(2000, 1765, 2000)).toBe(0);
    expect(scoreOnAbsoluteScale(2010, 1765, 2000)).toBe(0);
  });

  it('gives 5 at the midpoint between anchors', () => {
    expect(scoreOnAbsoluteScale(1882.5, 1765, 2000)).toBeCloseTo(5, 9);
  });

  it('scores less than 1 at 10% of the way from the bad anchor, per the S curve', () => {
    // t = 0.9: la pendiente es casi nula cerca del anclaje malo, así que la
    // curva castiga mucho más que una recta lo haría (que daría 1,0).
    const value = 2000 - 0.1 * (2000 - 1765);
    expect(scoreOnAbsoluteScale(value, 1765, 2000)).toBeLessThan(1);
  });

  it('is not linear: the drop from good to midpoint differs from midpoint to bad', () => {
    const atQuarter = scoreOnAbsoluteScale(1765 + 0.25 * 235, 1765, 2000);
    const atThreeQuarters = scoreOnAbsoluteScale(1765 + 0.75 * 235, 1765, 2000);
    // Simétrica en forma pero comprobamos que no es una recta: el primer
    // cuarto pierde menos que el resto de la mitad hasta el medio.
    expect(10 - atQuarter).not.toBeCloseTo(2.5, 1);
    expect(atThreeQuarters).not.toBeCloseTo(2.5, 1);
  });
});
