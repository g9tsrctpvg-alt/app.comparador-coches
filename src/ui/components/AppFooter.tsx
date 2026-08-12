import { EstimatedMark } from './EstimatedMark';
import styles from './AppFooter.module.css';

/**
 * El pie único de la aplicación (technical/0005, requisito 4.5): la
 * procedencia y la fecha de los datos, y la leyenda de la marca de
 * estimado — hasta ahora repetidas al pie de cada tabla de la ficha.
 */
export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.note}>
        Los precios del catálogo son de julio de 2026. Cada magnitud de la ficha
        del modelo enlaza su fuente pública; ningún dato se calcula sin origen
        citado. La marca <EstimatedMark /> señala un dato estimado, sin fuente
        publicada verificada directamente.
      </p>
    </footer>
  );
}
