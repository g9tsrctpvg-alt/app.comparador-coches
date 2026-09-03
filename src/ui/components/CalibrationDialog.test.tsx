import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadCatalog } from '../../data/loadCatalog';
import { publishedCars } from '../../domain/car';
import { buildFicha, withComparison } from '../../domain/ficha';
import {
  activeAxesOf,
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
  const { nextMatchup } = calibrate(profiles, [], DEFAULT_WEIGHTS);
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
  const activeAxes = activeAxesOf(profiles);

  function render(selected: Set<AxisId> = new Set()): string {
    return renderToStaticMarkup(
      <AttributionStep
        carName="EV3"
        activeAxes={activeAxes}
        selected={selected}
        onToggle={() => {}}
        onNext={() => {}}
        onDontKnow={() => {}}
        onUndo={() => {}}
      />,
    );
  }

  it('ofrece marcar los siete ejes activos, con el nombre del coche elegido (requisito 3.1)', () => {
    const markup = render();
    expect(markup).toContain('EV3');
    expect(activeAxes).toHaveLength(7);
    for (const axisId of activeAxes) {
      expect(markup, axisId).toContain(AXIS_LABELS[axisId]);
    }
  });

  it('no ofrece un eje constante como decisivo (requisito 7.4 de product/0037)', () => {
    expect(activeAxes).not.toContain('prueba');
    expect(render()).not.toContain(AXIS_LABELS.prueba);
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

  it('ofrece la vuelta atrás, y no las otras dos salidas del cara a cara (technical/0013, requisitos 3.1 y 3.2)', () => {
    const markup = render();
    expect(markup).toContain('Deshacer la última');
    expect(markup).not.toContain('Me da igual');
    expect(markup).not.toContain('Terminar ahora');
  });

  it('el rótulo del paso puede recibir el foco (technical/0013, requisito 4.1)', () => {
    // El efecto que lo enfoca al montar no corre en `renderToStaticMarkup`;
    // lo que el marcado sí prueba es que el rótulo es enfocable, que es la
    // mitad estructural del requisito. La otra —que el efecto lo enfoque al
    // entrar— es una línea de `AttributionStep` sin rama.
    expect(render()).toMatch(/<p[^>]*tabindex="-1"/);
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
    prueba: 0,
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

  it('avisa cuando algo de lo contestado se contradice (requisito 4.2)', () => {
    expect(render({ contradicted: 1 })).toContain('Hay algo en lo que has');
    expect(render({ contradicted: 3 })).toContain('Hay 3 cosas en lo que has');
    expect(render()).not.toContain('no encaja');
  });

  it('con una sola desigualdad contradicha no afirma que haya otras respuestas (technical/0013, requisito 1.2)', () => {
    // Desde `product/0036` una sola respuesta con atribución imposible ya da
    // `contradicted: 1`, así que el aviso no puede hablar de «las demás» ni
    // culpar a la elección de coche.
    const markup = render({ contradicted: 1, answered: 1 });
    const note = markup
      .split('<p class=')
      .find((chunk) => chunk.includes('no encaja'));
    expect(note).toBeDefined();
    expect(note).not.toContain('las demás');
    // Ni cuenta respuestas ni culpa a la elección de coche.
    expect(note).not.toContain('respuesta');
    expect(note).not.toContain('prefer');
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
    const state = calibrate(profiles, outcomes, DEFAULT_WEIGHTS);
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
