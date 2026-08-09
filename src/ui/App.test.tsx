import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from './App';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import {
  EXPLICACION_HASH,
  FICHA_COMPLETA_HASH,
  FICHA_TECNICA_HASH,
} from './useHashRoute';

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

  it('links from the comparator to the ficha completa, by fragment (product/0014)', () => {
    const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
    expect(markup).toContain(`href="${FICHA_COMPLETA_HASH}"`);
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

  describe('with the ficha completa fragment already in the URL', () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('renders the ficha completa instead of the comparator (product/0014)', () => {
      vi.stubGlobal('window', {
        location: { hash: FICHA_COMPLETA_HASH },
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      });

      const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
      expect(markup).toContain('<table');
      expect(markup).toContain('name="pinned-model"');
      expect(markup).not.toContain('aria-label="Ranking"');
    });
  });

  describe('despublicar un modelo (product/0015)', () => {
    function withEv3Unpublished() {
      return threeCarFixture.map((car) =>
        car.id === 'kia-ev3' ? { ...car, published: false } : car,
      );
    }

    it('leaves an unpublished car out of the ranking, keeping the rest', () => {
      const markup = renderToStaticMarkup(<App load={withEv3Unpublished} />);
      expect(markup).toContain('Sportage HEV');
      expect(markup).toContain('X1 xDrive25e');
      expect(markup).not.toContain('EV3');
    });

    it('leaves an unpublished car out of the ficha técnica', () => {
      vi.stubGlobal('window', {
        location: { hash: FICHA_TECNICA_HASH },
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      });
      const markup = renderToStaticMarkup(<App load={withEv3Unpublished} />);
      expect(markup).toContain('Sportage HEV');
      expect(markup).not.toContain('EV3');
      vi.unstubAllGlobals();
    });

    it('leaves an unpublished car out of the ficha completa', () => {
      vi.stubGlobal('window', {
        location: { hash: FICHA_COMPLETA_HASH },
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      });
      const markup = renderToStaticMarkup(<App load={withEv3Unpublished} />);
      expect(markup).toContain('Sportage HEV');
      expect(markup).not.toContain('EV3');
      vi.unstubAllGlobals();
    });

    it('treats every candidate unpublished the same as an empty catalogue', () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      const allUnpublished = () =>
        threeCarFixture.map((car) => ({ ...car, published: false }));

      let markup = '';
      expect(() => {
        markup = renderToStaticMarkup(<App load={allUnpublished} />);
      }).not.toThrow();

      expect(markup).toContain('No se ha podido cargar el catálogo');
      expect(markup).toContain('el catálogo no puede estar vacío');

      consoleError.mockRestore();
    });
  });

  describe('configuración persistente y compartible (product/0012)', () => {
    function fakeStorage(initial: Record<string, string> = {}) {
      const map = new Map(Object.entries(initial));
      return {
        getItem: (key: string) => map.get(key) ?? null,
        setItem: (key: string, value: string) => {
          map.set(key, value);
        },
        removeItem: (key: string) => {
          map.delete(key);
        },
      };
    }

    function stubBrowser({
      search = '',
      storage = fakeStorage(),
    }: {
      search?: string;
      storage?: ReturnType<typeof fakeStorage>;
    } = {}) {
      vi.stubGlobal('window', {
        location: { hash: '', search, href: `http://x.test/${search}` },
        localStorage: storage,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      });
    }

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('starts from the defaults when nothing is stored and the URL is clean', () => {
      stubBrowser();
      const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
      expect(markup).toContain('Presupuesto 47.000 €');
    });

    it('restores a weight saved in localStorage when the URL is clean', () => {
      const storage = fakeStorage({
        'comparador-coches:config': JSON.stringify({
          version: 1,
          weights: {
            viaje: 7,
            diario: 3,
            prestaciones: 1,
            fiabilidad: 2,
            estetica: 2,
            coste: 1,
          },
          assumptions: {
            kmPorAnio: 15000,
            precioLitro: 1.55,
            precioKwh: 0.45,
            mezclaEstetica: 0.6,
            ponderacionAnchoDiario: 0.6,
            pensandoVender: false,
            cargaEnCasa: false,
          },
          budgetEur: 47000,
          hideOverBudget: false,
          overrides: {},
        }),
      });
      stubBrowser({ storage });
      const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
      expect(markup).toContain('viaje 7');
    });

    it('prefers the URL over a different configuration saved in localStorage (requisito 3)', () => {
      const storage = fakeStorage({
        'comparador-coches:config': JSON.stringify({
          version: 1,
          weights: {
            viaje: 7,
            diario: 3,
            prestaciones: 1,
            fiabilidad: 2,
            estetica: 2,
            coste: 1,
          },
          assumptions: {
            kmPorAnio: 15000,
            precioLitro: 1.55,
            precioKwh: 0.45,
            mezclaEstetica: 0.6,
            ponderacionAnchoDiario: 0.6,
            pensandoVender: false,
            cargaEnCasa: false,
          },
          budgetEur: 47000,
          hideOverBudget: false,
          overrides: {},
        }),
      });
      stubBrowser({ search: '?budget=30000&v=1', storage });
      const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
      // Gana el enlace (presupuesto 30.000), no lo guardado (peso de viaje a 7).
      expect(markup).toContain('Presupuesto 30.000 €');
      expect(markup).not.toContain('viaje 7');
    });

    it('falls back to defaults when localStorage holds an unknown config version', () => {
      const storage = fakeStorage({
        'comparador-coches:config': JSON.stringify({ version: 999 }),
      });
      stubBrowser({ storage });
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
      expect(markup).toContain('Presupuesto 47.000 €');
      consoleError.mockRestore();
    });

    it('exposes an action to copy the share link and one to reset to defaults', () => {
      stubBrowser();
      const markup = renderToStaticMarkup(<App load={() => threeCarFixture} />);
      expect(markup).toContain('Copiar enlace');
      expect(markup).toContain('Restablecer valores por defecto');
    });
  });
});
