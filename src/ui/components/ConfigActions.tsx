import { useEffect, useRef, useState } from 'react';
import primitives from '../primitives.module.css';
import styles from './ConfigActions.module.css';

interface ConfigActionsProps {
  shareUrl: () => string;
  onReset: () => void;
  /** «Borrar decisiones» (product/0030, requisito 3.6): acción propia,
   * separada de «Restablecer», que ya no las toca (requisito 3.5). Solo
   * aparece cuando hay al menos una decisión registrada. */
  decisionCount: number;
  onClearDecisions: () => void;
  /** «Borrar pruebas» (product/0037, requisito 3.5), mismo criterio que
   * «Borrar decisiones»: acción propia, separada de «Restablecer», que
   * tampoco toca el registro de pruebas. Solo aparece con al menos una
   * prueba registrada. */
  testDriveCount: number;
  onClearTestDrives: () => void;
}

const COPIED_LABEL_MS = 2000;

/**
 * El enlace no se genera solo (product/0012, requisito 6): se copia con
 * una acción explícita, aquí, nunca reescribiendo la URL en cada cambio.
 */
export function ConfigActions({
  shareUrl,
  onReset,
  decisionCount,
  onClearDecisions,
  testDriveCount,
  onClearTestDrives,
}: ConfigActionsProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  function handleClearDecisions() {
    const noun =
      decisionCount === 1 ? 'decisión registrada' : 'decisiones registradas';
    const confirmed = window.confirm(
      `Se van a borrar ${decisionCount} ${noun}. Esta acción no se puede deshacer. ¿Continuar?`,
    );
    if (confirmed) onClearDecisions();
  }

  function handleClearTestDrives() {
    const noun =
      testDriveCount === 1 ? 'prueba registrada' : 'pruebas registradas';
    const confirmed = window.confirm(
      `Se van a borrar ${testDriveCount} ${noun}. Esta acción no se puede deshacer. ¿Continuar?`,
    );
    if (confirmed) onClearTestDrives();
  }

  async function handleCopy() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), COPIED_LABEL_MS);
    } catch {
      // Sin Clipboard API (contexto no seguro, permiso denegado) no hay
      // nada que hacer: no es un error que el usuario deba ver, y el
      // enlace se sigue pudiendo generar y copiar a mano desde la barra.
    }
  }

  return (
    <div className={styles.actions}>
      <button type="button" className={styles.button} onClick={handleCopy}>
        {copied ? 'Enlace copiado' : 'Copiar enlace'}
      </button>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          setCopied(false);
          onReset();
        }}
      >
        Restablecer valores por defecto
      </button>
      {decisionCount > 0 && (
        <button
          type="button"
          className={styles.button}
          onClick={handleClearDecisions}
        >
          Borrar decisiones
        </button>
      )}
      {testDriveCount > 0 && (
        <button
          type="button"
          className={styles.button}
          onClick={handleClearTestDrives}
        >
          Borrar pruebas
        </button>
      )}
      {copied && (
        <span role="status" className={primitives.visuallyHidden}>
          Enlace copiado al portapapeles
        </span>
      )}
    </div>
  );
}
