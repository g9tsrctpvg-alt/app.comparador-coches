import { useEffect, useState } from 'react';

export const EXPLICACION_HASH = '#/como-se-calcula';
export const FICHA_HASH = '#/ficha';
/** Alias hacia `FICHA_HASH` (product/0018, requisito 1.3): las rutas de las
 * dos fichas que existían antes de la fusión siguen resolviendo a la misma
 * vista, para que ningún enlace ya compartido deje de llevar a algo. */
export const FICHA_TECNICA_HASH = '#/ficha-tecnica';
export const FICHA_COMPLETA_HASH = '#/ficha-completa';
/** El índice de la hoja de visita (product/0037, requisito 5.1). La hoja de
 * un coche concreto es `${VISITA_HASH}/<carId>`, sin una constante propia:
 * se construye y se lee con `visitaHashFor`/`visitaCarIdFromHash`. */
export const VISITA_HASH = '#/visita';
const VISITA_CAR_PREFIX = `${VISITA_HASH}/`;

export type Route = 'comparativa' | 'explicacion' | 'ficha' | 'visita';

function routeFromHash(hash: string): Route {
  if (hash === EXPLICACION_HASH) return 'explicacion';
  if (
    hash === FICHA_HASH ||
    hash === FICHA_TECNICA_HASH ||
    hash === FICHA_COMPLETA_HASH
  ) {
    return 'ficha';
  }
  if (hash === VISITA_HASH || hash.startsWith(VISITA_CAR_PREFIX)) {
    return 'visita';
  }
  return 'comparativa';
}

/** El enlace a la hoja de visita de un coche concreto. */
export function visitaHashFor(carId: string): string {
  return `${VISITA_CAR_PREFIX}${encodeURIComponent(carId)}`;
}

/** El `carId` de la hoja de visita vigente, o `null` en el índice —o en
 * cualquier otra ruta—. */
export function visitaCarIdFromHash(hash: string): string | null {
  if (!hash.startsWith(VISITA_CAR_PREFIX)) return null;
  const carId = hash.slice(VISITA_CAR_PREFIX.length);
  return carId.length > 0 ? decodeURIComponent(carId) : null;
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

/** El `carId` de la hoja de visita vigente (product/0037, requisito 5.1):
 * `null` en el índice, en cualquier otra ruta, o si la app no está montada
 * en un navegador real. Reactivo al mismo `hashchange` que `useHashRoute`,
 * pero es un hook aparte porque no toda vista necesita saberlo. */
export function useVisitaCarId(): string | null {
  const [carId, setCarId] = useState<string | null>(() =>
    visitaCarIdFromHash(currentHash()),
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => setCarId(visitaCarIdFromHash(currentHash()));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return carId;
}
