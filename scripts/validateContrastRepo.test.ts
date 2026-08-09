import { describe, expect, it } from 'vitest';
import { validateContrast } from './validateContrast';

/**
 * Ejecuta `validateContrast` contra la hoja global real, igual que
 * `validateStyleTokensRepo.test.ts` hace con los `.module.css`: es el que
 * se pondría rojo si un cambio de paleta rompiera el contraste de un par
 * declarado.
 */
function readGlobalStylesheet(): string {
  const files = import.meta.glob('../src/styles/*.css', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
  const text = Object.values(files)[0];
  if (!text) {
    throw new Error(
      `No se encontró src/styles/global.css (claves: ${Object.keys(files).join(', ') || 'ninguna'})`,
    );
  }
  return text;
}

describe('the repository’s own color tokens', () => {
  it('passes every declared contrast pair', () => {
    const result = validateContrast({
      globalStylesheet: readGlobalStylesheet(),
    });
    expect(result.errors).toEqual([]);
    expect(result.checked).toBeGreaterThan(0);
  });
});
