import { AdjustableMark } from './AdjustableMark';
import { EstimatedMark } from './EstimatedMark';
import styles from './AppFooter.module.css';

/**
 * El pie único de la aplicación (technical/0005, requisito 4.5): la
 * procedencia y la fecha de los datos, y la leyenda de las marcas de la
 * ficha — hasta ahora repetidas al pie de cada tabla. Desde `product/0040`
 * son dos: la tilde de estimado y la flecha de magnitud ajustable, que
 * necesita la leyenda por la misma razón que la tilde (quien la ve, no la
 * oye).
 */
export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.note}>
        Los precios del catálogo son de julio de 2026. Cada magnitud de la ficha
        del modelo enlaza su fuente pública; ningún dato se calcula sin origen
        citado. La marca <EstimatedMark /> señala un dato estimado, sin fuente
        publicada verificada directamente. La marca <AdjustableMark /> señala
        una magnitud que depende de una pieza que se mueve —hoy, la banqueta
        trasera deslizante—: el valor mostrado es el máximo que ese coche puede
        dar.
      </p>
    </footer>
  );
}
