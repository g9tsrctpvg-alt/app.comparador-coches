import type { Car } from '../../car';
import type { GlobalAssumptions } from '../assumptions';
import type { AxisBreakdown } from '../breakdown';

// El 1-5 que da el usuario ya es su juicio completo — 1 = nada que salvar,
// 5 = tan guapo como hace falta —, así que se traduce en línea recta, sin
// curva en S: comprimir los extremos otra vez deformaría el mismo juicio
// dos veces.
const NOTA_MALA_VALORACION = 1;
const NOTA_BUENA_VALORACION = 5;

export function esteticaNota(valoracion: number): number {
  return (valoracion - NOTA_MALA_VALORACION) * 2.5;
}

export function esteticaFormula(assumptions: GlobalAssumptions): string {
  const mix = assumptions.mezclaEstetica;
  return (
    `nota = ${mix.toFixed(1)} × nota_exterior + ${(1 - mix).toFixed(1)} × nota_interior; ` +
    'nota_x = (valoración_x − 1) × 2,5, lineal, sin curva en S y sin normalizar ' +
    'contra el catálogo: la valoración 1-5 ya es la escala absoluta.'
  );
}

export function buildEsteticaBreakdown(
  cars: Car[],
  assumptions: GlobalAssumptions,
  weight: number,
): Map<string, AxisBreakdown> {
  const mix = assumptions.mezclaEstetica;
  const formula = esteticaFormula(assumptions);

  const result = new Map<string, AxisBreakdown>();
  for (const car of cars) {
    const exteriorNota = esteticaNota(car.aestheticsExterior.value);
    const interiorNota = esteticaNota(car.aestheticsInterior.value);
    const rawScore = mix * exteriorNota + (1 - mix) * interiorNota;
    const score = Math.min(10, Math.max(0, rawScore));

    result.set(car.id, {
      axisId: 'estetica',
      label: 'Estética',
      formulaDescription: formula,
      inputs: [],
      assumptionsUsed: [
        {
          label: 'Mezcla exterior/interior',
          value: `${mix.toFixed(1)} / ${(1 - mix).toFixed(1)}`,
        },
      ],
      subcomponents: [
        {
          label: 'Nota exterior (tu valoración, editable)',
          rawValue: car.aestheticsExterior.value,
          unit: '/5',
          editableRating: 'aestheticsExterior',
          scale: {
            value: car.aestheticsExterior.value,
            goodAnchor: NOTA_BUENA_VALORACION,
            badAnchor: NOTA_MALA_VALORACION,
            score: exteriorNota,
          },
        },
        {
          label: 'Nota interior (tu valoración, editable)',
          rawValue: car.aestheticsInterior.value,
          unit: '/5',
          editableRating: 'aestheticsInterior',
          scale: {
            value: car.aestheticsInterior.value,
            goodAnchor: NOTA_BUENA_VALORACION,
            badAnchor: NOTA_MALA_VALORACION,
            score: interiorNota,
          },
        },
      ],
      rawScore,
      penalties: [],
      weight,
      score,
      contribution: score * weight,
    });
  }
  return result;
}
