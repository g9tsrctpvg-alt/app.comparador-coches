import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AXIS_ORDER } from '../../domain/scoring/weights';
import { AxisIcon } from './AxisIcon';

describe('AxisIcon', () => {
  it('draws a shape for every axis', () => {
    // Recorre `AXIS_ORDER` y no una lista propia: un eje nuevo en el dominio
    // que se olvidara de traer su dibujo tiene que poner esto rojo, no pasar
    // desapercibido porque el test mire su propia copia de los seis.
    for (const axisId of AXIS_ORDER) {
      const markup = renderToStaticMarkup(<AxisIcon axisId={axisId} />);
      expect(markup, axisId).toMatch(/^<svg[^>]*viewBox="0 0 24 24"/);
      // Un `<svg>` sin nada dentro también empieza así: lo que se comprueba
      // aquí es que este eje trae dibujo propio.
      expect(markup, axisId).toMatch(/<(path|circle|rect)\b/);
    }
  });

  it('never announces itself: the axis name is already there in real text', () => {
    for (const axisId of AXIS_ORDER) {
      const markup = renderToStaticMarkup(<AxisIcon axisId={axisId} />);
      expect(markup, axisId).toContain('aria-hidden="true"');
      expect(markup, axisId).not.toContain('aria-label');
      expect(markup, axisId).not.toContain('<title');
    }
  });

  it('gives every axis a different drawing', () => {
    // Seis iconos iguales serían seis iconos inútiles, y un error de copiar y
    // pegar en el mapa de formas no lo detectaría ningún otro test.
    const shapes = AXIS_ORDER.map((axisId) =>
      renderToStaticMarkup(<AxisIcon axisId={axisId} />),
    );
    expect(new Set(shapes).size).toBe(AXIS_ORDER.length);
  });
});
