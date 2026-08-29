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
