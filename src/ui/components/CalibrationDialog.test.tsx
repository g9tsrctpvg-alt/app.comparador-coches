import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadCatalog } from '../../data/loadCatalog';
import { publishedCars } from '../../domain/car';
import { buildFicha, withComparison } from '../../domain/ficha';
import {
  calibrate,
  profileOf,
  type MatchupOutcome,
} from '../../domain/calibration';
import { scoreCatalog } from '../../domain/scoring/score';
import { DEFAULT_ASSUMPTIONS } from '../../domain/scoring/assumptions';
import {
  AXIS_LABELS,
  AXIS_ORDER,
  DEFAULT_WEIGHTS,
  type AxisId,
  type AxisWeights,
} from '../../domain/scoring/weights';
import { AXIS_THEME_CLASS } from '../axisTheme';
import {
  AttributionStep,
  CalibrationResult,
  MatchupView,
} from './CalibrationDialog';

const cars = publishedCars(loadCatalog());
const scored = scoreCatalog(cars, DEFAULT_WEIGHTS, DEFAULT_ASSUMPTIONS, 47000);
const profiles = scored.map(profileOf);
const entities = buildFicha(cars, []);

function matchupMarkup(): string {
  const { nextMatchup } = calibrate(profiles, []);
  const matchup = nextMatchup as { aCarId: string; bCarId: string };
  const a = withComparison(entities, matchup.bCarId).find(
    (entity) => entity.id === matchup.aCarId,
  );
  const b = withComparison(entities, matchup.aCarId).find(
    (entity) => entity.id === matchup.bCarId,
  );
  return renderToStaticMarkup(
    <MatchupView
      a={a as (typeof entities)[number]}
      b={b as (typeof entities)[number]}
      onPrefer={() => {}}
    />,
  );
}

describe('MatchupView', () => {
  it('enseña los dos coches con sus magnitudes y su Δ (requisito 7.1)', () => {
    const markup = matchupMarkup();
    expect(markup).toContain('EV3');
    expect(markup).toContain('Compass');
    // Las mismas magnitudes de la ficha completa, en sus bloques.
    for (const label of [
      'Longitud',
      'Maletero',
      'Potencia',
      'Precio',
      'Diámetro de giro',
    ]) {
      expect(markup).toContain(label);
    }
    // La Δ entre los dos, con su signo escrito.
    expect(markup).toMatch(/[+−]\d/);
  });

  it('no enseña ninguna cifra que salga del modelo (requisito 7.2)', () => {
    // Se mira solo la parte que describe a los dos coches: el texto de ayuda
    // de arriba sí nombra la nota, justamente para decir que no se enseña.
    const columns = matchupMarkup().split('</p>').slice(1).join('</p>');

    // Ni la nota, ni el porcentaje, ni el puesto: no hay rótulo que los
    // introduzca ni símbolo de porcentaje en ninguna celda. No se buscan los
    // valores como texto suelto a propósito — «59» aparece en «+59 CV» sin
    // que eso sea una nota—, así que lo que se comprueba es que no exista el
    // sitio donde se enseñarían.
    // Sobre el texto visible, no sobre el marcado: el `src` de una foto trae
    // paréntesis codificados como `%28` que no son ningún porcentaje.
    const text = columns.replace(/<[^>]*>/g, ' ');
    expect(text).not.toMatch(/\bNota\b|\bPuntuación\b|\bPuesto\b/);
    expect(text).not.toContain('%');

    // Ni el color de ningún eje: el desglose de `product/0029` no llega por
    // ninguna vía.
    for (const axisId of AXIS_ORDER) {
      expect(columns, axisId).not.toContain(AXIS_THEME_CLASS[axisId]);
    }

    // Ni su nombre. `estetica` queda fuera de esta comprobación porque su
    // rótulo de eje —«Estética»— es prefijo de dos magnitudes de la ficha,
    // «Estética exterior» y «Estética interior», que son dato del coche y
    // que el requisito 7.3 manda enseñar. Que aparezcan no es una fuga del
    // modelo: son las valoraciones que se editan en la clasificación.
    for (const axisId of AXIS_ORDER.filter((id) => id !== 'estetica')) {
      expect(text, axisId).not.toContain(AXIS_LABELS[axisId]);
    }
    expect(text).not.toMatch(/Estética(?! exterior| interior)/);
  });

  it('ofrece preferir cada uno de los dos coches', () => {
    const markup = matchupMarkup();
    expect(markup).toContain('Prefiero el EV3');
    expect(markup).toContain('Prefiero el Compass');
  });
});

