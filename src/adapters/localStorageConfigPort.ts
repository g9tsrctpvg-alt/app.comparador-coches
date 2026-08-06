import type { AppConfig } from '../domain/config';
import { logError } from '../logging/logger';

/**
 * El adaptador que lee y escribe la configuración en `localStorage`
 * (product/0012, requisito 16): el puerto que `src/domain/` declara con su
 * forma de datos (`AppConfig`) pero no conoce. `src/domain/` no importa
 * este módulo —lo comprueba `.dependency-cruiser.mjs`— así que no conoce
 * `window` ni `localStorage` de forma transitiva.
 */

const STORAGE_KEY = 'comparador-coches:config';

// Si el almacenamiento no está disponible, se registra una vez por carga
// de página, no en cada intento de guardar (requisito 15).
let hasLoggedUnavailable = false;

function logUnavailableOnce(): void {
  if (hasLoggedUnavailable) return;
  hasLoggedUnavailable = true;
  logError('config_storage_unavailable');
}

/** `undefined` cubre dos casos que a quien llama le dan el mismo trato —no
 * hay nada que restaurar—: no hay nada guardado, o el almacenamiento no
 * está disponible. El JSON corrupto es distinto: si se llega a leer pero no
 * parsea, se propaga como el objeto original para que `restoreConfig` lo
 * descarte y lo registre con ese motivo, no con «no disponible». */
export function loadRawConfig(): unknown {
  // `renderToStaticMarkup` (los tests de `src/ui/`) corre en Node, sin
  // `window`: no es almacenamiento no disponible, es que no hay navegador,
  // y no es un evento que merezca registrarse.
  if (typeof window === 'undefined') return undefined;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    logUnavailableOnce();
    return undefined;
  }
  if (raw === null) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    // JSON corrupto: no es "no disponible", es un dato inválido. Se
    // devuelve tal cual (una cadena, no un objeto) para que
    // `restoreConfig` lo vea como no restaurable y lo registre.
    return raw;
  }
}

export function saveConfig(config: AppConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    logUnavailableOnce();
  }
}

export function clearConfig(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    logUnavailableOnce();
  }
}
