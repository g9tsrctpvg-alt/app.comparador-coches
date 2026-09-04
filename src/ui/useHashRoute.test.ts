import { describe, expect, it } from 'vitest';
import {
  VISITA_HASH,
  visitaCarIdFromHash,
  visitaHashFor,
} from './useHashRoute';

describe('visitaCarIdFromHash', () => {
  it('reads the carId out of a visita hash', () => {
    expect(visitaCarIdFromHash(`${VISITA_HASH}/kia-ev3`)).toBe('kia-ev3');
  });

  it('decodes a percent-encoded carId', () => {
    expect(
      visitaCarIdFromHash(`${VISITA_HASH}/${encodeURIComponent('a b')}`),
    ).toBe('a b');
  });

  it('returns null on the index hash, with no trailing carId', () => {
    expect(visitaCarIdFromHash(VISITA_HASH)).toBeNull();
  });

  it('returns null on a hash outside the visita route', () => {
    expect(visitaCarIdFromHash('#/ficha')).toBeNull();
  });

  it('returns null instead of throwing on a malformed percent-encoding', () => {
    // Un `%` suelto o mal formado en el fragmento —tecleado a mano, o un
    // enlace roto— hacía que `decodeURIComponent` lanzara `URIError` sin que
    // nadie lo capturase, tirando la vista entera.
    expect(() => visitaCarIdFromHash(`${VISITA_HASH}/100%`)).not.toThrow();
    expect(visitaCarIdFromHash(`${VISITA_HASH}/100%`)).toBeNull();
  });
});

describe('visitaHashFor', () => {
  it('builds a visita hash for a carId, percent-encoding it', () => {
    expect(visitaHashFor('kia-ev3')).toBe(`${VISITA_HASH}/kia-ev3`);
  });
});
