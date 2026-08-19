import type { AppConfig } from '../domain/config';
import type { ViewState } from '../domain/viewState';
import { logError } from '../logging/logger';

/**
 * El adaptador que lee y escribe en `localStorage` (product/0012, requisito
 * 16; ampliado por product/0024, requisito 15): el puerto que `src/domain/`
 * declara con sus formas de datos (`AppConfig`, `ViewState`) pero no
 * conoce. `src/domain/` no importa este módulo —lo comprueba
 * `.dependency-cruiser.mjs`— así que no conoce `window` ni `localStorage`
 * de forma transitiva. Dos claves independientes, un solo módulo: ninguna
 * de las dos se lee ni se escribe desde ningún otro sitio.
 */

const CONFIG_STORAGE_KEY = 'comparador-coches:config';
const VIEW_STATE_STORAGE_KEY = 'comparador-coches:view';

// Si el almacenamiento no está disponible, se registra una vez por carga
// de página —no una vez por clave ni una vez por intento (product/0012,
// requisito 15; product/0024, requisito 14)—, así que la marca es una sola
// para las dos claves.
let hasLoggedUnavailable = false;

function logUnavailableOnce(): void {
  if (hasLoggedUnavailable) return;
  hasLoggedUnavailable = true;
  logError('config_storage_unavailable');
}

/** `undefined` cubre dos casos que a quien llama le dan el mismo trato —no
 * hay nada que restaurar—: no hay nada guardado, o el almacenamiento no
 * está disponible. El JSON corrupto es distinto: si se llega a leer pero no
 * parsea, se propaga como el objeto original para que quien restaure lo
 * descarte y lo registre con ese motivo, no con «no disponible». */
function loadRaw(key: string): unknown {
  // `renderToStaticMarkup` (los tests de `src/ui/`) corre en Node, sin
  // `window`: no es almacenamiento no disponible, es que no hay navegador,
  // y no es un evento que merezca registrarse.
  if (typeof window === 'undefined') return undefined;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    logUnavailableOnce();
    return undefined;
  }
  if (raw === null) return undefined;

  try {
    return JSON.parse(raw);
  } catch {
    // JSON corrupto: no es "no disponible", es un dato inválido. Se
    // devuelve tal cual (una cadena, no un objeto) para que quien restaure
    // lo vea como no restaurable y lo registre.
    return raw;
  }
}

function saveRaw(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    logUnavailableOnce();
  }
}

function clearRaw(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    logUnavailableOnce();
  }
}

export function loadRawConfig(): unknown {
  return loadRaw(CONFIG_STORAGE_KEY);
}

export function saveConfig(config: AppConfig): void {
  saveRaw(CONFIG_STORAGE_KEY, config);
}

export function clearConfig(): void {
  clearRaw(CONFIG_STORAGE_KEY);
}

export function loadRawViewState(): unknown {
  return loadRaw(VIEW_STATE_STORAGE_KEY);
}

export function saveViewState(viewState: ViewState): void {
  saveRaw(VIEW_STATE_STORAGE_KEY, viewState);
}

export function clearViewState(): void {
  clearRaw(VIEW_STATE_STORAGE_KEY);
}
