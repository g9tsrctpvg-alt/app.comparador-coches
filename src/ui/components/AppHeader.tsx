import type { Route } from '../useHashRoute';
import { ViewSwitcher } from './ViewSwitcher';
import styles from './AppHeader.module.css';

interface AppHeaderProps {
  route: Route;
}

/**
 * La cabecera única de la aplicación (technical/0005, requisitos 4.1-4.4):
 * la marca y la navegación, fijas al desplazar y con fondo opaco. Antes de
 * esto, `<h1>Comparador de coches</h1>` se repetía en cada página como si
 * fuera el título de la vista; ahora la marca vive aquí una sola vez y cada
 * página deja su `<h1>` para lo que de verdad cambia entre vistas.
 */
export function AppHeader({ route }: AppHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a href="#" className={styles.brand}>
          Comparador de coches
        </a>
        <ViewSwitcher route={route} />
      </div>
    </header>
  );
}
