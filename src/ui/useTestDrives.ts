import { useCallback, useEffect, useState } from 'react';
import {
  clearJudgement as clearJudgementEntry,
  defaultTestDriveLog,
  restoreTestDriveLog,
  setJudgement as setJudgementEntry,
  setNotes as setNotesEntry,
  setTestDriveDate as setTestDriveDateEntry,
  type TestDriveJudgement,
  type TestDriveLog,
} from '../domain/testDrives';
import {
  clearTestDrives,
  loadRawTestDrives,
  saveTestDrives,
} from '../adapters/localStorageConfigPort';

/** Precedencia: solo hay una fuente, lo guardado localmente, y los valores
 * por defecto — igual que `useDecisions`. El registro de pruebas no viaja
 * en ningún enlace (product/0037, requisito 3.4). */
function resolveInitialTestDriveLog(
  validCarIds: ReadonlySet<string>,
): TestDriveLog {
  const storedRaw = loadRawTestDrives();
  if (storedRaw !== undefined) {
    const { testDriveLog, discardedEntirely } = restoreTestDriveLog(
      storedRaw,
      validCarIds,
    );
    if (!discardedEntirely) return testDriveLog;
  }
  return defaultTestDriveLog();
}

/** La fecha la aporta quien llama, no el dominio (requisito 1.8): aquí, no
 * en `src/domain/testDrives.ts`, que no conoce el reloj. */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UseTestDrivesResult {
  testDriveLog: TestDriveLog;
  setJudgement: (
    carId: string,
    judgement: TestDriveJudgement,
    value: number,
  ) => void;
  clearJudgement: (carId: string, judgement: TestDriveJudgement) => void;
  setNotes: (carId: string, notes: string) => void;
  setTestDriveDate: (carId: string, date: string) => void;
  /** Vacía el registro entero (requisito 3.6, «Borrar pruebas»). Distinta
   * de «Restablecer» (product/0012), que no la toca. */
  clearAllTestDrives: () => void;
  hasTestDrives: boolean;
}

/**
 * El registro de pruebas reales (product/0037), persistido aparte de
 * `AppConfig`, `ViewState` y `DecisionLog`: cuarta clave, versión propia.
 * Se instancia en `App.tsx`, no dentro de una vista concreta, con el mismo
 * criterio que `useDecisions`: la hoja de visita y el desglose del eje
 * `prueba` leen y editan el mismo registro.
 */
export function useTestDrives(
  validCarIds: ReadonlySet<string>,
): UseTestDrivesResult {
  const [testDriveLog, setTestDriveLog] = useState<TestDriveLog>(() =>
    resolveInitialTestDriveLog(validCarIds),
  );

  useEffect(() => {
    saveTestDrives(testDriveLog);
  }, [testDriveLog]);

  const setJudgement = useCallback(
    (carId: string, judgement: TestDriveJudgement, value: number) => {
      setTestDriveLog((prev) =>
        setJudgementEntry(prev, carId, judgement, value, todayIso()),
      );
    },
    [],
  );

  const clearJudgement = useCallback(
    (carId: string, judgement: TestDriveJudgement) => {
      setTestDriveLog((prev) => clearJudgementEntry(prev, carId, judgement));
    },
    [],
  );

  const setNotes = useCallback((carId: string, notes: string) => {
    setTestDriveLog((prev) => setNotesEntry(prev, carId, notes, todayIso()));
  }, []);

  const setTestDriveDate = useCallback((carId: string, date: string) => {
    setTestDriveLog((prev) => setTestDriveDateEntry(prev, carId, date));
  }, []);

  const clearAllTestDrives = useCallback(() => {
    clearTestDrives();
    setTestDriveLog(defaultTestDriveLog());
  }, []);

  return {
    testDriveLog,
    setJudgement,
    clearJudgement,
    setNotes,
    setTestDriveDate,
    clearAllTestDrives,
    hasTestDrives: Object.keys(testDriveLog.entries).length > 0,
  };
}
