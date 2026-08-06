import { describe, expect, it } from 'vitest';
import { PhotoSchema, PhotosSchema, photoSrc } from './photo';

function validPhoto(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    url: 'https://example.com/kia-ev3-lateral.jpg',
    credit: 'Kia Media',
    shows: 'EV3 GT-Line, azul',
    ...overrides,
  };
}

describe('PhotoSchema', () => {
  it('accepts a well-formed photo', () => {
    expect(PhotoSchema.safeParse(validPhoto()).success).toBe(true);
  });

  it('rejects a URL that is not https', () => {
    expect(
      PhotoSchema.safeParse(validPhoto({ url: 'http://example.com/x.jpg' }))
        .success,
    ).toBe(false);
  });

  it('rejects a URL that is not a valid URL at all', () => {
    expect(
      PhotoSchema.safeParse(validPhoto({ url: 'not-a-url' })).success,
    ).toBe(false);
  });

  it('rejects a photo without credit', () => {
    expect(PhotoSchema.safeParse(validPhoto({ credit: '' })).success).toBe(
      false,
    );
  });

  it('rejects a photo without shows', () => {
    expect(PhotoSchema.safeParse(validPhoto({ shows: '' })).success).toBe(
      false,
    );
  });
});

describe('PhotosSchema', () => {
  it('defaults to an empty object when omitted', () => {
    const result = PhotosSchema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({});
  });

  it('accepts a subset of the five views', () => {
    const result = PhotosSchema.safeParse({ side: validPhoto() });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.side).toBeDefined();
      expect(result.data.front).toBeUndefined();
    }
  });

  it('rejects an unknown view name', () => {
    // Zod ignora claves de más por defecto: esto documenta que "front" mal
    // escrito no rompe la carga, y por eso `shows`/`credit` son el único
    // lugar donde puede detectarse un dato mal cargado.
    const result = PhotosSchema.safeParse({ frontal: validPhoto() });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).not.toHaveProperty('frontal');
  });
});

describe('photoSrc', () => {
  it('resolves to the linked URL as-is', () => {
    const photo = validPhoto();
    expect(photoSrc(PhotoSchema.parse(photo))).toBe(photo.url);
  });
});
