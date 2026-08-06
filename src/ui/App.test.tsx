import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from './App';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import { EXPLICACION_HASH, FICHA_TECNICA_HASH } from './useHashRoute';

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

  it('links from the comparator to the explanation page, by fragment', () => {
    const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
    expect(markup).toContain(`href="${EXPLICACION_HASH}"`);
  });

  it('links from the comparator to the ficha técnica, by fragment (product/0013, requisito 1)', () => {
    const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
    expect(markup).toContain(`href="${FICHA_TECNICA_HASH}"`);
    expect(markup).toContain('aria-label="Vista"');
  });

  describe('with the explanation fragment already in the URL', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('renders the explanation page instead of the comparator (product/0011, requisito 1)', () => {
      // Simula lo que ocurre al recargar el navegador con el fragmento de la
      // explicación en la URL: `renderToStaticMarkup` corre en Node, así que
      // `window` no existe por defecto y hay que dárselo para probar la
      // rama de enrutado.
      vi.stubGlobal('window', {
        location: { hash: EXPLICACION_HASH },
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      });

      const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
      expect(markup).toContain('Cómo se calcula todo');
      expect(markup).toContain('Volver a la comparativa');
      expect(markup).not.toContain('aria-label="Ranking"');
    });
  });

  describe('with the ficha técnica fragment already in the URL', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('renders the ficha técnica instead of the comparator (product/0013, requisito 2)', () => {
      // Igual que con la explicación: recargar con el fragmento de la ficha
      // técnica en la URL debe abrir la ficha técnica, no la clasificación.
      vi.stubGlobal('window', {
        location: { hash: FICHA_TECNICA_HASH },
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      });

      const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
      expect(markup).toContain('<table');
      expect(markup).not.toContain('aria-label="Ranking"');
    });
  });
});
