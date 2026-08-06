import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RankingList, editableRatingsOf } from './RankingList';
import { scoreCatalog } from '../../domain/scoring/score';
import { DEFAULT_WEIGHTS } from '../../domain/scoring/weights';
import { DEFAULT_ASSUMPTIONS } from '../../domain/scoring/assumptions';
import { threeCarFixture } from '../../domain/scoring/testFixtures';
import type { CarScoreBreakdown } from '../../domain/scoring/breakdown';

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
      hideOverBudget={false}
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

  it('hides the cars over budget when asked to', () => {
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
        hideOverBudget
        onRatingChange={() => undefined}
      />,
    );
    for (const car of overBudget) {
      expect(markup).not.toContain(car.carName);
    }
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
