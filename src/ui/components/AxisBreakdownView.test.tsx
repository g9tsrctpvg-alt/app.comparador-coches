import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AxisBreakdownView } from './AxisBreakdownView';
import type { AxisBreakdown } from '../../domain/scoring/breakdown';
import { AXIS_ORDER } from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';

function baseAxis(overrides: Partial<AxisBreakdown> = {}): AxisBreakdown {
  return {
    axisId: 'coste',
    label: 'Coste total',
    formulaDescription: 'una fórmula cualquiera',
    inputs: [],
    assumptionsUsed: [],
    rawScore: 5,
    penalties: [],
    weight: 1,
    score: 5,
    contribution: 5,
    ...overrides,
  };
}

describe('AxisBreakdownView', () => {
  it('shows a textual discarded source as its text, never as NaN', () => {
    // `SourceEntrySchema` admite `string` en `value`, y la vista lo pasaba
    // por `Number()`, así que una fuente cualitativa salía como «NaN».
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({
          inputs: [
            {
              label: 'Maletero',
              value: 526,
              unit: 'L',
              estimated: false,
              sourceLabel: 'Medición VDA',
              discardedSources: [
                {
                  label: 'Ficha de catálogo',
                  value: 'no publicado',
                  estimated: false,
                  current: false,
                  discardedReason: 'Medido hasta el techo.',
                },
              ],
            },
          ],
        })}
      />,
    );
    expect(markup).toContain('no publicado');
    expect(markup).not.toContain('NaN');
  });

  it('still formats a numeric discarded source with the input unit', () => {
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({
          inputs: [
            {
              label: 'Precio',
              value: 36000,
              unit: '€',
              estimated: false,
              sourceLabel: 'Tarifa vigente',
              discardedSources: [
                {
                  label: 'Tarifa anterior',
                  value: 34000,
                  estimated: false,
                  current: false,
                  discardedReason: 'Precio de 2025.',
                },
              ],
            },
          ],
        })}
      />,
    );
    expect(markup).toContain('€');
    expect(markup).not.toContain('NaN');
  });

  it('labels the axis normalization figures with the raw unit', () => {
    // El eje `coste` mostraba euros pelados en este bloque mientras sus
    // propias filas de entrada sí llevaban «€».
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({
          rawUnit: '€',
          normalization: {
            direction: 'menor-mejor',
            min: { carId: 'a', carName: 'EV3', value: 44411 },
            max: { carId: 'b', carName: 'X1', value: 69045 },
            rawValue: 69045,
            normalizedValue: 0,
          },
        })}
      />,
    );
    expect(markup).toMatch(/44\.411\s*€/);
    expect(markup).toMatch(/69\.045\s*€/);
  });

  it('shows both anchors and the resulting score for a subcomponent scored on an absolute scale', () => {
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({
          subcomponents: [
            {
              label: 'Anchura',
              rawValue: 1865,
              unit: 'mm',
              scale: {
                value: 1865,
                goodAnchor: 1765,
                badAnchor: 2000,
                score: 5.7,
              },
            },
          ],
        })}
      />,
    );
    expect(markup).toMatch(/1\.?765\s*mm.*→\s*10/);
    expect(markup).toMatch(/2\.?000\s*mm.*→\s*0/);
    expect(markup).toContain('5,7/10');
  });

  it('shows an informational line without treating it as an applied assumption', () => {
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({
          info: [
            {
              label: 'Extensión de garantía condicionada (no puntúa)',
              value:
                '15 años, hasta 100000 km — Sujeta a mantenimiento en red oficial',
            },
          ],
        })}
      />,
    );
    expect(markup).toContain('Información');
    expect(markup).toContain('no puntúa');
    expect(markup).not.toContain('Supuestos aplicados');
  });

  it('says plainly when an axis has no penalties', () => {
    const markup = renderToStaticMarkup(
      <AxisBreakdownView breakdown={baseAxis()} />,
    );
    expect(markup).toContain('No aplican a este eje.');
  });

  it('wears the color and the icon of the axis it is showing (technical/0011)', () => {
    for (const axisId of AXIS_ORDER) {
      const markup = renderToStaticMarkup(
        <AxisBreakdownView breakdown={baseAxis({ axisId })} />,
      );
      expect(markup, axisId).toContain(AXIS_THEME_CLASS[axisId]);
      // Ningún otro eje se cuela: seis bloques que compartieran clase de tema
      // serían seis bloques del mismo color, que es el estado anterior.
      for (const other of AXIS_ORDER.filter((id) => id !== axisId)) {
        expect(markup, `${axisId} vs ${other}`).not.toContain(
          AXIS_THEME_CLASS[other],
        );
      }
      expect(markup, axisId).toContain('aria-hidden="true"');
    }
  });
});

describe('the prueba axis links to the visit sheet when untested (product/0037, requisito 6.4)', () => {
  const untestedInfo = [
    { label: 'Sin probar', value: 'Puntúa el neutro declarado (ADR 0012)' },
  ];

  it('links to the visit sheet when the axis declares the untested info and a carId is given', () => {
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({ axisId: 'prueba', info: untestedInfo })}
        carId="kia-ev3"
      />,
    );
    expect(markup).toContain('href="#/visita/kia-ev3"');
    expect(markup).toContain('Ir a la hoja de visita');
  });

  it('renders no link when the car has been tested (info is empty)', () => {
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({ axisId: 'prueba', info: [] })}
        carId="kia-ev3"
      />,
    );
    expect(markup).not.toContain('Ir a la hoja de visita');
  });

  it('renders no link without a carId, even when untested', () => {
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({ axisId: 'prueba', info: untestedInfo })}
      />,
    );
    expect(markup).not.toContain('Ir a la hoja de visita');
  });

  it('never links for any other axis', () => {
    const markup = renderToStaticMarkup(
      <AxisBreakdownView
        breakdown={baseAxis({ axisId: 'coste', info: untestedInfo })}
        carId="kia-ev3"
      />,
    );
    expect(markup).not.toContain('Ir a la hoja de visita');
  });
});
