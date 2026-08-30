import type { DecisionState } from '../../domain/decisions';
import { DECISION_LABELS } from '../decisionLabels';
import styles from './DecisionMark.module.css';

interface DecisionMarkProps {
  state: DecisionState;
}

/** La marca del estado de decisión (product/0030, requisitos 5.1, 5.3 y
 * 5.4): nada para `undecided` —el ruido visual se reserva a lo que sí se
 * ha decidido, que es lo que se busca de un vistazo— y para los otros dos,
 * su rótulo de texto siempre, nunca solo color: la deuda de paleta de
 * `technical/0011` (contraste par a par en visión con deficiencia de
 * color) lo exige más todavía para un significado nuevo. */
export function DecisionMark({ state }: DecisionMarkProps) {
  if (state === 'undecided') return null;
  return (
    <span
      className={
        state === 'shortlist' ? styles.markShortlist : styles.markDiscarded
      }
    >
      {DECISION_LABELS[state]}
    </span>
  );
}
