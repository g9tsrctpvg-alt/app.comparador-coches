import {
  EXPLICACION_HASH,
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
  { route: 'explicacion', href: EXPLICACION_HASH, label: 'Cómo se calcula' },
];

/** La navegación única de la aplicación (technical/0005, requisito 4.3;
 * origen en product/0013, requisito 1, ampliado por product/0014): la vista
 * activa se señala visualmente —el trazo bajo el texto— y de forma
 * accesible, con `aria-current`. Vive dentro de `AppHeader`, que es quien
 * decide el resto de la cabecera —la marca, el fondo fijo—; este componente
 * solo sabe de destinos y de cuál está activo. */
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
