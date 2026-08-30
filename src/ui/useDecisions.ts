import { useCallback, useEffect, useState } from 'react';
import {
  clearDecision as clearDecisionEntry,
  defaultDecisionLog,
  restoreDecisionLog,
  setDecision as setDecisionEntry,
  setDecisionFilter as setDecisionFilterEntry,
  type DecisionFilter,
  type DecisionLog,
  type StoredDecisionState,
} from '../domain/decisions';
import {
  clearDecisions,
  loadRawDecisions,
  saveDecisions,
} from '../adapters/localStorageConfigPort';

/** Precedencia: solo hay una fuente, lo guardado localmente, y los valores
 * por defecto — igual que `useViewState`. El registro de decisiones no
 * viaja en ningún enlace (product/0030, requisito 3.4). */
function resolveInitialDecisionLog(
  validCarIds: ReadonlySet<string>,
): DecisionLog {
  const storedRaw = loadRawDecisions();
  if (storedRaw !== undefined) {
    const { decisionLog, discardedEntirely } = restoreDecisionLog(
      storedRaw,
      validCarIds,
    );
    if (!discardedEntirely) return decisionLog;
  }
  return defaultDecisionLog();
}

/** La fecha la aporta quien llama, no el dominio (requisito 2.2): aquí, no
 * en `src/domain/decisions.ts`, que no conoce el reloj. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UseDecisionsResult {
  decisionLog: DecisionLog;
  setDecision: (
    carId: string,
    state: StoredDecisionState,
    reason: string | undefined,
  ) => void;
  clearDecision: (carId: string) => void;
  setDecisionFilter: (filter: DecisionFilter) => void;
  /** Vacía el registro entero, filtro incluido: deja las decisiones como si
   * nunca se hubiera anotado ninguna (requisito 3.6). Distinta de
   * «Restablecer» (product/0012, requisito 14), que **no** la toca. */
  clearAllDecisions: () => void;
  hasDecisions: boolean;
}

/**
 * El estado de decisión de cada coche (product/0030), persistido aparte de
 * `AppConfig` y de `ViewState`: tercera clave, versión propia. Se
 * instancia en `App.tsx`, no dentro de una vista concreta, porque tanto la
 * clasificación como la ficha lo leen y lo editan sobre el mismo registro
 * (requisito 6.4).
 */
export function useDecisions(
  validCarIds: ReadonlySet<string>,
): UseDecisionsResult {
  const [decisionLog, setDecisionLog] = useState<DecisionLog>(() =>
    resolveInitialDecisionLog(validCarIds),
  );

  useEffect(() => {
    saveDecisions(decisionLog);
  }, [decisionLog]);

  const setDecision = useCallback(
    (carId: string, state: StoredDecisionState, reason: string | undefined) => {
      setDecisionLog((prev) =>
        setDecisionEntry(prev, carId, state, reason, todayIso()),
      );
    },
    [],
  );

  const clearDecision = useCallback((carId: string) => {
    setDecisionLog((prev) => clearDecisionEntry(prev, carId));
  }, []);

  const setDecisionFilter = useCallback((filter: DecisionFilter) => {
    setDecisionLog((prev) => setDecisionFilterEntry(prev, filter));
  }, []);

  const clearAllDecisions = useCallback(() => {
    clearDecisions();
    setDecisionLog(defaultDecisionLog());
  }, []);

  return {
    decisionLog,
    setDecision,
    clearDecision,
    setDecisionFilter,
    clearAllDecisions,
    hasDecisions: Object.keys(decisionLog.entries).length > 0,
  };
}
