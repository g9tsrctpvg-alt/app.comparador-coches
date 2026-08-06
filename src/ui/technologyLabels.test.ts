import { describe, expect, it } from 'vitest';
import { TechnologySchema } from '../domain/car';
import { TECHNOLOGY_LABELS } from './technologyLabels';

describe('TECHNOLOGY_LABELS', () => {
  it('has a label for each of the five declared technologies, including ICE', () => {
    for (const technology of TechnologySchema.options) {
      expect(TECHNOLOGY_LABELS[technology]).toBeTruthy();
    }
    expect(TECHNOLOGY_LABELS.ICE).toBe('Combustión');
  });

  it('never uses the raw code as its own label', () => {
    for (const [technology, label] of Object.entries(TECHNOLOGY_LABELS)) {
      expect(label).not.toBe(technology);
    }
  });
});
