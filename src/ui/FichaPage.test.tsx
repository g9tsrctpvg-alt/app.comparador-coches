import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  COMPLETE_FIELD_DEFS,
  FichaPage,
  PhotoCarousel,
  TOTAL_FIELD_COUNT,
} from './FichaPage';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import {
  defaultDecisionLog,
  setDecision,
  setDecisionFilter,
} from '../domain/decisions';
import { buildFicha, FICHA_FIELDS } from '../domain/ficha';
import type { Reference } from '../domain/reference';
import { DEFAULT_ASSUMPTIONS } from '../domain/scoring/assumptions';
import { DEFAULT_WEIGHTS } from '../domain/scoring/weights';
import { scoreCatalog } from '../domain/scoring/score';
import { formatNumber } from './format';
import fichaCss from './FichaPage.module.css?raw';

// La puntuación de `threeCarFixture` con los pesos por defecto: los treinta
// puntos de entrada de este fichero llaman a `FichaPage` con este mismo
// catálogo, así que se calcula una vez (product/0029, requisito 3).
const SCORED_FIXTURE = scoreCatalog(
  threeCarFixture,
  DEFAULT_WEIGHTS,
  DEFAULT_ASSUMPTIONS,
  47000,
);

// Sin decisiones registradas: el caso de siempre para los tests que no
// versan sobre product/0030.
const EMPTY_DECISIONS = defaultDecisionLog();

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
    generation: {
      launchYear: {
        value: 2010,
        sources: [
          { label: 'Fixture', value: 2010, estimated: false, current: true },
        ],
      },
      code: '940',
    },
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
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toContain('<table');
    expect(markup).toContain('<thead');
    expect(markup).toMatch(/<th scope="col"/);
    expect(markup).toMatch(/<th scope="row"/);
  });

  it('shows one header column per candidate plus the reference', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    for (const car of threeCarFixture) {
      expect(markup).toContain(car.name);
    }
    expect(markup).toContain('Giulietta');
    expect(markup).toContain('Referencia');
  });

  describe('field set (product/0018, requisito 4; product/0020, requisito 1)', () => {
    it('starts on "Esenciales": six rows, no block headers, in the fixed order', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const rowLabels = [
        ...markup.matchAll(/<th scope="row"[^>]*>([^<]+)<\/th>/g),
      ].map((m) => m[1]);
      expect(rowLabels).toEqual([
        'Longitud',
        'Anchura',
        'Altura libre al suelo',
        'Maletero',
        'Potencia',
        'Precio',
      ]);
      // Ninguna de las dos vistas estrena cabecera de bloque: ni la tabla ni
      // la tarjeta de duelo. Se comprueba por su clase, y los rótulos solo
      // dentro de la tabla, porque desde product/0027 esos mismos seis
      // nombres rotulan los `<optgroup>` del selector de orden, que existe
      // con cualquier conjunto de campos.
      expect(markup).not.toContain('blockHeader');
      expect(markup).not.toContain('duelBlockHeader');
      const table = /<table[\s\S]*?<\/table>/.exec(markup)?.[0] ?? '';
      expect(table).not.toBe('');
      for (const label of [
        'Generación',
        'Tamaño y espacio',
        'Mecánica y prestaciones',
        'Coste',
        'Fiabilidad y respaldo',
        'Juicio propio',
      ]) {
        expect(table).not.toContain(label);
      }
    });

    it('offers "Esenciales" and "Completa" as the only two options, Esenciales selected', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      expect(markup).toMatch(/<select[^>]*id="field-set-select"/);
      expect(markup).toMatch(
        /<option value="esenciales" selected="">Esenciales<\/option>/,
      );
      expect(markup).toContain('<option value="completa">Completa</option>');
    });

    it('declares TOTAL_FIELD_COUNT as the twenty-six magnitudes of "Completa"', () => {
      expect(TOTAL_FIELD_COUNT).toBe(26);
    });

    it("matches FICHA_FIELDS exactly: no domain field silently missing from Completa's render", () => {
      // `TOTAL_FIELD_COUNT` por sí solo es tautológico —sale de la misma
      // lista que cuenta—: esto comprueba el conjunto real de claves contra
      // la fuente del dominio. Un campo nuevo en `FICHA_FIELDS` sin su
      // `FieldDef` en `COMPLETE_BLOCKS` haría fallar esto sin necesitar
      // cambiar `fieldSet` a «Completa» a mano.
      expect(new Set(COMPLETE_FIELD_DEFS.keys())).toEqual(
        new Set(FICHA_FIELDS),
      );
    });
  });

  describe('comparison (product/0018, requisito 2)', () => {
    it('pins the reference by default, as a single-choice radio group', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      expect(markup).toMatch(/name="pinned-model"/);
      const pinInputs =
        markup.match(/<input[^>]*name="pinned-model"[^>]*\/>/g) ?? [];
      expect(pinInputs.length).toBeGreaterThan(0);
      expect(pinInputs.every((tag) => tag.includes('type="radio"'))).toBe(true);
      expect(markup).toMatch(
        /aria-label="Comparar contra Giulietta"[^>]*checked=""/,
      );
      // «Ninguno» no está elegido cuando hay una comparación activa. Desde
      // `technical/0010` esa opción vive en el `<select>` de la barra, no en
      // un radio suelto: lo que se comprueba es lo mismo, sobre el control
      // que la ofrece hoy.
      expect(markup).toMatch(/<option value=""(?![^>]*selected)>Ninguno</);
      // Y el modelo fijado sí lo está, en ese mismo `<select>`: es la mitad
      // que demuestra que los dos controles miran el mismo estado.
      expect(markup).toMatch(
        /<option value="alfa-romeo-giulietta"[^>]*selected=""/,
      );
    });

    it('does not repeat the pinned model among the scrollable columns', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
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

    it('shows the signed delta of each candidate against the pinned reference', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      // Sportage: 4540mm frente a 4351mm de la Giulietta → +189.
      expect(markup).toMatch(/cellDelta[^"]*">\+189\s*mm</);
    });

    it('shows an accessible dash, not a blank cell, when the pinned reference lacks the field (requisito 2.5)', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      // La Giulietta (fixture) solo declara las cinco magnitudes
      // dimensionales: Potencia y Precio, en «Esenciales», no tienen con
      // qué compararse.
      const dashMatches =
        markup.match(
          /<span class="[^"]*cellDelta[^"]*"><span class="[^"]*visuallyHidden[^"]*">Sin diferencia que mostrar\.<\/span><span aria-hidden="true">—<\/span><\/span>/g,
        ) ?? [];
      expect(dashMatches.length).toBeGreaterThan(0);
    });

    it('leaves the pinned column without any delta: it is not compared to itself', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const theadMatch = /<thead>([\s\S]*?)<\/thead>/.exec(markup);
      const thead = theadMatch?.[1] ?? '';
      expect(thead).not.toContain('cellDelta');
    });

    it('defaults to "Ninguno" — no pinned column, no delta anywhere — when there is no reference', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      expect(markup).toContain('<table');
      expect(markup).not.toContain('Referencia');
      expect(markup).not.toContain('pinnedHeader');
      expect(markup).not.toContain('cellDelta');
      // Sin referencia, el `<select>` de comparación arranca en «Ninguno»
      // (technical/0010: la opción se mudó del radio suelto a este control).
      expect(markup).toMatch(/<option value="" selected="">Ninguno</);
      // Sin columna fijada no hay hueco de sticky que reservar en el
      // anclaje de scroll: `scroll-padding-left` no debe apuntar a una
      // columna que no está en la tabla.
      expect(markup).toMatch(/class="[^"]*tableWrapperNoPin[^"]*"/);
    });

    it('does not reserve sticky-column scroll padding while a model is pinned', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      expect(markup).not.toMatch(/class="[^"]*tableWrapperNoPin[^"]*"/);
    });
  });

  describe('order (product/0018, requisito 5)', () => {
    it('offers the catalogue order plus every field of "Completa", grouped by block, starting on length (product/0027)', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const select =
        /<select[^>]*id="sort-select"[\s\S]*?<\/select>/.exec(markup)?.[0] ??
        '';
      expect(select).not.toBe('');
      expect(select).toMatch(
        /<option value="lengthMm" selected="">Longitud<\/option>/,
      );
      // «Catálogo» más una opción por magnitud de «Completa», ni una más.
      expect([...select.matchAll(/<option /g)]).toHaveLength(
        1 + TOTAL_FIELD_COUNT,
      );
      // Cada magnitud, bajo la cabecera de su bloque y en el orden de la
      // tabla (requisito 3).
      expect(
        [...select.matchAll(/<optgroup label="([^"]*)"/g)].map((m) => m[1]),
      ).toEqual([
        'Generación',
        'Tamaño y espacio',
        'Mecánica y prestaciones',
        'Coste',
        'Fiabilidad y respaldo',
        'Juicio propio',
      ]);
      // Rótulos idénticos a los de la fila de esa magnitud (requisito 2),
      // incluidas las que antes no eran ordenables.
      for (const label of [
        'Catálogo',
        'Anchura',
        'Precio',
        'Potencia',
        'Anchura de hombros atrás',
        'Valor residual a 5 años',
        'Estética interior',
      ]) {
        expect(select).toContain(`>${label}<`);
      }
    });

    it('keeps every sort option available while the essential field set is showing (product/0027, requisito 9)', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const select =
        /<select[^>]*id="sort-select"[\s\S]*?<\/select>/.exec(markup)?.[0] ??
        '';
      const body = /<tbody>[\s\S]*?<\/tbody>/.exec(markup)?.[0] ?? '';
      // Arranca en «Esenciales», que no enseña la fiabilidad: la tabla no
      // tiene esa fila y el selector de orden sí tiene esa opción. Mostrar y
      // ordenar son controles independientes.
      expect(body).not.toContain('Fiabilidad OCU');
      expect(select).toContain('<option value="reliabilityOcu">');
    });

    it('sorts the scrollable columns ascending by length by default', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
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
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toMatch(
      /<th scope="col" class="[^"]*featureHeader[^"]*"><span class="[^"]*visuallyHidden[^"]*">Característica<\/span><\/th>/,
    );
  });

  it('starts the photo view selector on "Lateral"', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toMatch(/<select[^>]*name="photo-view"/);
    expect(markup).toMatch(
      /<option value="side" selected="">Lateral<\/option>/,
    );
  });

  it('renders the reference photo as a real img with a descriptive alt', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toContain('alt="Giulietta, vista lateral"');
    expect(markup).not.toContain('loading=');
    expect(markup).not.toContain('decoding=');
  });

  it('shows a labelled placeholder, no <img>, for a candidate with no photo of the selected view', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    // Ninguno de los tres candidatos del fixture declara fotos.
    expect(markup).toContain('Lateral — sin foto');
  });

  it('renders the horizontally scrolling container as a focusable group', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toContain('role="group"');
    expect(markup).toContain('tabindex="0"');
  });

  it('renders its own view title as the only heading (technical/0005, requisito 4.2)', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
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
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toContain('<dialog');
    expect(markup).not.toContain('<figure');
  });

  // El color de la Δ es refuerzo, nunca la única vía de leerla (el propio
  // párrafo lo dice): un campo con dirección declarada en POLARITY que no
  // aparezca aquí deja esa afirmación en falso para ese campo. Regresión
  // concreta: rearShoulderWidthMm, residualPct5y y warrantyExtensionYears
  // llegaron a POLARITY sin llegar nunca a este párrafo.
  it('names every field the color reinforces as "más es mejor" in the legend', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    const legendMatch = /<p class="[^"]*legend[^"]*">([\s\S]*?)<\/p>/.exec(
      markup,
    );
    const legend = legendMatch?.[1] ?? '';
    for (const label of [
      'maletero',
      'litros por m²',
      'potencia',
      'fiabilidad',
      'garantía',
      'extensión de garantía',
      'valor residual a 5 años',
      'anchura de hombros atrás',
      'estética',
    ]) {
      expect(legend.toLowerCase()).toContain(label);
    }
  });

  describe('the mobile duel view (product/0023)', () => {
    // Las dos vistas se generan siempre en el marcado (requisito 2): la
    // media query de `FichaPage.module.css` decide cuál se ve, no React.
    // Así que se puede comprobar el contenido de la vista de duelo con
    // `renderToStaticMarkup`, exactamente igual que la tabla.
    function duelHtml(markup: string): string {
      const match =
        /<div class="[^"]*duelView[^"]*">([\s\S]*?)(?=<div class="[^"]*tableWrapper)/.exec(
          markup,
        );
      return match?.[1] ?? '';
    }

    it('lists the same candidates as the scrollable table columns, in the same order, never the reference', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const duel = duelHtml(markup);
      const chips =
        duel.match(/<button type="button" class="[^"]*duelChip/g) ?? [];
      expect(chips).toHaveLength(3);
      // EV3 4300mm < X1 xDrive25e 4500mm < Sportage HEV 4540mm — el mismo
      // orden que ya comprueba la tabla por defecto.
      const ev3At = duel.indexOf('EV3');
      const x1At = duel.indexOf('X1 xDrive25e');
      const sportageAt = duel.indexOf('Sportage HEV');
      expect(ev3At).toBeGreaterThan(-1);
      expect(ev3At).toBeLessThan(x1At);
      expect(x1At).toBeLessThan(sportageAt);
      // La propia referencia nunca es un candidato de la tira.
      const stripMatch =
        /<div class="[^"]*duelStrip[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="[^"]*duelCard/.exec(
          duel,
        );
      expect(stripMatch?.[1] ?? '').not.toContain('Giulietta');
    });

    it('focuses the first candidate of the strip by default, and only that one', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const duel = duelHtml(markup);
      const currentMatches = duel.match(/aria-current="true"/g) ?? [];
      expect(currentMatches).toHaveLength(1);
      // El primer botón de la tira es el de EV3, y es el único con
      // `aria-current`.
      const firstChipEnd = duel.indexOf('</button>');
      expect(duel.slice(0, firstChipEnd)).toContain('aria-current="true"');
      expect(duel.slice(0, firstChipEnd)).toContain('EV3');
      // Y la tarjeta de debajo es la suya.
      expect(duel).toMatch(/duelCardName[^>]*>EV3</);
    });

    it("shows the focused candidate's value, its signed delta against the reference, and the reference's own value", () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const duel = duelHtml(markup);
      // EV3: 4300mm frente a 4351mm de la Giulietta → −51 (mejor, longitud
      // en dirección «más es peor»).
      expect(duel).toMatch(/duelRowValue[^>]*>4300\s*mm</);
      expect(duel).toMatch(/duelRowDelta[^"]*deltaBetter[^"]*">−51\s*mm</);
      expect(duel).toMatch(/duelRowReference[^"]*">Giulietta 4351\s*mm</);
    });

    it('shows the accessible dash, not the reference line, when the reference lacks the field', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const duel = duelHtml(markup);
      // La Giulietta (fixture) no declara potencia: la fila de Potencia del
      // candidato enfocado no puede compararse, y no repite un valor de
      // referencia que no existe.
      const powerRowMatch =
        /<div class="[^"]*duelRow[^"]*">([\s\S]*?)<\/div>\s*<div class="[^"]*duelRow/.exec(
          duel.slice(duel.indexOf('Potencia') - 200),
        );
      const powerRow = powerRowMatch?.[0] ?? duel;
      expect(powerRow).toContain('Sin diferencia que mostrar.');
      expect(powerRow).not.toContain('duelRowReference');
    });

    it('shows no delta and no reference line anywhere when there is no comparison active', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const duel = duelHtml(markup);
      expect(duel).not.toContain('duelRowDelta');
      expect(duel).not.toContain('duelRowReference');
      // Sin referencia, la propia Giulietta no existe como entidad: la tira
      // solo tiene los tres candidatos.
      const chips =
        duel.match(/<button type="button" class="[^"]*duelChip/g) ?? [];
      expect(chips).toHaveLength(3);
    });

    it('every candidate chip has an accessible name equal to the model name', () => {
      const markup = renderToStaticMarkup(
        <FichaPage
          cars={threeCarFixture}
          references={[referenceFixture()]}
          scoredCars={SCORED_FIXTURE}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
        />,
      );
      const duel = duelHtml(markup);
      const stripMatch =
        /<div class="[^"]*duelStrip[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div class="[^"]*duelCard/.exec(
          duel,
        );
      const strip = stripMatch?.[1] ?? '';
      for (const name of ['EV3', 'X1 xDrive25e', 'Sportage HEV']) {
        expect(strip).toMatch(new RegExp(`duelChipName[^"]*">${name}<`));
      }
      // La miniatura es decorativa: el nombre real ya va al lado como texto.
      expect(strip).toMatch(/aria-hidden="true"/);
    });
  });
});

