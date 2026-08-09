import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FichaCompletaPage, TOTAL_FIELD_COUNT } from './FichaCompletaPage';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import type { Reference } from '../domain/reference';
import fichaCompletaCss from './FichaCompletaPage.module.css?raw';

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

  it('repeats every feature label inside its own cell, for mobile (product/0014, requisito 9.1)', () => {
    // Por debajo de 37rem la columna de rótulos desaparece (corrección
    // 2026-08-07); cada celda lleva el suyo, oculto por CSS en escritorio,
    // así que tiene que estar en el marcado sin depender del ancho.
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    const cellLabels = markup.match(/cellLabel[^"]*">Longitud</g) ?? [];
    // Una por cada columna: la fijada más los tres candidatos.
    expect(cellLabels).toHaveLength(4);
  });

  it('keeps the corner header cell for screen readers only, with no visible label', () => {
    // No aporta nada que la fila (`th scope="row"`) no diga ya (corrección
    // 2026-08-07 del requisito 8.3): se oculta visualmente, no se borra.
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toMatch(
      /<th scope="col" class="[^"]*featureHeader[^"]*"><span class="[^"]*visuallyHidden[^"]*">Característica<\/span><\/th>/,
    );
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
    // Un `<select>` nativo (corrección 2026-08-07), no un grupo de radios:
    // misma elección excluyente con menos superficie táctil en móvil.
    expect(markup).toMatch(/<select[^>]*name="photo-view"/);
    const selected = markup.match(/<option[^>]*selected=""/g) ?? [];
    expect(selected).toHaveLength(1);
    expect(markup).toMatch(
      /<option value="side" selected="">Lateral<\/option>/,
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
    // Ni `loading="lazy"` ni `decoding="async"` (product/0014, corrección de
    // 2026-08-07): con un único `photoView` activo a la vez hay como mucho
    // una docena de `<img>` en el DOM, así que ninguno de los dos compra
    // nada, y son los dos atributos que la miniatura —que salía en blanco en
    // iOS Safari— llevaba y la foto ampliada del diálogo —que siempre se vio
    // bien, con la misma URL— no.
    expect(markup).not.toContain('loading=');
    expect(markup).not.toContain('decoding=');
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

  it('renders its own view title as the only heading (technical/0005, requisito 4.2)', () => {
    // La navegación ya no vive aquí: la monta `AppShell`, una sola vez,
    // fuera de cada página.
    const markup = renderToStaticMarkup(
      <FichaCompletaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toMatch(/<h1[^>]*>Ficha completa<\/h1>/);
    expect(markup).not.toContain('aria-label="Vista"');
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

  // Regresión de la corrección del 2026-08-07: la miniatura salía en blanco en
  // iOS Safari porque tomaba su altura del `<button>` que la envuelve, con
  // `height: 100%` contra una `aspect-ratio` declarada en el botón. Un
  // `<button>` nativo maqueta su contenido en una caja anónima propia y ese
  // porcentaje puede resolverse a cero. Estas dos afirmaciones fijan la forma
  // que quita la dependencia; sin ellas el fallo vuelve sin que nada se ponga
  // rojo, porque no se puede reproducir sin un WebKit delante.
  describe('the photo box does not take its height from the button', () => {
    it('declares the aspect ratio on the image itself, with no percentage height', () => {
      const photo = ruleBody(fichaCompletaCss, 'photo');
      expect(photo).toMatch(/aspect-ratio:\s*4\s*\/\s*3/);
      expect(photo).not.toMatch(/height:\s*100%/);
    });

    it('keeps the button as a neutral wrapper, with no aspect ratio of its own', () => {
      const button = ruleBody(fichaCompletaCss, 'photoButton');
      expect(button).toMatch(/appearance:\s*none/);
      expect(button).not.toMatch(/aspect-ratio/);
    });
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
