import { useState } from 'react';
import {
  DECISION_STATES,
  type DecisionEntry,
  type DecisionState,
  type StoredDecisionState,
} from '../../domain/decisions';
import { DECISION_LABELS } from '../decisionLabels';
import primitives from '../primitives.module.css';
import styles from './DecisionEditor.module.css';

interface DecisionEditorProps {
  entry: DecisionEntry | undefined;
  onSetDecision: (
    state: StoredDecisionState,
    reason: string | undefined,
  ) => void;
  onClear: () => void;
}

/**
 * El control de edición del estado de decisión (product/0030, requisitos
 * 2.4-2.5 y 6): el mismo componente para la fila desplegada del ranking y
 * el diálogo de la ficha (requisito 6.4), sobre el mismo registro — quien
 * lo monta pasa `key={carId}` para que cambiar de coche reinicie el motivo
 * en edición en vez de arrastrar el de otro.
 *
 * Volver a «Sin decidir» borra la entrada entera (requisito 2.5): no hay
 * texto que conservar. El motivo se confirma al salir del campo, no en
 * cada pulsación, para no escribir en `localStorage` letra a letra.
 */
export function DecisionEditor({
  entry,
  onSetDecision,
  onClear,
}: DecisionEditorProps) {
  const state: DecisionState = entry?.state ?? 'undecided';
  const [reason, setReason] = useState(entry?.reason ?? '');

  function handleStateChange(next: DecisionState) {
    if (next === 'undecided') {
      onClear();
      return;
    }
    onSetDecision(next, reason || undefined);
  }

  function commitReason() {
    if (state === 'undecided') return;
    onSetDecision(state, reason || undefined);
  }

  return (
    <div className={styles.editor}>
      <label className={styles.field}>
        <span className={primitives.label}>Decisión</span>
        <select
          className={styles.select}
          value={state}
          onChange={(event) =>
            handleStateChange(event.target.value as DecisionState)
          }
        >
          {DECISION_STATES.map((option) => (
            <option key={option} value={option}>
              {DECISION_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
      {state !== 'undecided' && (
        <label className={styles.field}>
          <span className={primitives.label}>Motivo (opcional)</span>
          <input
            type="text"
            className={styles.reasonInput}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            onBlur={commitReason}
          />
        </label>
      )}
    </div>
  );
}
