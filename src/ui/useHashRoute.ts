import { useEffect, useState } from 'react';

export const EXPLICACION_HASH = '#/como-se-calcula';
export const FICHA_TECNICA_HASH = '#/ficha-tecnica';
export const FICHA_COMPLETA_HASH = '#/ficha-completa';

export type Route =
  'comparativa' | 'explicacion' | 'ficha-tecnica' | 'ficha-completa';

function routeFromHash(hash: string): Route {
  if (hash === EXPLICACION_HASH) return 'explicacion';
  if (hash === FICHA_TECNICA_HASH) return 'ficha-tecnica';
  if (hash === FICHA_COMPLETA_HASH) return 'ficha-completa';
  return 'comparativa';
}

/** `renderToStaticMarkup` —lo que usan los tests de `src/ui/`— corre en
 * Node, sin `window`. La app real siempre lo tiene; esto solo hace que la
 * misma función sirva en los dos sitios. */
function currentHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash;
}

/** Navegación por fragmento de URL (product/0011, requisito 1): sin
 * enrutador, que sería una dependencia nueva, y sin las rutas reales que
 * darían 404 al recargar bajo el subpath de GitHub Pages. */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => routeFromHash(currentHash()));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => setRoute(routeFromHash(currentHash()));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
}
