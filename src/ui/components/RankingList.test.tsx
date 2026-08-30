import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RankingList, editableRatingsOf } from './RankingList';
import { defaultDecisionLog, setDecisionFilter } from '../../domain/decisions';
import { scoreCatalog } from '../../domain/scoring/score';
import { DEFAULT_WEIGHTS } from '../../domain/scoring/weights';
import { DEFAULT_ASSUMPTIONS } from '../../domain/scoring/assumptions';
import { threeCarFixture } from '../../domain/scoring/testFixtures';
import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';
import { loadCatalog } from '../../data/loadCatalog';
import { publishedCars } from '../../domain/car';
import rowStyles from './RankingRow.module.css';

const EMPTY_DECISIONS = defaultDecisionLog();

function scored(): CarScoreBreakdown[] {
  return scoreCatalog(
    threeCarFixture,
    DEFAULT_WEIGHTS,
    DEFAULT_ASSUMPTIONS,
    47000,
  );
}

/** Reescribe todas las etiquetas de subcomponente, dejando intactas las
 * claves `editableRating`. Simula una edición puramente cosmética en los
 * ejes del dominio. */
function withRewrittenLabels(cars: CarScoreBreakdown[]): CarScoreBreakdown[] {
  return cars.map((car) => ({
    ...car,
    axes: car.axes.map((axis) => ({
      ...axis,
      subcomponents: axis.subcomponents?.map((sub) => ({
        ...sub,
        label: 'Texto completamente distinto',
      })),
    })),
  }));
}

function renderExpanded(cars: CarScoreBreakdown[]): string {
  // `renderToStaticMarkup` no despliega la fila por sí solo, así que se
  // comprueba el conjunto renderizable; lo que importa aquí es que ninguna
  // de las dos variantes lance al construirse.
  return renderToStaticMarkup(
    <RankingList
      cars={cars}
      rawCars={threeCarFixture}
      weights={DEFAULT_WEIGHTS}
      decisionLog={EMPTY_DECISIONS}
      onSetDecision={() => undefined}
      onClearDecision={() => undefined}
      onDecisionFilterChange={() => undefined}
      eliminatoryRules={[]}
      hideFailingRules={false}
      onClearRules={() => undefined}
      onRatingChange={() => undefined}
    />,
  );
}

