import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_CONFIG,
  restoreConfig,
  type AppConfig,
} from '../domain/config';
import { configToParams, paramsToRawConfig } from '../domain/configUrl';
import {
  clearConfig,
  loadRawConfig,
  saveConfig,
} from '../adapters/localStorageConfigPort';
import type { AxisWeights } from '../domain/scoring/weights';
import type { GlobalAssumptions } from '../domain/scoring/assumptions';
import type { RatingOverride } from '../domain/scoring/overrides';
import type { EliminatoryRule } from '../domain/eliminatoryRules';

/** `renderToStaticMarkup` corre en Node, sin `window`; la app real siempre
 * lo tiene. Mismo patrón que `useHashRoute`. */
function currentSearch(): string {
  return typeof window === 'undefined' ? '' : window.location.search;
}

interface InitialConfig {
  config: AppConfig;
  /** Verdadero cuando la configuración inicial viene de un enlace
   * compartido: se muestra pero no se guarda hasta el primer cambio
   * (requisito 4). */
  fromLink: boolean;
}

/** Precedencia: URL > guardado localmente > valores por defecto (requisito
 * 3). Una fuente que se descarta entera —JSON corrupto, versión
 * desconocida— no cuenta como «hay configuración aquí»: se prueba la
 * siguiente. */
function resolveInitialConfig(validCarIds: ReadonlySet<string>): InitialConfig {
  const urlRaw = paramsToRawConfig(new URLSearchParams(currentSearch()));
  if (urlRaw !== undefined) {
    const { config, discardedEntirely } = restoreConfig(urlRaw, validCarIds);
    if (!discardedEntirely) return { config, fromLink: true };
  }

  const storedRaw = loadRawConfig();
  if (storedRaw !== undefined) {
    const { config, discardedEntirely } = restoreConfig(storedRaw, validCarIds);
    if (!discardedEntirely) return { config, fromLink: false };
  }

  return { config: DEFAULT_CONFIG, fromLink: false };
}

export interface UseConfigResult {
  config: AppConfig;
  setWeights: (weights: AxisWeights) => void;
  setAssumptions: (assumptions: GlobalAssumptions) => void;
  setBudgetEur: (budgetEur: number) => void;
  setEliminatoryRules: (rules: EliminatoryRule[]) => void;
  setHideFailingRules: (hideFailingRules: boolean) => void;
  setOverride: (carId: string, override: RatingOverride) => void;
  resetToDefaults: () => void;
  shareUrl: () => string;
}

/**
 * La configuración persistente y compartible (product/0012). El *wiring*
 * entre el dominio (esquema y restauración puros) y el navegador (URL,
 * `localStorage` detrás de su puerto) vive aquí, no en los componentes que
 * la editan — `App.tsx` solo consume `config` y llama a los `set*`.
 */
export function useConfig(validCarIds: ReadonlySet<string>): UseConfigResult {
  // El inicializador perezoso de `useState` corre una sola vez, en el
  // montaje, sin importar cuántas veces cambie `validCarIds` después: es
  // la vía correcta para "calcular una vez", no un ref leído en el render.
  const [initial] = useState<InitialConfig>(() =>
    resolveInitialConfig(validCarIds),
  );

  const [config, setConfig] = useState<AppConfig>(initial.config);
  // Ver una comparativa ajena es una consulta, no un cambio (requisito 4):
  // no se persiste hasta que el usuario mueve algo. A partir de ahí, esta
  // marca se queda en `true` para el resto de la sesión.
  const persistPendingRef = useRef(!initial.fromLink);

  useEffect(() => {
    if (!persistPendingRef.current) return;
    saveConfig(config);
  }, [config]);

  const setWeights = useCallback((weights: AxisWeights) => {
    persistPendingRef.current = true;
    setConfig((prev) => ({ ...prev, weights }));
  }, []);

  const setAssumptions = useCallback((assumptions: GlobalAssumptions) => {
    persistPendingRef.current = true;
    setConfig((prev) => ({ ...prev, assumptions }));
  }, []);

  const setBudgetEur = useCallback((budgetEur: number) => {
    persistPendingRef.current = true;
    setConfig((prev) => ({ ...prev, budgetEur }));
  }, []);

  const setEliminatoryRules = useCallback(
    (eliminatoryRules: EliminatoryRule[]) => {
      persistPendingRef.current = true;
      setConfig((prev) => ({ ...prev, eliminatoryRules }));
    },
    [],
  );

  const setHideFailingRules = useCallback((hideFailingRules: boolean) => {
    persistPendingRef.current = true;
    setConfig((prev) => ({ ...prev, hideFailingRules }));
  }, []);

  const setOverride = useCallback((carId: string, override: RatingOverride) => {
    persistPendingRef.current = true;
    setConfig((prev) => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [carId]: { ...prev.overrides[carId], ...override },
      },
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    // No se marca `persistPendingRef`: si se dejara en `true`, el efecto de
    // arriba volvería a escribir el propio valor por defecto justo después
    // de borrarlo. Deja la aplicación como una primera visita (requisito
    // 14) hasta el próximo cambio real, que sí vuelve a activar el guardado.
    persistPendingRef.current = false;
    clearConfig();
    setConfig(DEFAULT_CONFIG);
  }, []);

  const shareUrl = useCallback((): string => {
    const params = configToParams(config);
    const query = params.toString();
    if (typeof window === 'undefined') return query ? `?${query}` : '';
    const url = new URL(window.location.href);
    url.search = query;
    return url.toString();
  }, [config]);

  return {
    config,
    setWeights,
    setAssumptions,
    setBudgetEur,
    setEliminatoryRules,
    setHideFailingRules,
    setOverride,
    resetToDefaults,
    shareUrl,
  };
}
