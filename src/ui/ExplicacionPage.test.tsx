import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ExplicacionPage } from './ExplicacionPage';
import {
  AXIS_LABELS,
  AXIS_ORDER,
  DEFAULT_WEIGHTS,
} from '../domain/scoring/weights';
import { DEFAULT_ASSUMPTIONS } from '../domain/scoring/assumptions';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import { AXIS_THEME_CLASS } from './axisTheme';

function render(): string {
  return renderToStaticMarkup(<ExplicacionPage cars={threeCarFixture} />);
}

describe('ExplicacionPage', () => {
  it('titles every axis block with the label the domain declares, live — not a hand-written copy', () => {
    // No se reescribe la etiqueta a mano (requisito 3): si `AXIS_LABELS`
    // cambia en `weights.ts`, esta misma comprobación, sin tocarse, deja de
    // encontrar la etiqueta vieja y pasa a exigir la nueva.
    const markup = render();
    for (const axisId of AXIS_ORDER) {
      expect(markup).toContain(AXIS_LABELS[axisId]);
    }
  });

  it('shows the default weight of every axis, read from DEFAULT_WEIGHTS', () => {
    const markup = render();
    for (const axisId of AXIS_ORDER) {
      // Cada peso por defecto aparece dos veces: en el bloque del eje y en
      // la sección «Los pesos».
      const needle = `>${DEFAULT_WEIGHTS[axisId]}</span>`;
      expect(markup.split(needle).length - 1).toBeGreaterThanOrEqual(2);
    }
  });

  it('shows every default assumption value, read from DEFAULT_ASSUMPTIONS', () => {
    const markup = render();
    expect(markup).toContain(
      `${DEFAULT_ASSUMPTIONS.kmPorAnio.toLocaleString('es-ES')} km`,
    );
    expect(markup).toContain(
      `${DEFAULT_ASSUMPTIONS.precioLitro.toFixed(2)} €/l`,
    );
    expect(markup).toContain(
      `${DEFAULT_ASSUMPTIONS.precioKwh.toFixed(2)} €/kWh`,
    );
  });

  it('shows all eighteen anchors with a value taken from the domain', () => {
    const markup = render();
    // Cinco ejes de dos magnitudes cada uno —diario, prestaciones,
    // fiabilidad, estética (editable por el usuario, pero con la misma
    // forma de anclaje) y coste—, más `carga` con una sola magnitud y
    // `habitabilidad` con dos (product/0033 parte lo que antes era `viaje`,
    // de tres magnitudes, sin cambiar el total): trece. `prueba` añade
    // cinco más, uno por juicio (product/0037): dieciocho en total.
    const anchorCount = (markup.match(/→ 10/g) ?? []).length;
    expect(anchorCount).toBe(18);
    expect((markup.match(/→ 0/g) ?? []).length).toBe(18);
  });

  it('gives every anchor row its own non-empty reasoning text — none left blank by index', () => {
    // `anchorRow` empareja `axis.subcomponents` con `anchorReasoning` por
    // índice (AXIS_CONTENT, comentario de cabecera): un array más corto que
    // el otro deja alguna fila con el hueco vacío. Regresión concreta,
    // heredada de antes de `product/0033`: `viaje` ganó un tercer
    // subcomponente (product/0017) sin que `anchorReasoning` ganara una
    // tercera entrada.
    const markup = render();
    const reasoningCells =
      markup.match(/<dd class="[^"]*reasoning[^"]*">([\s\S]*?)<\/dd>/g) ?? [];
    expect(reasoningCells).toHaveLength(18);
    for (const cell of reasoningCells) {
      expect(cell.replace(/<[^>]*>/g, '').trim().length).toBeGreaterThan(0);
    }
  });

  it("does not restate habitabilidad's own weights with numbers stale against its live formula", () => {
    // Regresión concreta, heredada de `viaje` antes de `product/0033`: la
    // prosa fija de `anchorReasoning` decía «0,6 frente a 0,4» cuando la
    // fórmula viva —la que ya renderiza esta misma página vía
    // `scoreCatalog`, no un import aparte de `scoring/`
    // (`ui-no-scoring-internals`)— ya llevaba otro reparto. Hoy
    // `habitabilidad` reparte batalla y anchura de hombros al 50/50; la
    // prosa fija no puede quedarse atrás de la fórmula que tiene al lado en
    // la misma página.
    const markup = render();
    const block = /id="eje-habitabilidad"[\s\S]*?<\/article>/.exec(markup);
    const habitabilidadBlock = block?.[0] ?? '';
    const formulaMatch = /<p class="[^"]*formula[^"]*">([^<]*)<\/p>/.exec(
      habitabilidadBlock,
    );
    const liveFormula = formulaMatch?.[1] ?? '';
    expect(liveFormula).toContain('0,5');
    expect(habitabilidadBlock).not.toContain('0,6 frente a 0,4');
    expect(habitabilidadBlock).not.toContain('0,25 cada una');
  });

  it('declares that estética is the only axis without an S-curve, and why', () => {
    const markup = render();
    expect(markup).toContain('único eje sin curva en S');
  });

  it('warns about what a tied weight does not do', () => {
    const markup = render();
    expect(markup).toMatch(/no cambia nada/);
  });

  it('names both known limitations', () => {
    const markup = render();
    expect(markup).toContain(
      'La fiabilidad de la OCU es por marca, no por modelo',
    );
    expect(markup).toContain('Corolla Cross 140H');
  });

  it('has exactly one h1 and never skips a heading level', () => {
    const markup = render();
    const levels = [...markup.matchAll(/<h([1-6])[ >]/g)].map((m) =>
      Number(m[1]),
    );
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]! - levels[i - 1]!).toBeLessThanOrEqual(1);
    }
  });

  it('renders its own view title as the only heading (technical/0005, requisito 4.2)', () => {
    // La vuelta a la comparativa ya no es un enlace propio de esta página:
    // la marca de `AppHeader`, montada por `AppShell`, cumple ese papel una
    // sola vez para las tres vistas.
    const markup = render();
    expect(markup).toMatch(/<h1[^>]*>Cómo se calcula todo<\/h1>/);
  });

  it('themes every axis block and every weight row with its own axis color (technical/0011)', () => {
    const markup = render();
    for (const axisId of AXIS_ORDER) {
      const themeClass = AXIS_THEME_CLASS[axisId];
      // Dos sitios por eje: la tarjeta de la sección «Los ocho ejes» y su
      // fila en la lista de pesos.
      expect(markup.split(themeClass).length - 1, axisId).toBe(2);
    }
  });

  it('draws an icon beside every axis name, and none of them announces itself', () => {
    const markup = render();
    // Catorce iconos: siete tarjetas más siete filas de peso. Si alguno se
    // anunciara, el lector de pantalla diría el nombre del eje dos veces.
    const icons = markup.match(/<svg[^>]*>/g) ?? [];
    const axisIcons = icons.filter((tag) => tag.includes('aria-hidden="true"'));
    expect(axisIcons.length).toBe(AXIS_ORDER.length * 2);
  });

  it('renders no score calculation of its own: only reads what scoreCatalog already computed', () => {
    // No hay aserción de arquitectura posible en un test de comportamiento;
    // esto documenta la garantía real, que vive en `.dependency-cruiser.mjs`
    // (regla `ui-no-scoring-internals`) y en `npm run arch:check`.
    expect(() => render()).not.toThrow();
  });
});