describe('RankingList', () => {
  it('renders the ranking ordered by total, best first', () => {
    const markup = renderExpanded(scored());
    const cars = [...scored()].sort((a, b) => b.total - a.total);
    const firstName = cars[0]!.carName;
    const lastName = cars[cars.length - 1]!.carName;
    expect(markup.indexOf(firstName)).toBeLessThan(markup.indexOf(lastName));
  });

  it('survives a purely cosmetic rewrite of every domain subcomponent label', () => {
    // Este es el fallo que motivó la spec: la interfaz buscaba los controles
    // por el texto de la etiqueta, así que reescribirla los rompía en
    // ejecución sin que typecheck, lint ni arch:check dijeran nada.
    expect(() => renderExpanded(withRewrittenLabels(scored()))).not.toThrow();
  });

  it('shows a readable technology label, never the raw code (product/0008)', () => {
    // threeCarFixture cubre HEV (Sportage), PHEV (X1) y EV (EV3). El propio
    // nombre del coche «EV3» y del catálogo real «Civic e:HEV» contienen las
    // siglas como texto legítimo, así que la comprobación mira solo el hueco
    // de tecnología —`<span>…</span>` inmediatamente tras el botón—, no el
    // marcado entero.
    const markup = renderExpanded(scored());
    expect(markup).toContain('<span>Híbrido</span>');
    expect(markup).toContain('<span>Híbrido enchufable</span>');
    expect(markup).toContain('<span>Eléctrico</span>');
    for (const code of ['EV', 'PHEV', 'MHEV', 'HEV', 'ICE']) {
      expect(markup).not.toContain(`<span>${code}</span>`);
    }
  });

  it('hides the ineligible tramo entirely when hideFailingRules is on', () => {
    const cars = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      40000,
    );
    const overBudget = cars.filter((car) => car.overBudget);
    expect(overBudget.length).toBeGreaterThan(0);

    const markup = renderToStaticMarkup(
      <RankingList
        cars={cars}
        rawCars={threeCarFixture}
        weights={DEFAULT_WEIGHTS}
        decisionLog={EMPTY_DECISIONS}
        onSetDecision={() => undefined}
        onClearDecision={() => undefined}
        onDecisionFilterChange={() => undefined}
        eliminatoryRules={[]}
        hideFailingRules
        onClearRules={() => undefined}
        onRatingChange={() => undefined}
      />,
    );
    for (const car of overBudget) {
      expect(markup).not.toContain(car.carName);
    }
  });

  it('with hideFailingRules off, the car over budget still appears, inside the collapsed ineligible tramo', () => {
    const cars = scoreCatalog(
      threeCarFixture,
      DEFAULT_WEIGHTS,
      DEFAULT_ASSUMPTIONS,
      40000,
    );
    const overBudget = cars.filter((car) => car.overBudget);
    expect(overBudget.length).toBeGreaterThan(0);

    const markup = renderExpanded(cars);
    for (const car of overBudget) {
      expect(markup).toContain(car.carName);
    }
    expect(markup).toContain('No cumplen tus imprescindibles');
    expect(markup).toContain('Fuera de presupuesto');
  });

  describe('the decision filter, empty (product/0030, requisito 4.6)', () => {
    it('renders a message naming the active filter, not an empty list, when it hides everything', () => {
      const cars = scored();
      const log = setDecisionFilter(defaultDecisionLog(), 'shortlist-only');
      const markup = renderToStaticMarkup(
        <RankingList
          cars={cars}
          rawCars={threeCarFixture}
          weights={DEFAULT_WEIGHTS}
          decisionLog={log}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
          onDecisionFilterChange={() => undefined}
          eliminatoryRules={[]}
          hideFailingRules={false}
          onClearRules={() => undefined}
          onRatingChange={() => undefined}
        />,
      );
      expect(markup).toContain('Solo lista corta');
      expect(markup).not.toContain('<ol');
      expect(markup).toContain('Volver a Todos');
    });

    it('does not show the decision-filter message just because the budget alone empties the eligible tramo', () => {
      // Con `filter: 'all'`, una lista vacía por presupuesto no es el caso
      // que este requisito cubre — es el de abajo (product/0031, requisito
      // 4.4).
      const tinyBudgetCars = scoreCatalog(
        threeCarFixture,
        DEFAULT_WEIGHTS,
        DEFAULT_ASSUMPTIONS,
        1,
      );
      const markup = renderExpanded(tinyBudgetCars);
      expect(markup).not.toContain('Volver a Todos');
    });
  });

  describe('the eligible tramo, empty (product/0031, requisito 4.4)', () => {
    it('renders a message when the budget alone empties it, without a clear-rules button', () => {
      // Sustituye el límite conocido que documentaba `docs/estado/interfaz.md`:
      // una lista vacía por presupuesto con el filtro de decisión en «Todos»
      // no se distinguía de nada.
      const tinyBudgetCars = scoreCatalog(
        threeCarFixture,
        DEFAULT_WEIGHTS,
        DEFAULT_ASSUMPTIONS,
        1,
      );
      const markup = renderExpanded(tinyBudgetCars);
      expect(markup).toContain('Ningún coche cumple tus imprescindibles');
      // Sin reglas que quitar, no hay botón: solo el presupuesto vacía la
      // lista, y este botón no lo toca.
      expect(markup).not.toContain('Quitar imprescindibles');
    });

    it('renders the clear-rules button when a rule empties it', () => {
      const cars = scored();
      const markup = renderToStaticMarkup(
        <RankingList
          cars={cars}
          rawCars={threeCarFixture}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
          onDecisionFilterChange={() => undefined}
          eliminatoryRules={[
            { field: 'lengthMm', operator: 'max', value: 100 },
          ]}
          hideFailingRules={false}
          onClearRules={() => undefined}
          onRatingChange={() => undefined}
        />,
      );
      expect(markup).toContain('Ningún coche cumple tus imprescindibles');
      expect(markup).toContain('Quitar imprescindibles');
      expect(markup).not.toContain('<ol aria-label="Ranking"');
    });

    it('still shows the collapsed ineligible tramo below the empty message, unless hidden', () => {
      const cars = scored();
      const markup = renderToStaticMarkup(
        <RankingList
          cars={cars}
          rawCars={threeCarFixture}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
          onDecisionFilterChange={() => undefined}
          eliminatoryRules={[
            { field: 'lengthMm', operator: 'max', value: 100 },
          ]}
          hideFailingRules={false}
          onClearRules={() => undefined}
          onRatingChange={() => undefined}
        />,
      );
      expect(markup).toContain('No cumplen tus imprescindibles');
    });
  });

  describe('the podium (product/0022)', () => {
    function rowClassMarker(variant: 'podiumCard' | 'row' | 'rowLeader') {
      return `class="${rowStyles[variant]}"`;
    }

    /** Comprueba que, dentro de la ventana de marcado que sigue al nombre
     * del coche, los `tokens` aparecen en ese orden — sin asumir en qué
     * parte de la lista cae la fila. */
    function expectOrderedInRow(
      markup: string,
      carName: string,
      tokens: string[],
    ) {
      const start = markup.indexOf(carName);
      expect(start).toBeGreaterThan(-1);
      const window = markup.slice(start, start + 600);
      let last = -1;
      for (const token of tokens) {
        const index = window.indexOf(token);
        expect(index).toBeGreaterThan(last);
        last = index;
      }
    }

    it('renders exactly the top three as podium cards and the rest as list rows, with the real catalog', () => {
      const realCars = publishedCars(loadCatalog());
      const realScored = scoreCatalog(
        realCars,
        DEFAULT_WEIGHTS,
        DEFAULT_ASSUMPTIONS,
        47000,
      );
      const markup = renderToStaticMarkup(
        <RankingList
          cars={realScored}
          rawCars={realCars}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
          onDecisionFilterChange={() => undefined}
          eliminatoryRules={[]}
          hideFailingRules={false}
          onClearRules={() => undefined}
          onRatingChange={() => undefined}
        />,
      );
      const podiumCount = markup.split(rowClassMarker('podiumCard')).length - 1;
      expect(podiumCount).toBe(3);
      const restCount =
        markup.split(rowClassMarker('row')).length -
        1 +
        (markup.split(rowClassMarker('rowLeader')).length - 1);
      // Con el presupuesto por defecto, dos coches del catálogo real quedan
      // fuera de presupuesto (product/0031) y caen al tramo no elegible, que
      // no lleva las clases de `RankingRow` que cuenta este test.
      const eligibleCount = realScored.filter((car) => !car.overBudget).length;
      expect(restCount).toBe(eligibleCount - 3);
    });

    it('with three or fewer visible cars, renders only the podium — no empty "rest"', () => {
      // `threeCarFixture` tiene exactamente tres coches: los tres son podio,
      // y no debe quedar ni una fila del otro tratamiento.
      const markup = renderExpanded(scored());
      expect(markup.split(rowClassMarker('podiumCard')).length - 1).toBe(3);
      expect(markup).not.toContain(rowClassMarker('row'));
      expect(markup).not.toContain(rowClassMarker('rowLeader'));
    });

    it('the supporting line shows engine, acceleration, trunk and price, in that order, never power — on the podium and on the rest', () => {
      const realCars = publishedCars(loadCatalog());
      const realScored = scoreCatalog(
        realCars,
        DEFAULT_WEIGHTS,
        DEFAULT_ASSUMPTIONS,
        47000,
      );
      const markup = renderToStaticMarkup(
        <RankingList
          cars={realScored}
          rawCars={realCars}
          weights={DEFAULT_WEIGHTS}
          decisionLog={EMPTY_DECISIONS}
          onSetDecision={() => undefined}
          onClearDecision={() => undefined}
          onDecisionFilterChange={() => undefined}
          eliminatoryRules={[]}
          hideFailingRules={false}
          onClearRules={() => undefined}
          onRatingChange={() => undefined}
        />,
      );
      // Tucson HEV es el líder del podio; CX-5 es la primera fila del
      // resto (posición 04) — cubre las dos variantes con datos reales.
      expectOrderedInRow(markup, 'Tucson HEV', [
        'Híbrido',
        '8,2',
        '616',
        '40.325',
      ]);
      expectOrderedInRow(markup, 'CX-5', ['ligero', '10,5', '583', '35.200']);
      expect(markup).not.toMatch(/\d\s*CV\b/);
    });
  });
});

