import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FichaPage, TOTAL_FIELD_COUNT } from './FichaPage';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import type { Reference } from '../domain/reference';
import fichaCss from './FichaPage.module.css?raw';

/** El cuerpo de una regla CSS por su selector, para afirmar sobre ella. */
function ruleBody(css: string, selector: string): string {
  const match = new RegExp(`^\\.${selector}\\s*\\{([^}]*)\\}`, 'm').exec(css);
  if (match?.[1] === undefined) {
    throw new Error(`No se encontró la regla .${selector}`);
  }
  return match[1];
}

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

describe('FichaPage', () => {
  it('renders a real table, transposed with a scoped header per model column', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    expect(markup).toContain('<table');
    expect(markup).toContain('<thead');
    expect(markup).toMatch(/<th scope="col"/);
    expect(markup).toMatch(/<th scope="row"/);
  });

  it('shows one header column per candidate plus the reference', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    for (const car of threeCarFixture) {
      expect(markup).toContain(car.name);
    }
    expect(markup).toContain('Giulietta');
    expect(markup).toContain('Referencia');
  });

  describe('field set (product/0018, requisito 4)', () => {
    it('starts on "Esenciales": six rows, no block headers', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
      );
      const dataRows = markup.match(/<th scope="row"/g) ?? [];
      expect(dataRows).toHaveLength(6);
      for (const label of [
        'Tamaño y espacio',
        'Mecánica y prestaciones',
        'Coste',
        'Fiabilidad y respaldo',
        'Juicio propio',
      ]) {
        expect(markup).not.toContain(label);
      }
      // Presente en Esenciales.
      expect(markup).toContain('Litros por m²');
      // Solo en Completa.
      expect(markup).not.toContain('Batalla');
    });

    it('offers "Esenciales" and "Completa" as the only two options, Esenciales selected', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
      );
      expect(markup).toMatch(/<select[^>]*id="field-set-select"/);
      expect(markup).toMatch(
        /<option value="esenciales" selected="">Esenciales<\/option>/,
      );
      expect(markup).toContain('<option value="completa">Completa</option>');
    });

    it('declares TOTAL_FIELD_COUNT as the twenty magnitudes of "Completa"', () => {
      expect(TOTAL_FIELD_COUNT).toBe(20);
    });
  });

  describe('comparison (product/0018, requisito 2)', () => {
    it('pins the reference by default, as a single-choice radio group', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
      );
      expect(markup).toMatch(/name="pinned-model"/);
      const pinInputs =
        markup.match(/<input[^>]*name="pinned-model"[^>]*\/>/g) ?? [];
      expect(pinInputs.length).toBeGreaterThan(0);
      expect(pinInputs.every((tag) => tag.includes('type="radio"'))).toBe(true);
      expect(markup).toMatch(
        /aria-label="Comparar contra Giulietta"[^>]*checked=""/,
      );
      // «Ninguno» no está marcado cuando hay una comparación activa.
      expect(markup).toMatch(
        /aria-label="No comparar contra ningún modelo"(?![^>]*checked)/,
      );
    });

    it('does not repeat the pinned model among the scrollable columns', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
      );
      const theadMatch = /<thead>([\s\S]*?)<\/thead>/.exec(markup);
      const thead = theadMatch?.[1] ?? '';
      const headerColumns = thead.split('<th scope="col"').slice(1);
      const columnsWithGiulietta = headerColumns.filter((chunk) =>
        chunk.includes('Giulietta'),
      );
      expect(columnsWithGiulietta).toHaveLength(1);
    });

    it('shows the signed delta of each candidate against the pinned reference', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
      );
      // Sportage: 4540mm frente a 4351mm de la Giulietta → +189.
      expect(markup).toMatch(/cellDelta[^"]*">\+189\s*mm</);
    });

    it('leaves the pinned column without any delta: it is not compared to itself', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
      );
      const theadMatch = /<thead>([\s\S]*?)<\/thead>/.exec(markup);
      const thead = theadMatch?.[1] ?? '';
      expect(thead).not.toContain('cellDelta');
    });

    it('defaults to "Ninguno" — no pinned column, no delta anywhere — when there is no reference', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[]} />,
      );
      expect(markup).toContain('<table');
      expect(markup).not.toContain('Referencia');
      expect(markup).not.toContain('pinnedHeader');
      expect(markup).not.toContain('cellDelta');
      expect(markup).toMatch(
        /aria-label="No comparar contra ningún modelo"[^>]*checked=""/,
      );
    });
  });

  describe('order (product/0018, requisito 5)', () => {
    it('offers the four sort criteria, starting on ascending length', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
      );
      expect(markup).toMatch(/<select[^>]*id="sort-select"/);
      expect(markup).toMatch(
        /<option value="lengthMm" selected="">Longitud<\/option>/,
      );
      for (const label of ['Catálogo', 'Anchura', 'Precio']) {
        expect(markup).toContain(`>${label}<`);
      }
    });

    it('sorts the scrollable columns ascending by length by default', () => {
      const markup = renderToStaticMarkup(
        <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
      );
      const theadMatch = /<thead>([\s\S]*?)<\/thead>/.exec(markup);
      const thead = theadMatch?.[1] ?? '';
      // EV3 4300mm < X1 xDrive25e 4500mm < Sportage HEV 4540mm.
      const ev3At = thead.indexOf('EV3');
      const x1At = thead.indexOf('X1 xDrive25e');
      const sportageAt = thead.indexOf('Sportage HEV');
      expect(ev3At).toBeGreaterThan(-1);
      expect(ev3At).toBeLessThan(x1At);
      expect(x1At).toBeLessThan(sportageAt);
    });
  });

  it('renders the corner header cell for screen readers only, with no visible label', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    expect(markup).toMatch(
      /<th scope="col" class="[^"]*featureHeader[^"]*"><span class="[^"]*visuallyHidden[^"]*">Característica<\/span><\/th>/,
    );
  });

  it('starts the photo view selector on "Lateral"', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    expect(markup).toMatch(/<select[^>]*name="photo-view"/);
    expect(markup).toMatch(
      /<option value="side" selected="">Lateral<\/option>/,
    );
  });

  it('renders the reference photo as a real img with a descriptive alt', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    expect(markup).toContain('alt="Giulietta, vista lateral"');
    expect(markup).not.toContain('loading=');
    expect(markup).not.toContain('decoding=');
  });

  it('shows a labelled placeholder, no <img>, for a candidate with no photo of the selected view', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    // Ninguno de los tres candidatos del fixture declara fotos.
    expect(markup).toContain('Lateral — sin foto');
  });

  it('renders the horizontally scrolling container as a focusable group', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    expect(markup).toContain('role="group"');
    expect(markup).toContain('tabindex="0"');
  });

  it('renders its own view title as the only heading (technical/0005, requisito 4.2)', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    const headings = markup.match(/<h1[^>]*>/g) ?? [];
    expect(headings).toHaveLength(1);
    expect(markup).toMatch(/<h1[^>]*>Ficha<\/h1>/);
    expect(markup).not.toContain('aria-label="Vista"');
  });

  // Regresión de la corrección del 2026-08-07 (heredada de FichaCompletaPage):
  // la miniatura salía en blanco en iOS Safari porque tomaba su altura del
  // `<button>` que la envuelve, con `height: 100%` contra una `aspect-ratio`
  // declarada en el botón.
  describe('the photo box does not take its height from the button', () => {
    it('declares the aspect ratio on the image itself, with no percentage height', () => {
      const photo = ruleBody(fichaCss, 'photo');
      expect(photo).toMatch(/aspect-ratio:\s*4\s*\/\s*3/);
      expect(photo).not.toMatch(/height:\s*100%/);
    });

    it('keeps the button as a neutral wrapper, with no aspect ratio of its own', () => {
      const button = ruleBody(fichaCss, 'photoButton');
      expect(button).toMatch(/appearance:\s*none/);
      expect(button).not.toMatch(/aspect-ratio/);
    });
  });

  it('renders the closed photo dialog with no figure until a photo is opened', () => {
    const markup = renderToStaticMarkup(
      <FichaPage cars={threeCarFixture} references={[referenceFixture()]} />,
    );
    expect(markup).toContain('<dialog');
    expect(markup).not.toContain('<figure');
  });
});