/**
 * El carrusel de la foto ampliada (product/0025). Se renderiza aparte porque
 * el diálogo que lo contiene se abre con `showModal()`, y
 * `renderToStaticMarkup` no lo ejecuta: lo interactivo —teclado, clic,
 * `src` que falla— se verifica a mano y con Playwright, igual que el resto
 * de `src/ui/`.
 */
describe('the enlarged photo carousel', () => {
  const photo = (shows: string) => ({
    url: `https://example.com/${shows}.jpg`,
    credit: `Crédito de ${shows}`,
    shows,
  });

  /** Las claves llegan desordenadas a propósito: es el orden que trae
   * `honda-civic-e-hev` en el catálogo real. */
  function fourViewEntity() {
    const entity = buildFicha(
      [],
      [
        referenceFixture({
          photos: {
            front: photo('frontal'),
            rear: photo('trasera'),
            side: photo('lateral'),
            interior: photo('interior'),
          },
        }),
      ],
    )[0];
    if (entity === undefined) throw new Error('Sin entidad de prueba');
    return entity;
  }

  it('lists the declared views in the canonical order, not the data file order', () => {
    const markup = renderToStaticMarkup(
      <PhotoCarousel
        entity={fourViewEntity()}
        view="side"
        onSelectView={() => {}}
      />,
    );
    const order = ['Frontal', 'Lateral', 'Trasera', 'Interior'].map((label) =>
      markup.indexOf(`>${label}<`),
    );
    expect(order.every((at) => at > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(markup).not.toContain('>Maletero<');
  });

  it('marks the shown view, and only it, with aria-current', () => {
    const markup = renderToStaticMarkup(
      <PhotoCarousel
        entity={fourViewEntity()}
        view="side"
        onSelectView={() => {}}
      />,
    );
    expect(markup.match(/aria-current="true"/g)).toHaveLength(1);
    expect(markup).toMatch(/aria-current="true"[^>]*>Lateral</);
  });

  it('writes the position in the sequence as text', () => {
    const markup = renderToStaticMarkup(
      <PhotoCarousel
        entity={fourViewEntity()}
        view="side"
        onSelectView={() => {}}
      />,
    );
    expect(markup).toContain('2 de 4 · Lateral');
  });

  it('disables the previous control on the first view and the next one on the last', () => {
    const first = renderToStaticMarkup(
      <PhotoCarousel
        entity={fourViewEntity()}
        view="front"
        onSelectView={() => {}}
      />,
    );
    expect(first).toMatch(/aria-label="Ver la foto anterior" disabled=""/);
    expect(first).not.toMatch(/aria-label="Ver la foto siguiente" disabled=""/);

    const last = renderToStaticMarkup(
      <PhotoCarousel
        entity={fourViewEntity()}
        view="interior"
        onSelectView={() => {}}
      />,
    );
    expect(last).toMatch(/aria-label="Ver la foto siguiente" disabled=""/);
    expect(last).not.toMatch(/aria-label="Ver la foto anterior" disabled=""/);

    const middle = renderToStaticMarkup(
      <PhotoCarousel
        entity={fourViewEntity()}
        view="rear"
        onSelectView={() => {}}
      />,
    );
    expect(middle).not.toContain('disabled=""');
  });

  it('lets the caption and the alt text follow the shown view', () => {
    const markup = renderToStaticMarkup(
      <PhotoCarousel
        entity={fourViewEntity()}
        view="rear"
        onSelectView={() => {}}
      />,
    );
    expect(markup).toContain('alt="Giulietta, vista trasera"');
    expect(markup).toContain('trasera — Crédito de trasera');
    expect(markup).not.toContain('Crédito de lateral');
  });

  // Regresión medida en el navegador, no supuesta: mientras estos dos
  // rótulos compusieron `.unstyledButton`, su `background: none` y su
  // `border: none` ganaban a las declaraciones de este fichero —entre
  // ficheros manda el primitivo (hallazgo de `technical/0006`)— y el rótulo
  // elegido salía sin fondo, sin borde y del mismo color que los demás.
  it('declares its own box for the view labels, composing no button primitive', () => {
    const base = ruleBody(fichaCss, 'dialogView,\\s*\\.dialogViewActive');
    expect(base).not.toMatch(/composes:[^;]*unstyledButton/);
    expect(base).not.toMatch(/composes:[^;]*button(Ghost|Outline|Solid)/);
    expect(base).toMatch(/background:\s*var\(--color-card\)/);
    // La última de las dos reglas que empiezan por `.dialogViewActive`: la
    // primera es la base compartida con `.dialogView`, y es justo el orden
    // dentro del fichero lo que hace que la elegida gane.
    const active = [
      ...fichaCss.matchAll(/^\.dialogViewActive\s*\{([^}]*)\}/gm),
    ].at(-1)?.[1];
    expect(active).toMatch(/border-color:\s*var\(--color-accent\)/);
    expect(active).toMatch(/background:\s*var\(--color-accent-tint\)/);
  });

  it('renders no navigation at all for a model with a single declared view', () => {
    const entity = buildFicha([], [referenceFixture()])[0];
    if (entity === undefined) throw new Error('Sin entidad de prueba');
    const markup = renderToStaticMarkup(
      <PhotoCarousel entity={entity} view="side" onSelectView={() => {}} />,
    );
    expect(markup).toContain('alt="Giulietta, vista lateral"');
    expect(markup).not.toContain('aria-label="Ver la foto siguiente"');
    expect(markup).not.toContain('aria-label="Ver la foto anterior"');
    expect(markup).not.toContain('aria-current');
    expect(markup).not.toContain(' de 1');
  });
});

describe('magnitudes de electrificación (product/0028)', () => {
  it('puts the two new rows right after consumption, in that order (requisito 3.1)', () => {
    const keys = [...COMPLETE_FIELD_DEFS.keys()];
    const consumption = keys.indexOf('consumption');
    expect(consumption).toBeGreaterThan(-1);
    expect(keys.slice(consumption, consumption + 3)).toEqual([
      'consumption',
      'electricRangeKm',
      'batteryKwh',
    ]);
  });

  it('labels them as the ficha does, with their units', () => {
    expect(COMPLETE_FIELD_DEFS.get('electricRangeKm')).toMatchObject({
      label: 'Autonomía eléctrica',
      unitFallback: 'km',
    });
    expect(COMPLETE_FIELD_DEFS.get('batteryKwh')).toMatchObject({
      label: 'Batería',
      unitFallback: 'kWh',
    });
  });

  it('shows the battery with two decimals, so 0,77 and 0,85 kWh do not collapse (requisito 3.5)', () => {
    // Con un solo decimal las dos se leerían «0,8» y la comparación entre
    // híbridos —la razón de que esta magnitud exista— quedaría anulada por
    // el formato.
    const decimals = COMPLETE_FIELD_DEFS.get('batteryKwh')?.decimals;
    expect(formatNumber(0.77, decimals)).toBe('0,77');
    expect(formatNumber(0.85, decimals)).toBe('0,85');
    expect(formatNumber(1.49, decimals)).toBe('1,49');
  });

  it('shows the range in whole kilometres', () => {
    const decimals = COMPLETE_FIELD_DEFS.get('electricRangeKm')?.decimals ?? 0;
    expect(formatNumber(436, decimals)).toBe('436');
  });

  it('offers both under "Mecánica y prestaciones" in the sort selector', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    const select =
      /<select[^>]*id="sort-select"[\s\S]*?<\/select>/.exec(markup)?.[0] ?? '';
    const mecanica =
      /<optgroup label="Mecánica y prestaciones">[\s\S]*?<\/optgroup>/.exec(
        select,
      )?.[0] ?? '';
    expect(mecanica).toContain(
      '<option value="electricRangeKm">Autonomía eléctrica</option>',
    );
    expect(mecanica).toContain('<option value="batteryKwh">Batería</option>');
  });
});

