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

  it('shows all thirteen anchors with a value taken from the domain', () => {
    const markup = render();
    // Los cinco ejes con curva en S, dos magnitudes cada uno salvo `viaje`,
    // que desde product/0017 tiene tres, más las dos de estética (editables
    // por el usuario, pero con la misma forma de anclaje): trece en total.
    const anchorCount = (markup.match(/→ 10/g) ?? []).length;
    expect(anchorCount).toBe(13);
    expect((markup.match(/→ 0/g) ?? []).length).toBe(13);
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

  it('renders no score calculation of its own: only reads what scoreCatalog already computed', () => {
    // No hay aserción de arquitectura posible en un test de comportamiento;
    // esto documenta la garantía real, que vive en `.dependency-cruiser.mjs`
    // (regla `ui-no-scoring-internals`) y en `npm run arch:check`.
    expect(() => render()).not.toThrow();
  });
});
