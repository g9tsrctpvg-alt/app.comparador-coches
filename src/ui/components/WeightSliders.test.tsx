import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AXIS_ORDER,
  DEFAULT_WEIGHTS,
  type AxisWeights,
} from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';
import { WeightSliders } from './WeightSliders';

function render(weights: AxisWeights = DEFAULT_WEIGHTS): string {
  return renderToStaticMarkup(
    <WeightSliders weights={weights} onChange={() => {}} />,
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
