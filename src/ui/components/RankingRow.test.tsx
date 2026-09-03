import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { threeCarFixture } from '../../domain/scoring/testFixtures';
import { scoreCatalog } from '../../domain/scoring/score';
import { DEFAULT_ASSUMPTIONS } from '../../domain/scoring/assumptions';
import { DEFAULT_WEIGHTS } from '../../domain/scoring/weights';
import { RankingRow } from './RankingRow';

const SCORED = scoreCatalog(
  threeCarFixture,
  DEFAULT_WEIGHTS,
  DEFAULT_ASSUMPTIONS,
  47000,
);
const sportage = SCORED.find((car) => car.carId === 'kia-sportage-hev')!;
const x1 = SCORED.find((car) => car.carId === 'bmw-x1-xdrive25e')!;

function renderRow(overrides: Partial<Parameters<typeof RankingRow>[0]> = {}) {
  return renderToStaticMarkup(
    <RankingRow
      car={sportage}
      rank={1}
      isLeader
      variant="list"
      expanded
      onToggle={() => undefined}
      editableRatings={[]}
      onRatingChange={() => undefined}
      compareTo={x1}
      weights={DEFAULT_WEIGHTS}
      decisionState="undecided"
      decisionEntry={undefined}
      onSetDecision={() => undefined}
      onClearDecision={() => undefined}
      {...overrides}
    />,
  );
}

describe('RankingRow, expanded (product/0029, requisito 4)', () => {
  it('shows the gap summary line before the axis breakdown, for the list variant', () => {
    const markup = renderRow({ variant: 'list' });
    const summaryAt = markup.indexOf('Frente a');
    const axisAt = markup.indexOf('aportación');
    expect(summaryAt).toBeGreaterThan(-1);
    expect(axisAt).toBeGreaterThan(summaryAt);
    expect(markup).toContain(x1.carName);
  });

  it('shows the same summary line for the podium variant, without changing its composition', () => {
    const markup = renderRow({ variant: 'podium' });
    expect(markup).toContain('Frente a');
    expect(markup).toContain('podiumCard');
  });

  it('shows nothing when there is nothing to compare against (a single visible car)', () => {
    const markup = renderRow({ compareTo: undefined });
    expect(markup).not.toContain('Frente a');
    // El desglose por eje sigue ahí: solo falta el resumen.
    expect(markup).toContain('aportación');
  });

  it('renders no gap summary at all when the row is collapsed', () => {
    const markup = renderRow({ expanded: false });
    expect(markup).not.toContain('Frente a');
    expect(markup).not.toContain('aportación');
  });
});

describe('RankingRow, decision status (product/0030)', () => {
  // El control de edición (`DecisionEditor`) enseña siempre las tres
  // etiquetas dentro de su `<select>`, decidido o no (requisito 6.1), así
  // que la marca —el objeto de estos dos tests— se comprueba por su clase,
  // no por el texto del rótulo, que aparecería de todos modos.
  it('shows no mark next to the name when undecided (requisito 5.1)', () => {
    const markup = renderRow({ decisionState: 'undecided' });
    expect(markup).not.toContain('markShortlist');
    expect(markup).not.toContain('markDiscarded');
  });

  it('shows the mark next to the name for the two decided states, with its text label', () => {
    const shortlisted = renderRow({ decisionState: 'shortlist' });
    expect(shortlisted).toContain('markShortlist');
    expect(shortlisted).toContain('Lista corta');

    const discarded = renderRow({ decisionState: 'discarded' });
    expect(discarded).toContain('markDiscarded');
    expect(discarded).toContain('Descartado');
  });

  it('shows state, reason and date ahead of the duel summary when decided (requisito 5.2)', () => {
    const markup = renderRow({
      decisionState: 'discarded',
      decisionEntry: {
        state: 'discarded',
        date: '2026-08-30',
        reason: 'el maletero se queda corto',
      },
    });
    const decisionAt = markup.indexOf('el maletero se queda corto');
    const gapAt = markup.indexOf('Frente a');
    expect(markup).toContain('Descartado el 30/08/2026');
    expect(decisionAt).toBeGreaterThan(-1);
    expect(gapAt).toBeGreaterThan(decisionAt);
  });

  it('shows only state and date when there is no reason written', () => {
    const markup = renderRow({
      decisionState: 'shortlist',
      decisionEntry: { state: 'shortlist', date: '2026-08-30' },
    });
    // El resumen del duelo también usa ` — `, así que se aísla el párrafo
    // de la decisión antes de comprobar que no lleva motivo.
    const decisionParagraph =
      /<p class="[^"]*decisionSummary[^"]*">(.*?)<\/p>/.exec(markup)?.[1];
    expect(markup).toContain('Lista corta el 30/08/2026');
    expect(decisionParagraph).toBe('Lista corta el 30/08/2026');
  });

  it('shows nothing when undecided, even though the row is expanded', () => {
    const markup = renderRow({
      decisionState: 'undecided',
      decisionEntry: undefined,
    });
    expect(markup).not.toMatch(/el \d{2}\/\d{2}\/\d{4}/);
  });

  it('renders the editable control with the three states, always, regardless of decision', () => {
    const markup = renderRow({ decisionState: 'undecided' });
    expect(markup).toContain('Sin decidir');
    expect(markup).toContain('Lista corta');
    expect(markup).toContain('Descartado');
  });

  it('links to the visit sheet of this car (product/0037, requisito 6.3)', () => {
    const markup = renderRow();
    expect(markup).toContain(`href="#/visita/${sportage.carId}"`);
    expect(markup).toContain('Hoja de visita');
  });
});
