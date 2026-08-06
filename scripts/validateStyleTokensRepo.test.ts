import { describe, expect, it } from 'vitest';
import { validateStyleTokens } from './validateStyleTokens';

/**
 * Ejecuta `validateStyleTokens` contra los `.module.css` reales de
 * `src/ui/` y la hoja global real, igual que `validateDocsRepo.test.ts`
 * hace con los documentos: es el que se pondría rojo si alguien cuela un
 * literal de diseño fuera de la hoja de tokens.
 */
function readModules(): Record<string, string> {
  const files = import.meta.glob('../src/ui/**/*.module.css', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const modules: Record<string, string> = {};
  for (const [key, text] of Object.entries(files)) {
    modules[key.replace(/^\.\.\//, '')] = text;
  }
  return modules;
}

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

describe('the repository’s own component stylesheets', () => {
  it('finds the global stylesheet and at least one module', () => {
    const modules = readModules();
    expect(Object.keys(modules).length).toBeGreaterThan(0);
    expect(readGlobalStylesheet().length).toBeGreaterThan(0);
  });

  it('passes every validation rule', () => {
    const result = validateStyleTokens({
      modules: readModules(),
      globalStylesheet: readGlobalStylesheet(),
    });
    expect(result.errors).toEqual([]);
    expect(result.checked).toBeGreaterThan(0);
  });
});
