import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AXIS_ORDER,
  DEFAULT_WEIGHTS,
  type AxisWeights,
} from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';
import { WeightSliders } from './WeightSliders';
import { loadCatalog } from '../../data/loadCatalog';
import { publishedCars } from '../../domain/car';
import { profileOf } from '../../domain/calibration';
import { scoreCatalog } from '../../domain/scoring/score';
import { DEFAULT_ASSUMPTIONS } from '../../domain/scoring/assumptions';

const cars = publishedCars(loadCatalog());
const profiles = scoreCatalog(
  cars,
  DEFAULT_WEIGHTS,
  DEFAULT_ASSUMPTIONS,
  47000,
).map(profileOf);

function render(
  weights: AxisWeights = DEFAULT_WEIGHTS,
  candidates = cars,
): string {
  return renderToStaticMarkup(
    <WeightSliders
      weights={weights}
      onChange={() => {}}
      calibrationCars={candidates}
      calibrationProfiles={profiles.slice(0, candidates.length)}
    />,
  );
}

describe('WeightSliders', () => {
  it('gives every axis one row, themed with its own color (technical/0011)', () => {
    const markup = render();
    for (const axisId of AXIS_ORDER) {
      expect(markup.split(AXIS_THEME_CLASS[axisId]).length - 1, axisId).toBe(1);
    }
  });

  it('draws one icon per axis and lets the text carry the name', () => {
    const markup = render();
    const hidden = (markup.match(/aria-hidden="true"/g) ?? []).length;
    expect(hidden).toBe(AXIS_ORDER.length);
  });

  it('keeps every slider a real range input from 0 to 10', () => {
    const markup = render();
    const ranges = markup.match(/<input[^>]*type="range"[^>]*>/g) ?? [];
    expect(ranges.length).toBe(AXIS_ORDER.length);
    for (const range of ranges) {
      expect(range).toContain('min="0"');
      expect(range).toContain('max="10"');
    }
  });
});

describe('la entrada a la calibración (product/0035)', () => {
  it('ofrece la tanda cuando hay coches de sobra (requisito 12.1)', () => {
    const markup = render();
    expect(markup).toContain('Calibrar eligiendo coches');
    expect(markup).toContain('ajuste fino');
    expect(markup).not.toContain('disabled');
  });

  it('no la ofrece con menos de cuatro coches, y dice por qué (requisito 11.3)', () => {
    const markup = render(DEFAULT_WEIGHTS, cars.slice(0, 3));
    expect(markup).toContain('disabled');
    expect(markup).toContain('al menos 4 coches elegibles');
  });

  it('con cuatro justos sí la ofrece', () => {
    expect(render(DEFAULT_WEIGHTS, cars.slice(0, 4))).not.toContain('disabled');
  });
});