describe('decision status in the ficha (product/0030)', () => {
  function decisionLogWith(carId: string) {
    return setDecision(
      defaultDecisionLog(),
      carId,
      'shortlist',
      undefined,
      '2026-08-30',
    );
  }

  it('shows no decision control for an undecided candidate, nor for the reference (requisitos 5.3, 6.2)', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).not.toContain('decisionButton');
  });

  it('shows the decision control, with its mark, for a candidate that has one', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={decisionLogWith('kia-ev3')}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toContain('decisionButton');
    expect(markup).toContain('markShortlist');
  });

  // El `<select>` «Comparar» sigue enseñando los quince candidatos sin
  // filtrar a propósito (dependencias y supuestos, requisito 4.4): elegir
  // comparación no debe verse limitado por la lista corta. Así que estos
  // dos tests miran solo la tabla, no el marcado entero.
  function tableMarkup(markup: string): string {
    return /<table[\s\S]*?<\/table>/.exec(markup)?.[0] ?? '';
  }

  it('drops a candidate that fails the decision filter from the scrollable columns (requisito 4.3)', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={setDecisionFilter(defaultDecisionLog(), 'shortlist-only')}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    const table = tableMarkup(markup);
    for (const car of threeCarFixture) {
      expect(table).not.toContain(car.name);
    }
  });

  it('keeps a shortlisted candidate under "shortlist-only", drops the other two', () => {
    const sportage = threeCarFixture.find(
      (car) => car.id === 'kia-sportage-hev',
    )!;
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={setDecisionFilter(
          decisionLogWith('kia-sportage-hev'),
          'shortlist-only',
        )}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    const table = tableMarkup(markup);
    expect(table).toContain(sportage.name);
    for (const car of threeCarFixture) {
      if (car.id === 'kia-sportage-hev') continue;
      expect(table).not.toContain(car.name);
    }
  });

  it('never drops the reference — a decision filter never touches something that is not a candidate', () => {
    // Sin ningún candidato en lista corta: los tres desaparecen de las
    // columnas desplazables, pero la referencia sigue siendo la comparación
    // fijada por defecto (requisito 4.4, extendido aquí a 4.3: el filtro no
    // alcanza a lo que no es un candidato).
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={setDecisionFilter(defaultDecisionLog(), 'shortlist-only')}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toContain('Giulietta');
    expect(markup).toContain('Referencia');
  });
});

