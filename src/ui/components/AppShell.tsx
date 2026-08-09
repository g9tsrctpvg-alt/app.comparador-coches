import type { ReactNode } from 'react';
import type { Route } from '../useHashRoute';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import styles from './AppShell.module.css';

interface AppShellProps {
  route: Route;
  children: ReactNode;
}

/**
 * El envoltorio único de la aplicación (technical/0005, requisito 4.1):
 * cabecera, contenedor de página y pie. Ninguna vista declara su propia
 * cabecera ni su propio ancho máximo — eso vivía copiado, literalmente,
 * en `App.tsx`, `FichaTecnicaPage.tsx` y `FichaCompletaPage.tsx`.
 */
export function AppShell({ route, children }: AppShellProps) {
  return (
    <>
      <AppHeader route={route} />
      <main className={styles.page}>{children}</main>
      <AppFooter />
    </>
  );
}
