import { useState, type ReactNode } from 'react';
import styles from './CollapsiblePanel.module.css';

interface CollapsiblePanelProps {
  ariaLabel: string;
  title: string;
  summary: string;
  children: ReactNode;
}

/** Los dos paneles de control del artefacto, plegables por defecto por
 * debajo de `--bp-columna` y siempre desplegados por encima (product/0010,
 * requisito 6). El estado de apertura sigue siendo real por debajo del
 * punto de ruptura — el control es alcanzable con teclado y expone
 * `aria-expanded` — aunque por encima la hoja de estilos lo ignore. */
export function CollapsiblePanel({
  ariaLabel,
  title,
  summary,
  children,
}: CollapsiblePanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <section aria-label={ariaLabel} className={styles.panel}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.heading}>{title}</span>
        <span className={open ? styles.summaryHidden : styles.summary}>
          {summary}
        </span>
      </button>
      <div className={open ? styles.contentOpen : styles.content}>
        {children}
      </div>
    </section>
  );
}
