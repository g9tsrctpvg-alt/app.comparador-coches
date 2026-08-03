import { describe, expect, it } from 'vitest';
import { validateDocs } from './validateDocs';

/**
 * Los tests de `validateDocs.test.ts` prueban las reglas contra fixtures. Este
 * las ejecuta contra los documentos reales del repositorio: es el que se
 * pondría rojo si alguien escribe una spec mal formada.
 *
 * Se leen con `import.meta.glob` de Vite en vez de con `node:fs` para no
 * añadir `@types/node`, que sería una dependencia nueva.
 */
function readRepositoryDocuments(): Record<string, string> {
  const specs = import.meta.glob('../specs/**/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
  const adrs = import.meta.glob('../docs/decisions/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  const documents: Record<string, string> = {};
  for (const [key, text] of Object.entries({ ...specs, ...adrs })) {
    documents[key.replace(/^\.\.\//, '')] = text;
  }
  return documents;
}

/** Los directorios que de verdad contienen documentos. */
function directoriesOf(documents: Record<string, string>): string[] {
  const directories = new Set<string>();
  for (const path of Object.keys(documents)) {
    const cut = path.lastIndexOf('/');
    if (cut > 0) directories.add(path.slice(0, cut));
  }
  return [...directories];
}

describe('the repository’s own specs and ADRs', () => {
  const documents = readRepositoryDocuments();

  it('finds the documents to check', () => {
    expect(Object.keys(documents).length).toBeGreaterThan(0);
    expect(documents['specs/TEMPLATE.md']).toBeDefined();
    expect(documents['docs/decisions/TEMPLATE.md']).toBeDefined();
  });

  it('passes every validation rule', () => {
    const result = validateDocs({
      documents,
      directories: directoriesOf(documents),
    });
    expect(result.errors).toEqual([]);
    expect(result.checked).toBeGreaterThan(0);
  });
});
