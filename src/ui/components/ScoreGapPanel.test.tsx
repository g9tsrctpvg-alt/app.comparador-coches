import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { threeCarFixture } from '../../domain/scoring/testFixtures';
import { scoreCatalog } from '../../domain/scoring/score';
import { DEFAULT_ASSUMPTIONS } from '../../domain/scoring/assumptions';
import { DEFAULT_WEIGHTS } from '../../domain/scoring/weights';
import { ScoreGapPanel } from './ScoreGapPanel';

const SCORED = scoreCatalog(
  threeCarFixture,
  DEFAULT_WEIGHTS,
  DEFAULT_ASSUMPTIONS,
  47000,
);
const sportage = SCORED.find((car) => car.carId === 'kia-sportage-hev')!;
const x1 = SCORED.find((car) => car.carId === 'bmw-x1-xdrive25e')!;

describe('ScoreGapPanel', () => {
  it('renders nothing when there is no focused entity', () => {
    const markup = renderToStaticMarkup(
      <ScoreGapPanel
        focusedName={undefined}
        pinnedName={undefined}
        focusedScore={undefined}
        pinnedScore={undefined}
        hasComparison={false}
        weights={DEFAULT_WEIGHTS}
      />,
    );
    expect(markup).toBe('');
  });

  it('explains the missing gap when the comparison is "Ninguno" (requisito 6)', () => {
    const markup = renderToStaticMarkup(
      <ScoreGapPanel
        focusedName={sportage.carName}
        pinnedName={undefined}
        focusedScore={sportage}
        pinnedScore={undefined}
        hasComparison={false}
        weights={DEFAULT_WEIGHTS}
      />,
    );
    expect(markup).toContain('Elige un modelo con el que comparar');
    expect(markup).not.toContain('Estética');
  });

  it('explains the missing gap when the comparison is a reference without a score (requisito 6)', () => {
    const markup = renderToStaticMarkup(
      <ScoreGapPanel
        focusedName={sportage.carName}
        pinnedName="Giulietta"
        focusedScore={sportage}
        pinnedScore={undefined}
        hasComparison
        weights={DEFAULT_WEIGHTS}
      />,
    );
    expect(markup).toContain('Comparando con «Giulietta»');
    expect(markup).toContain('coche de referencia');
    expect(markup).not.toContain('Estética');
  });

  it('explains the missing gap when the focused entity itself is the reference', () => {
    const markup = renderToStaticMarkup(
      <ScoreGapPanel
        focusedName="Giulietta"
        pinnedName={sportage.carName}
        focusedScore={undefined}
        pinnedScore={sportage}
        hasComparison
        weights={DEFAULT_WEIGHTS}
      />,
    );
    expect(markup).toContain('«Giulietta» es tu coche de referencia');
  });

  it('renders the six axis lines, the headline and the sensitivity summary when both cars are scored', () => {
    const markup = renderToStaticMarkup(
      <ScoreGapPanel
        focusedName={sportage.carName}
        pinnedName={x1.carName}
        focusedScore={sportage}
        pinnedScore={x1}
        hasComparison
        weights={DEFAULT_WEIGHTS}
      />,
    );
    expect(markup).toContain('aria-label="Detalle ejes"');
    expect(markup).toMatch(/gana por [\d,]+ pp\./);
    for (const label of [
      'Espacio y confort en viaje',
      'Facilidad de uso diario',
      'Prestaciones',
      'Fiabilidad y garantía',
      'Estética',
      'Coste total',
    ]) {
      expect(markup).toContain(label);
    }
    // Cada línea es un botón sin desplegar por defecto (requisito 3.4): el
    // desglose por eje no sale en el marcado inicial.
    expect(markup).not.toContain('aportación');
  });
});
