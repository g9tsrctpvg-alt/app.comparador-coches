import { describe, expect, it } from 'vitest';
import { normalizeAll } from './normalize';

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
