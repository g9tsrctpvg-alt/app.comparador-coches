import { FICHA_TECNICA_HASH, type Route } from '../useHashRoute';
import styles from './ViewSwitcher.module.css';

interface ViewSwitcherProps {
  route: Route;
}

/** El conmutador entre clasificación y ficha técnica (product/0013,
 * requisito 1): la vista activa se señala visualmente —el trazo bajo el
 * texto— y de forma accesible, con `aria-current`. */
export function ViewSwitcher({ route }: ViewSwitcherProps) {
  const onFichaTecnica = route === 'ficha-tecnica';

  return (
    <nav aria-label="Vista" className={styles.switcher}>
      <a
        href="#"
        aria-current={onFichaTecnica ? undefined : 'page'}
        className={onFichaTecnica ? styles.link : styles.active}
      >
        Clasificación
      </a>
      <a
        href={FICHA_TECNICA_HASH}
        aria-current={onFichaTecnica ? 'page' : undefined}
        className={onFichaTecnica ? styles.active : styles.link}
      >
        Ficha técnica
      </a>
    </nav>
  );
}
