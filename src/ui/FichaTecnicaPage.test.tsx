import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FichaTecnicaPage } from './FichaTecnicaPage';
import { threeCarFixture } from '../domain/scoring/testFixtures';
import type { Reference } from '../domain/reference';

function referenceFixture(overrides: Partial<Reference> = {}): Reference {
  return {
    id: 'alfa-romeo-giulietta',
    name: 'Giulietta',
    brand: 'Alfa Romeo',
    technology: 'ICE',
    photos: {},
    lengthMm: {
      value: 4351,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 4351, estimated: false, current: true },
      ],
    },
    widthMm: {
      value: 1798,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 1798, estimated: false, current: true },
      ],
    },
    heightMm: {
      value: 1465,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 1465, estimated: false, current: true },
      ],
    },
    groundClearanceMm: {
      value: 130,
      unit: 'mm',
      sources: [
        { label: 'Fixture', value: 130, estimated: true, current: true },
      ],
    },
    trunkLiters: {
      value: 350,
      unit: 'L',
      sources: [
        { label: 'Fixture', value: 350, estimated: false, current: true },
      ],
    },
    ...overrides,
  };
}

describe('FichaTecnicaPage', () => {
  it('renders a real table, not a div grid, with a scoped header per column', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('<table');
    expect(markup).toContain('<thead');
    expect(markup).toMatch(/<th scope="col"/);
    expect(markup).toMatch(/<th scope="row"/);
  });

  it('shows one row per candidate plus one for the reference, labelled as such', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    for (const car of threeCarFixture) {
      expect(markup).toContain(car.name);
    }
    expect(markup).toContain('Giulietta');
    expect(markup).toContain('Referencia');
  });

  it('shows an em dash, not a zero, in the reference row own delta columns', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('Sin diferencia que mostrar.');
  });

  it('writes the sign explicitly on every delta value', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    // Sportage: 4540mm frente a 4351mm de referencia → +189.
    expect(markup).toContain('+189');
  });

  it('computes L/m² and shows it with a readable unit', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('L/m²');
  });

  it('marks the estimated ground clearance of the reference row', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('valor estimado, no verificado directamente');
  });

  it('renders the legend explaining Δ, colors, L/m² and the estimated mark', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('es la diferencia con la fila de referencia');
    expect(markup).toContain('litros de maletero por cada metro cuadrado');
  });

  it('renders the view switcher with the ficha técnica marked as active', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage
        cars={threeCarFixture}
        references={[referenceFixture()]}
      />,
    );
    expect(markup).toContain('aria-label="Vista"');
    expect(markup).toMatch(/Ficha técnica<\/a>/);
  });

  it('renders with no reference registered, leaving deltas as em dashes throughout', () => {
    const markup = renderToStaticMarkup(
      <FichaTecnicaPage cars={threeCarFixture} references={[]} />,
    );
    expect(markup).toContain('<table');
    expect(markup).not.toContain('Referencia');
  });
});
