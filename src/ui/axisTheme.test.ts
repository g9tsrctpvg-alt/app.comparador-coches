import { describe, expect, it } from 'vitest';
import { AXIS_ORDER } from '../domain/scoring/weights';
import { AXIS_THEME_CLASS } from './axisTheme';

describe('AXIS_THEME_CLASS', () => {
  it('covers every axis and nothing else', () => {
    expect(Object.keys(AXIS_THEME_CLASS).sort()).toEqual(
      [...AXIS_ORDER].sort(),
    );
  });

  it('gives every axis a class of its own', () => {
    // Dos ejes con la misma clase se pintarían del mismo color, que es
    // exactamente el estado del que esta spec viene.
    const classes = AXIS_ORDER.map((axisId) => AXIS_THEME_CLASS[axisId]);
    expect(new Set(classes).size).toBe(AXIS_ORDER.length);
  });
});
