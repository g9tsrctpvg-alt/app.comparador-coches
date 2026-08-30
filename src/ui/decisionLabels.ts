import type { DecisionFilter, DecisionState } from '../domain/decisions';

/** El rótulo legible de cada estado (product/0030): mismo criterio que
 * `TECHNOLOGY_LABELS` — el identificador va en inglés en el dominio, la
 * etiqueta es cosa de la interfaz. */
export const DECISION_LABELS: Record<DecisionState, string> = {
  undecided: 'Sin decidir',
  shortlist: 'Lista corta',
  discarded: 'Descartado',
};

export const DECISION_FILTER_LABELS: Record<DecisionFilter, string> = {
  all: 'Todos',
  'no-discarded': 'Sin descartados',
  'shortlist-only': 'Solo lista corta',
};
