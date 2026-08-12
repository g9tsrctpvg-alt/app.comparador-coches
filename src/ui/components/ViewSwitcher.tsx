import { EXPLICACION_HASH, FICHA_HASH, type Route } from '../useHashRoute';
import styles from './ViewSwitcher.module.css';

interface ViewSwitcherProps {
  route: Route;
}

const LINKS: { route: Route; href: string; label: string }[] = [
  { route: 'comparativa', href: '#', label: 'Clasificación' },
  { route: 'ficha', href: FICHA_HASH, label: 'Ficha' },
  { route: 'explicacion', href: EXPLICACION_HASH, label: 'Cómo se calcula' },
];

/** La navegación única de la aplicación (technical/0005, requisito 4.3;
 * origen en product/0013, requisito 1; reducida de cuatro destinos a tres
 * por product/0018, que funde las dos fichas en una): la vista activa se
 * señala visualmente —fondo de pastilla en escritorio, opción marcada en el
 * `<select>` de móvil (technical/0006)— y de forma accesible, con
 * `aria-current` en el primer caso. Vive dentro de `AppHeader`, que es
 * quien decide el resto de la cabecera —la marca, el fondo fijo—; este
 * componente solo sabe de destinos y de cuál está activo.
 *
 * Los dos marcados se renderizan siempre; cuál se ve lo decide
 * `ViewSwitcher.module.css` con `display`, a cada lado de `--bp-columna`
 * (technical/0006, requisito 3) — no hay dos componentes ni un estado de
 * React que decida entre ellos. */
export function ViewSwitcher({ route }: ViewSwitcherProps) {
  return (
    <>
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
      <select
        aria-label="Vista"
        className={styles.mobileSelect}
        value={route}
        onChange={(event) => {
          const link = LINKS.find((l) => l.route === event.target.value);
          if (link !== undefined) window.location.hash = link.href;
        }}
      >
        {LINKS.map((link) => (
          <option key={link.route} value={link.route}>
            {link.label}
          </option>
        ))}
      </select>
    </>
  );
}
