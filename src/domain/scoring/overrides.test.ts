import { describe, expect, it } from 'vitest';
import {
  applyOverride,
  InvalidRatingOverrideError,
  type RatingOverride,
} from './overrides';
import { sportageFixture } from './testFixtures';

describe('applyOverride', () => {
  it('returns the car untouched when there is no override', () => {
    expect(applyOverride(sportageFixture, undefined)).toBe(sportageFixture);
  });

  it('replaces only the ratings the override declares', () => {
    const result = applyOverride(sportageFixture, { aestheticsExterior: 2 });
    expect(result.aestheticsExterior.value).toBe(2);
    expect(result.aestheticsInterior).toEqual(
      sportageFixture.aestheticsInterior,
    );
    expect(result.travelComfort).toEqual(sportageFixture.travelComfort);
  });

  it('replaces the three editable ratings when all are declared', () => {
    const result = applyOverride(sportageFixture, {
      aestheticsExterior: 1,
      aestheticsInterior: 5,
      travelComfort: 3.5,
    });
    expect(result.aestheticsExterior.value).toBe(1);
    expect(result.aestheticsInterior.value).toBe(5);
    expect(result.travelComfort.value).toBe(3.5);
  });

  it('keeps the rating label the catalogue declared', () => {
    const result = applyOverride(sportageFixture, { travelComfort: 2 });
    expect(result.travelComfort.label).toBe(
      sportageFixture.travelComfort.label,
    );
  });

  it('rejects a rating above the 1-5 range the domain declares', () => {
    expect(() =>
      applyOverride(sportageFixture, { aestheticsExterior: 9 }),
    ).toThrow(InvalidRatingOverrideError);
  });

  it('rejects a rating below the 1-5 range the domain declares', () => {
    // El `<input type="range">` del ranking respeta la cota, pero era el
    // único que lo hacía: cualquier otra vía de entrada la esquivaba.
    expect(() => applyOverride(sportageFixture, { travelComfort: 0 })).toThrow(
      /fuera del rango permitido/,
    );
  });

  it('names the offending field and car in the error', () => {
    let message = '';
    try {
      applyOverride(sportageFixture, { aestheticsInterior: 42 });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain('aestheticsInterior');
    expect(message).toContain(sportageFixture.id);
  });

  it('ignores a field explicitly set to undefined', () => {
    const override: RatingOverride = { aestheticsExterior: undefined };
    expect(applyOverride(sportageFixture, override)).toEqual(sportageFixture);
  });
});
