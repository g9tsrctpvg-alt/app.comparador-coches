import { describe, expect, it } from 'vitest';
import { mustGet } from './mustGet';

describe('mustGet', () => {
  it('returns the value for a key that exists', () => {
    const map = new Map([['a', 1]]);
    expect(mustGet(map, 'a')).toBe(1);
  });

  it('throws a descriptive error for a missing key', () => {
    const map = new Map<string, number>();
    expect(() => mustGet(map, 'missing')).toThrow(/missing/);
  });
});
