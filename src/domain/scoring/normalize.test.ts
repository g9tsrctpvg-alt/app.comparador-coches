import { describe, expect, it } from 'vitest';
import { EmptyCandidateSetError, normalizeAll } from './normalize';

const entries = [
  { carId: 'a', carName: 'A', value: 10 },
  { carId: 'b', carName: 'B', value: 20 },
  { carId: 'c', carName: 'C', value: 30 },
];

describe('normalizeAll', () => {
  it('gives 0 to the minimum and 10 to the maximum when higher is better', () => {
    const result = normalizeAll('mayor-mejor', entries);
    expect(result.get('a')!.normalizedValue).toBe(0);
    expect(result.get('c')!.normalizedValue).toBe(10);
    expect(result.get('b')!.normalizedValue).toBe(5);
  });

  it('gives 10 to the minimum and 0 to the maximum when lower is better', () => {
    const result = normalizeAll('menor-mejor', entries);
    expect(result.get('a')!.normalizedValue).toBe(10);
    expect(result.get('c')!.normalizedValue).toBe(0);
  });

  it('identifies which model marks each extreme, by id and name', () => {
    const result = normalizeAll('mayor-mejor', entries);
    const normalization = result.get('b')!;
    expect(normalization.min).toEqual({ carId: 'a', carName: 'A', value: 10 });
    expect(normalization.max).toEqual({ carId: 'c', carName: 'C', value: 30 });
  });

  it('rejects an empty candidate set by name instead of failing inside reduce', () => {
    // Antes lanzaba `TypeError: Reduce of empty array with no initial value`,
    // que no dice nada de lo que ha pasado y llegaba hasta el render.
    expect(() => normalizeAll('mayor-mejor', [])).toThrow(
      EmptyCandidateSetError,
    );
    expect(() => normalizeAll('mayor-mejor', [])).toThrow(
      /conjunto de candidatos vacío/,
    );
  });

  it('finds the same min and max regardless of the order candidates arrive in', () => {
    // No product axis still calls normalizeAll (product/0007 was the last
    // one to migrate), so this is the only place left exercising both
    // branches of each reduce — reordering the fixture keeps that true
    // instead of leaving it to whichever axis happened to pass values in a
    // convenient order.
    const reordered = [
      { carId: 'b', carName: 'B', value: 20 },
      { carId: 'a', carName: 'A', value: 10 },
      { carId: 'c', carName: 'C', value: 30 },
    ];
    const result = normalizeAll('mayor-mejor', reordered);
    expect(result.get('a')!.normalizedValue).toBe(0);
    expect(result.get('c')!.normalizedValue).toBe(10);
  });

  it('gives the neutral midpoint to every candidate when all values tie', () => {
    const tied = [
      { carId: 'a', carName: 'A', value: 5 },
      { carId: 'b', carName: 'B', value: 5 },
    ];
    const result = normalizeAll('mayor-mejor', tied);
    expect(result.get('a')!.normalizedValue).toBe(5);
    expect(result.get('b')!.normalizedValue).toBe(5);
  });
});
