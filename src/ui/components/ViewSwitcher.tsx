import {
  FICHA_COMPLETA_HASH,
  FICHA_TECNICA_HASH,
  type Route,
} from '../useHashRoute';
import styles from './ViewSwitcher.module.css';

interface ViewSwitcherProps {
  route: Route;
}

const LINKS: { route: Route; href: string; label: string }[] = [
  { route: 'comparativa', href: '#', label: 'Clasificación' },
  { route: 'ficha-tecnica', href: FICHA_TECNICA_HASH, label: 'Ficha técnica' },
  {
    route: 'ficha-completa',
    href: FICHA_COMPLETA_HASH,
    label: 'Ficha completa',
  },
];

/** El conmutador entre las tres vistas (product/0013, requisito 1; ampliado
 * por product/0014): la vista activa se señala visualmente —el trazo bajo
 * el texto— y de forma accesible, con `aria-current`. */
export function ViewSwitcher({ route }: ViewSwitcherProps) {
  return (
    <nav aria-label="Vista" className={styles.switcher}>
      {LINKS.map((link) => {
        const active = link.route === route;
        return (
          <a
            key={link.route}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={active ? styles.active : styles.link}
          >
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