describe('AttributionStep', () => {
  function render(selected: Set<AxisId> = new Set()): string {
    return renderToStaticMarkup(
      <AttributionStep
        carName="EV3"
        selected={selected}
        onToggle={() => {}}
        onNext={() => {}}
        onDontKnow={() => {}}
      />,
    );
  }

  it('ofrece marcar los siete ejes, con el nombre del coche elegido (requisito 3.1)', () => {
    const markup = render();
    expect(markup).toContain('EV3');
    for (const axisId of AXIS_ORDER) {
      expect(markup, axisId).toContain(AXIS_LABELS[axisId]);
    }
  });

  it('no enseña ninguna cifra del modelo (requisito 3.4)', () => {
    const text = render().replace(/<[^>]*>/g, ' ');
    expect(text).not.toMatch(/\bNota\b|\bPuntuación\b|\bPuesto\b/);
    expect(text).not.toContain('%');
  });

  it('marca como pulsados solo los ejes seleccionados', () => {
    const markup = render(new Set<AxisId>(['fiabilidad', 'coste']));
    const pressed = (markup.match(/aria-pressed="true"/g) ?? []).length;
    expect(pressed).toBe(2);
  });

  it('ofrece «Siguiente» y «No sabría decir» (requisito 3.2)', () => {
    const markup = render();
    expect(markup).toContain('Siguiente');
    expect(markup).toContain('No sabría decir');
  });
});

describe('CalibrationResult', () => {
  const proposed: AxisWeights = {
    carga: 5,
    habitabilidad: 8,
    diario: 10,
    prestaciones: 5,
    fiabilidad: 10,
    estetica: 8,
    coste: 5,
  };

  function render(
    overrides: Partial<Parameters<typeof CalibrationResult>[0]> = {},
  ): string {
    return renderToStaticMarkup(
      <CalibrationResult
        proposedWeights={proposed}
        currentWeights={DEFAULT_WEIGHTS}
        compatibleCount={4}
        contradicted={0}
        answered={15}
        onApply={() => {}}
        onDiscard={() => {}}
        {...overrides}
      />,
    );
  }

  it('enseña los siete pesos y el valor anterior de los que cambian', () => {
    const markup = render();
    expect(markup).toContain('Capacidad de carga');
    expect(markup).toContain('Coste total');
    // `habitabilidad` pasa de 5 a 8: se dice de dónde viene.
    expect(markup).toContain('antes 5');
    // `carga` se queda en 5: no lleva «antes».
    expect((markup.match(/antes /g) ?? []).length).toBe(
      AXIS_ORDER.filter(
        (axisId) => proposed[axisId] !== DEFAULT_WEIGHTS[axisId],
      ).length,
    );
  });

  it('dice que los pesos son una explicación, no una medida (requisito 10.2)', () => {
    expect(render()).toContain('una de las 4 combinaciones');
    expect(render()).toContain('la clasificación, no los siete números');
  });

  it('con una sola combinación compatible sigue sin prometer los pesos', () => {
    const markup = render({ compatibleCount: 1 });
    expect(markup).toContain('la única combinación');
    expect(markup).toContain('tu clasificación, no tus pesos');
  });

  it('avisa cuando alguna respuesta se contradice (requisito 4.2)', () => {
    expect(render({ contradicted: 1 })).toContain('Una de tus respuestas');
    expect(render({ contradicted: 3 })).toContain('3 de tus respuestas');
    expect(render()).not.toContain('no encaja');
  });

  it('sin respuestas no propone nada y no deja aplicar', () => {
    const markup = render({ answered: 0 });
    expect(markup).toContain('No has contestado ningún cara a cara');
    expect(markup).toContain('disabled');
  });

  it('ofrece siempre aplicar y descartar (requisito 10.4)', () => {
    const markup = render();
    expect(markup).toContain('Aplicar a los deslizadores');
    expect(markup).toContain('Descartar');
    expect(markup).not.toContain('disabled');
  });
});

describe('la tanda no toca nada por su cuenta', () => {
  it('los pesos propuestos solo salen de `calibrate` (requisito 10.4)', () => {
    // El diálogo no calcula: lo que enseñaría es exactamente lo que la
    // función pura devuelve para las mismas respuestas.
    const outcomes: MatchupOutcome[] = [
      { aCarId: 'kia-ev3', bCarId: 'jeep-compass', preferred: 'a' },
    ];
    const state = calibrate(profiles, outcomes);
    const markup = renderToStaticMarkup(
      <CalibrationResult
        proposedWeights={state.proposedWeights}
        currentWeights={DEFAULT_WEIGHTS}
        compatibleCount={state.compatibleCount}
        contradicted={state.contradicted}
        answered={1}
        onApply={() => {}}
        onDiscard={() => {}}
      />,
    );
    for (const axisId of AXIS_ORDER) {
      expect(markup).toContain(String(state.proposedWeights[axisId]));
    }
  });
});