describe('editableRatingsOf', () => {
  it('finds exactly the two editable ratings the domain declares', () => {
    // Antes de product/0005 había una tercera: la valoración subjetiva de
    // viaje. Esa spec la retira, así que aquí solo quedan las dos de
    // estética — es el propio dominio quien decide, no esta lista.
    const sportage = scored().find((car) => car.carId === 'kia-sportage-hev')!;
    expect(editableRatingsOf(sportage).map((rating) => rating.field)).toEqual([
      'aestheticsExterior',
      'aestheticsInterior',
    ]);
  });

  it('reads each rating value straight from the breakdown, never from a copy', () => {
    const sportage = scored().find((car) => car.carId === 'kia-sportage-hev')!;
    const byField = new Map(
      editableRatingsOf(sportage).map((rating) => [rating.field, rating.value]),
    );
    expect(byField.get('aestheticsExterior')).toBe(2);
    expect(byField.get('aestheticsInterior')).toBe(4);
  });

  it('still finds both after every label has been rewritten', () => {
    // La prueba de fuego del desacoplo: cambiar la copia no puede afectar a
    // qué controles aparecen ni a qué campo edita cada uno.
    const [rewritten] = withRewrittenLabels(
      scored().filter((car) => car.carId === 'kia-sportage-hev'),
    );
    expect(editableRatingsOf(rewritten!).map((rating) => rating.field)).toEqual(
      ['aestheticsExterior', 'aestheticsInterior'],
    );
  });

  it('strips the domain’s "(editable)" aside from the control label', () => {
    const sportage = scored().find((car) => car.carId === 'kia-sportage-hev')!;
    const labels = editableRatingsOf(sportage).map((rating) => rating.label);
    expect(labels).toContain('Nota exterior');
    expect(labels).toContain('Nota interior');
    for (const label of labels) {
      expect(label).not.toMatch(/editable/i);
    }
  });
});