describe('the eligibility mark (product/0031)', () => {
  it('shows no mark for any candidate when there are no rules and everyone is within budget', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        eliminatoryRules={[]}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).not.toContain('No cumple');
  });

  it('marks a candidate that fails a rule, naming what it fails', () => {
    // El Sportage (500 L de maletero, fixture) incumple un mínimo de 600 L.
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        eliminatoryRules={[
          { field: 'trunkLiters', operator: 'min', value: 600 },
        ]}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(markup).toContain('No cumple 1 imprescindible');
  });

  it('never marks the reference, even when every candidate fails the rule', () => {
    const markup = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        eliminatoryRules={[
          { field: 'trunkLiters', operator: 'min', value: 100000 },
        ]}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    // La referencia es la comparación fijada por defecto (sin otra
    // referencia declarada, `defaultComparisonId` cae en la única que hay):
    // esta prueba cubre a la vez «nunca en la referencia» y «nunca en el
    // modelo fijado como comparación», que aquí son la misma columna.
    const referenceHeader = /<th[^>]*pinnedHeader[^>]*>[\s\S]*?<\/th>/.exec(
      markup,
    )?.[0];
    expect(referenceHeader).toContain('Giulietta');
    expect(referenceHeader).not.toContain('No cumple');
  });

  it('defaults to no rules when the prop is omitted, same markup as an explicit empty array', () => {
    const withProp = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        eliminatoryRules={[]}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    const withoutProp = renderToStaticMarkup(
      <FichaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
        scoredCars={SCORED_FIXTURE}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
      />,
    );
    expect(withoutProp).toBe(withProp);
  });
});
