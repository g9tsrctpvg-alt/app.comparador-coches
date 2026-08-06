import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../domain/config';
import { DEFAULT_CONFIG } from '../domain/config';

function fakeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    _map: map,
  };
}

describe('localStorageConfigPort', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('returns undefined when window is not defined (SSR/tests)', async () => {
    const { loadRawConfig } = await import('./localStorageConfigPort');
    expect(loadRawConfig()).toBeUndefined();
  });

  it('saveConfig and clearConfig are no-ops when window is not defined', async () => {
    const { saveConfig, clearConfig } =
      await import('./localStorageConfigPort');
    expect(() => saveConfig(DEFAULT_CONFIG)).not.toThrow();
    expect(() => clearConfig()).not.toThrow();
  });

  describe('with a working localStorage', () => {
    beforeEach(() => {
      vi.stubGlobal('window', { localStorage: fakeStorage() });
    });

    it('returns undefined when nothing is stored', async () => {
      const { loadRawConfig } = await import('./localStorageConfigPort');
      expect(loadRawConfig()).toBeUndefined();
    });

    it('saves and loads a config as parsed JSON', async () => {
      const { saveConfig, loadRawConfig } =
        await import('./localStorageConfigPort');
      const config: AppConfig = { ...DEFAULT_CONFIG, budgetEur: 30000 };
      saveConfig(config);
      expect(loadRawConfig()).toEqual(config);
    });

    it('clears what was saved', async () => {
      const { saveConfig, clearConfig, loadRawConfig } =
        await import('./localStorageConfigPort');
      saveConfig(DEFAULT_CONFIG);
      clearConfig();
      expect(loadRawConfig()).toBeUndefined();
    });

    it('returns the raw corrupt string when the stored value is not valid JSON', async () => {
      const storage = fakeStorage();
      storage.setItem('comparador-coches:config', '{not valid json');
      vi.stubGlobal('window', { localStorage: storage });
      const { loadRawConfig } = await import('./localStorageConfigPort');
      expect(loadRawConfig()).toBe('{not valid json');
    });
  });

  describe('with an unavailable localStorage', () => {
    function throwingStorage() {
      return {
        getItem: () => {
          throw new Error('denied');
        },
        setItem: () => {
          throw new Error('denied');
        },
        removeItem: () => {
          throw new Error('denied');
        },
      };
    }

    it('load, save and clear degrade silently and log the reason once, not per call', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('window', { localStorage: throwingStorage() });
      const { loadRawConfig, saveConfig, clearConfig } =
        await import('./localStorageConfigPort');

      expect(loadRawConfig()).toBeUndefined();
      expect(() => saveConfig(DEFAULT_CONFIG)).not.toThrow();
      expect(() => clearConfig()).not.toThrow();

      expect(errorSpy).toHaveBeenCalledTimes(1);
      const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
      expect(logged.Body).toBe('config_storage_unavailable');

      errorSpy.mockRestore();
    });
  });
});
