import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from './App';
import { threeCarFixture } from '../domain/scoring/testFixtures';

describe('App', () => {
  it('renders the declared error message when the catalogue fails to load', () => {
    // Antes no llegaba a renderizarse nunca: el `useMemo` de puntuación
    // corría antes del early return y llamaba a `scoreCatalog([])`, que
    // lanzaba y se llevaba por delante toda la aplicación.
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const load = () => {
      throw new Error('cars.json ilegible');
    };

    let markup = '';
    expect(() => {
      markup = renderToStaticMarkup(<App load={load} />);
    }).not.toThrow();

    expect(markup).toContain('No se ha podido cargar el catálogo');
    expect(markup).toContain('cars.json ilegible');

    consoleError.mockRestore();
  });

  it('renders the ranking when the catalogue loads', () => {
    const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
    expect(markup).toContain('Comparador de coches');
    expect(markup).toContain('Ranking');
  });
});
