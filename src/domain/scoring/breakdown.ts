import type { SourceEntry } from '../car';
import type { AxisId } from './weights';
import type { Normalization } from './normalize';

/** Un dato de entrada tal como llega al desglose: valor, fuente vigente y
 * si es una estimación (requisito 3), más las fuentes descartadas si las
 * hay (requisito 5). */
export interface InputDatum {
  label: string;
  value: number;
  unit?: string;
  estimated: boolean;
  sourceLabel: string;
  discardedSources: SourceEntry[];
}

export interface AssumptionEcho {
  label: string;
  value: string;
}

export interface PenaltyLine {
  label: string;
  condition: string;
  active: boolean;
  effect: number;
}

export interface SubcomponentBreakdown {
  label: string;
  rawValue: number;
  unit?: string;
  /** Presente cuando el sumando se normaliza de forma independiente antes
   * de combinarse (prestaciones, fiabilidad). Ausente cuando el sumando es
   * una magnitud que se combina en crudo antes de la única normalización
   * del eje (estética, coste) — la fórmula original ya las combina así, y
   * esta spec la muestra, no la cambia. */
  normalization?: Normalization;
}

export interface AxisBreakdown {
  axisId: AxisId;
  label: string;
  formulaDescription: string;
  inputs: InputDatum[];
  assumptionsUsed: AssumptionEcho[];
  /** Ejes simples: su única normalización. */
  normalization?: Normalization;
  /** Ejes compuestos: una normalización por sumando (requisito 7). */
  subcomponents?: SubcomponentBreakdown[];
  /** 0-10, ya combinado si el eje es compuesto, antes de penalizaciones. */
  rawScore: number;
  penalties: PenaltyLine[];
  weight: number;
  /** rawScore + penalizaciones, acotado a 0-10. */
  score: number;
  /** score × weight. La suma de aportaciones de los seis ejes reproduce el total. */
  contribution: number;
}

export interface CarScoreBreakdown {
  carId: string;
  carName: string;
  overBudget: boolean;
  axes: AxisBreakdown[];
  total: number;
}

export function inputDatumFrom(
  label: string,
  sourced: { value: number; unit?: string; sources: SourceEntry[] },
): InputDatum {
  const current = sourced.sources.find((source) => source.current);
  if (!current) {
    // La validación de Zod (car.ts) garantiza exactamente una fuente
    // vigente antes de que un Car llegue aquí; esta rama es defensiva.
    throw new Error(`Dato «${label}» sin fuente vigente`);
  }
  return {
    label,
    value: sourced.value,
    unit: sourced.unit,
    estimated: current.estimated,
    sourceLabel: current.label,
    discardedSources: sourced.sources.filter((source) => !source.current),
  };
}
