import { useEffect, useRef, useState } from 'react';
import primitives from '../primitives.module.css';
import styles from './ConfigActions.module.css';

interface ConfigActionsProps {
  shareUrl: () => string;
  onReset: () => void;
}

const COPIED_LABEL_MS = 2000;

/**
 * El enlace no se genera solo (product/0012, requisito 6): se copia con
 * una acción explícita, aquí, nunca reescribiendo la URL en cada cambio.
 */
export function ConfigActions({ shareUrl, onReset }: ConfigActionsProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

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
      {copied && (
        <span role="status" className={primitives.visuallyHidden}>
          Enlace copiado al portapapeles
        </span>
      )}
    </div>
  );
}
