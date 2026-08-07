import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FichaCompletaPage, TOTAL_FIELD_COUNT } from './FichaCompletaPage';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import type { Reference } from '../domain/reference';

function referenceFixture(overrides: Partial<Reference> = {}): Reference {
  return {
    id: 'alfa-romeo-giulietta',
    name: 'Giulietta',
    brand: 'Alfa Romeo',
    technology: 'ICE',
    photos: {
      side: {
        url: 'https://example.com/giulietta-lateral.jpg',
        credit: 'Alfa Romeo Media',
        shows: 'Giulietta Super, blanco',
      },
    },
    lengthMm: {
      value: 4351,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 4351, estimated: false, current: true },
      ],
    },
    widthMm: {
      value: 1798,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 1798, estimated: false, current: true },
      ],
    },
    heightMm: {
      value: 1465,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 1465, estimated: false, current: true },
      ],
    },
    groundClearanceMm: {
      value: 130,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 130, estimated: true, current: true },
      ],
    },
    trunkLiters: {
      value: 350,
      unit: 'L',
      sources: [
        { label: 'Fixture', value: 350, estimated: false, current: true },
      ],
    },
    ...overrides,
  };
}

describe('FichaCompletaPage', () => {
  it('renders a real table, transposed with a scoped header per model column', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('<table');
    expect(markup).toContain('<thead');
    expect(markup).toMatch(/<th scope="col"/);
    expect(markup).toMatch(/<th scope="row"/);
  });

  it('shows one header column per candidate plus the reference', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    for (const car of threeCarFixture) {
      expect(markup).toContain(car.name);
    }
    expect(markup).toContain('Giulietta');
    expect(markup).toContain('Referencia');
  });

  it('renders exactly one data row per magnitude, across all blocks', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    const dataRows = markup.match(/<th scope="row"/g) ?? [];
    expect(dataRows).toHaveLength(TOTAL_FIELD_COUNT);
  });

  it('renders the block headers', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    for (const label of [
      'Tamaño y espacio',
      'Mecánica y prestaciones',
      'Coste',
      'Fiabilidad y respaldo',
      'Juicio propio',
    ]) {
      expect(markup).toContain(label);
    }
  });

  it('pins the reference by default, as a single-choice radio group', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toMatch(/name="pinned-model"/);
    // Semánticamente radio, no casilla: solo una columna puede estar fijada.
    const pinInputs =
      markup.match(/<input[^>]*name="pinned-model"[^>]*\/>/g) ?? [];
    expect(pinInputs.length).toBeGreaterThan(0);
    expect(pinInputs.every((tag) => tag.includes('type="radio"'))).toBe(true);
    // El input de la Giulietta es el único marcado por defecto.
    const checked = markup.match(/name="pinned-model"[^>]*checked=""/g) ?? [];
    expect(checked).toHaveLength(1);
    expect(markup).toMatch(
      /aria-label="Comparar contra Giulietta"[^>]*checked=""/,
    );
  });

  it('does not repeat the pinned model among the scrollable columns', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    const theadMatch = /<thead>([\s\S]*?)<\/thead>/.exec(markup);
    const thead = theadMatch?.[1] ?? '';
    const headerColumns = thead.split('<th scope="col"').slice(1);
    const columnsWithGiulietta = headerColumns.filter((chunk) =>
      chunk.includes('Giulietta'),
    );
    expect(columnsWithGiulietta).toHaveLength(1);
  });

  it('starts the photo view selector on "Lateral"', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toMatch(/name="photo-view"/);
    const checked = markup.match(/name="photo-view"[^>]*checked=""/g) ?? [];
    expect(checked).toHaveLength(1);
    expect(markup).toMatch(
      /<input[^>]*name="photo-view"[^>]*checked=""[^>]*value="side"/,
    );
  });

  it('renders the reference photo as a real img with a descriptive alt', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('alt="Giulietta, vista lateral"');
    // Sin `loading="lazy"` (product/0014, corrección de 2026-08-07): con un
    // único `photoView` activo a la vez hay como mucho una docena de `<img>`
    // en el DOM, no las «sesenta peticiones» que motivaron el diferido
    // original, y perezosa dentro de una tabla con columnas fijas por
    // `position: sticky` nunca llegaba a disparar la carga en algunos
    // navegadores: la miniatura se quedaba en blanco aunque la foto ampliada
    // —sin `loading="lazy"`— sí cargaba al pulsarla.
    expect(markup).not.toContain('loading=');
  });

  it('shows a labelled placeholder, no <img>, for a candidate with no photo of the selected view', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    // Ninguno de los tres candidatos del fixture declara fotos.
    expect(markup).toContain('Lateral — sin foto');
  });

  it('renders the view switcher with ficha completa marked as active', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('aria-label="Vista"');
    expect(markup).toMatch(/Ficha completa<\/a>/);
  });

  it('renders the horizontally scrolling container as a focusable group', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('role="group"');
    expect(markup).toContain('tabindex="0"');
  });

  it('renders with no reference registered, pinning the first candidate instead', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage cars={threeCarFixture} references={[]} />,
    );
    expect(markup).toContain('<table');
    expect(markup).not.toContain('Referencia');
    expect(markup).toMatch(
      new RegExp(
        `aria-label="Comparar contra ${threeCarFixture[0]?.name}"[^>]*checked=""`,
      ),
    );
  });

  it('renders the closed photo dialog with no figure until a photo is opened', () => {
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('<dialog');
    expect(markup).not.toContain('<figure');
  });
});
