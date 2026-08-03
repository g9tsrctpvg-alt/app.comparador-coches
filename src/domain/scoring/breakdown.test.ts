import { describe, expect, it } from 'vitest';
import { inputDatumFrom } from './breakdown';

describe('inputDatumFrom', () => {
  it('reads the value, unit, estimated flag and discarded sources from the current source', () => {
    const datum = inputDatumFrom('Maletero', {
      value: 587,
      unit: 'L',
      sources: [
        {
          label: 'Ficha del fabricante',
          value: 620,
          estimated: false,
          current: false,
          discardedReason: 'Medido hasta el techo, no hasta la bandeja.',
        },
        { label: 'Medición km77', value: 587, estimated: false, current: true },
      ],
    });

    expect(datum).toEqual({
      label: 'Maletero',
      value: 587,
      unit: 'L',
      estimated: false,
      sourceLabel: 'Medición km77',
      discardedSources: [
        {
          label: 'Ficha del fabricante',
          value: 620,
          estimated: false,
          current: false,
          discardedReason: 'Medido hasta el techo, no hasta la bandeja.',
        },
      ],
    });
  });

  it('marks the datum as estimated when the current source is', () => {
    const datum = inputDatumFrom('Altura libre', {
      value: 150,
      sources: [
        {
          label: 'Estimación propia',
          value: 150,
          estimated: true,
          current: true,
        },
      ],
    });
    expect(datum.estimated).toBe(true);
  });

  it('throws when no source is marked current', () => {
    expect(() =>
      inputDatumFrom('Precio', {
        value: 30000,
        sources: [
          { label: 'Fuente', value: 30000, estimated: false, current: false },
        ],
      }),
    ).toThrow(/sin fuente vigente/);
  });
});
