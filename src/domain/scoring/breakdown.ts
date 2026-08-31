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

/** Los campos de `Car` que el usuario puede editar desde el ranking: solo
 * los de estética, que son juicios sin referente externo. Es el contrato
 * estable entre dominio e interfaz: la interfaz conmuta sobre estos
 * identificadores, nunca sobre el texto de una etiqueta.
 *
 * El confort de viaje no está aquí porque no es un juicio: lo calculan los
 * ejes `carga` y `habitabilidad` a partir de magnitudes medidas
 * (product/0005, product/0017, product/0033). */
export type EditableRatingField = 'aestheticsExterior' | 'aestheticsInterior';

/** Un sumando puntuado contra una escala absoluta fija —dos anclajes, no el
 * conjunto de candidatos (ADR 0004)— en vez de normalización relativa.
 * Entre anclajes la mayoría de ejes usan una curva en S; `estetica` usa un
 * mapeo lineal porque el 1-5 que recibe ya es el juicio completo del
 * usuario y comprimir los extremos otra vez lo deformaría dos veces. El
 * campo no distingue cuál se usó — describe los anclajes y el resultado,
 * no la forma de la curva entre ambos. Mutuamente excluyente con
 * `normalization`: un sumando usa una de las dos formas de puntuar, nunca
 * las dos. */
export interface AbsoluteScale {
  value: number;
  goodAnchor: number;
  badAnchor: number;
  score: number;
}

export interface SubcomponentBreakdown {
  label: string;
  rawValue: number;
  unit?: string;
  /** Presente cuando este subcomponente es una valoración que el usuario
   * edita; dice qué campo de `Car` cambia al moverla. */
  editableRating?: EditableRatingField;
  /** Presente cuando el sumando se normaliza de forma independiente antes
   * de combinarse contra el conjunto de candidatos (ejes sin migrar).
   * Ausente cuando el sumando es una magnitud que se combina en crudo antes
   * de la única normalización del eje, o cuando el eje puntúa contra una
   * escala absoluta (`scale`). */
  normalization?: Normalization;
  /** Presente cuando el sumando se puntúa contra una escala absoluta fija,
   * ya migrada por su spec de eje. */
  scale?: AbsoluteScale;
}

export interface AxisBreakdown {
  axisId: AxisId;
  label: string;
  formulaDescription: string;
  inputs: InputDatum[];
  assumptionsUsed: AssumptionEcho[];
  /** Información del coche que el desglose muestra sin que entre en la
   * nota — por ejemplo, la extensión de garantía condicionada que
   * `fiabilidad` declara pero no puntúa (product/0007, requisito 4).
   * Distinta de `assumptionsUsed`: esto no es un supuesto global, es un
   * dato propio del coche. */
  info?: AssumptionEcho[];
  /** Ejes simples: su única normalización. */
  normalization?: Normalization;
  /** Unidad del valor crudo del eje y de los extremos de su normalización.
   * Sin ella la interfaz no puede saber que el crudo de `coste` son euros. */
  rawUnit?: string;
  /** Ejes compuestos: una normalización por sumando (requisito 7). */
  subcomponents?: SubcomponentBreakdown[];
  /** 0-10, ya combinado si el eje es compuesto, antes de penalizaciones. */
  rawScore: number;
  penalties: PenaltyLine[];
  weight: number;
  /** rawScore + penalizaciones, acotado a 0-10. */
  score: number;
  /** score × weight. La suma de aportaciones de los siete ejes reproduce el total. */
  contribution: number;
}

export interface CarScoreBreakdown {
  carId: string;
  carName: string;
  overBudget: boolean;
  axes: AxisBreakdown[];
  total: number;
  /** `total` como porcentaje de la puntuación máxima posible con los pesos
   * vigentes —`10 × Σ pesos`—, para que la fila del ranking muestre un techo
   * fijo en vez de una suma que solo se puede comparar contra sí misma
   * (product/0009, requisito 3). 0 cuando todos los pesos están a 0, en vez
   * de dividir por cero. */
  percentage: number;
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
