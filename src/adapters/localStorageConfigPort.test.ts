import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '../domain/config';
import { DEFAULT_CONFIG } from '../domain/config';
import type { ViewState } from '../domain/viewState';
import { defaultViewState } from '../domain/viewState';
import { defaultTestDriveLog, setJudgement } from '../domain/testDrives';

const SOME_VIEW_STATE: ViewState = {
  ...defaultViewState('alfa-romeo-giulietta'),
  fieldSet: 'completa',
};

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

  it('returns undefined for the view state when window is not defined (SSR/tests)', async () => {
    const { loadRawViewState } = await import('./localStorageConfigPort');
    expect(loadRawViewState()).toBeUndefined();
  });

  it('saveViewState and clearViewState are no-ops when window is not defined', async () => {
    const { saveViewState, clearViewState } =
      await import('./localStorageConfigPort');
    expect(() => saveViewState(SOME_VIEW_STATE)).not.toThrow();
    expect(() => clearViewState()).not.toThrow();
  });

  it('returns undefined for the test-drive log when window is not defined (SSR/tests)', async () => {
    const { loadRawTestDrives } = await import('./localStorageConfigPort');
    expect(loadRawTestDrives()).toBeUndefined();
  });

  it('saveTestDrives and clearTestDrives are no-ops when window is not defined', async () => {
    const { saveTestDrives, clearTestDrives } =
      await import('./localStorageConfigPort');
    expect(() => saveTestDrives(defaultTestDriveLog())).not.toThrow();
    expect(() => clearTestDrives()).not.toThrow();
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

    it('saves and loads a view state as parsed JSON, under its own key', async () => {
      const { saveViewState, loadRawViewState, saveConfig, loadRawConfig } =
        await import('./localStorageConfigPort');
      saveViewState(SOME_VIEW_STATE);
      saveConfig(DEFAULT_CONFIG);
      expect(loadRawViewState()).toEqual(SOME_VIEW_STATE);
      expect(loadRawConfig()).toEqual(DEFAULT_CONFIG);
    });

    it('clears the view state without touching the saved config', async () => {
      const {
        saveViewState,
        clearViewState,
        loadRawViewState,
        saveConfig,
        loadRawConfig,
      } = await import('./localStorageConfigPort');
      saveViewState(SOME_VIEW_STATE);
      saveConfig(DEFAULT_CONFIG);
      clearViewState();
      expect(loadRawViewState()).toBeUndefined();
      expect(loadRawConfig()).toEqual(DEFAULT_CONFIG);
    });

    it('returns the raw corrupt string when the stored view state is not valid JSON', async () => {
      const storage = fakeStorage();
      storage.setItem('comparador-coches:view', '{not valid json');
      vi.stubGlobal('window', { localStorage: storage });
      const { loadRawViewState } = await import('./localStorageConfigPort');
      expect(loadRawViewState()).toBe('{not valid json');
    });

    it('saves and loads a test-drive log as parsed JSON, under its own key', async () => {
      const { saveTestDrives, loadRawTestDrives, saveConfig, loadRawConfig } =
        await import('./localStorageConfigPort');
      const log = setJudgement(
        defaultTestDriveLog(),
        'kia-ev3',
        'noise',
        4,
        '2026-09-01',
      );
      saveTestDrives(log);
      saveConfig(DEFAULT_CONFIG);
      expect(loadRawTestDrives()).toEqual(log);
      expect(loadRawConfig()).toEqual(DEFAULT_CONFIG);
    });

    it('clears the test-drive log without touching the saved config', async () => {
      const {
        saveTestDrives,
        clearTestDrives,
        loadRawTestDrives,
        saveConfig,
        loadRawConfig,
      } = await import('./localStorageConfigPort');
      saveTestDrives(defaultTestDriveLog());
      saveConfig(DEFAULT_CONFIG);
      clearTestDrives();
      expect(loadRawTestDrives()).toBeUndefined();
      expect(loadRawConfig()).toEqual(DEFAULT_CONFIG);
    });

    it('returns the raw corrupt string when the stored test-drive log is not valid JSON', async () => {
      const storage = fakeStorage();
      storage.setItem('comparador-coches:testdrives', '{not valid json');
      vi.stubGlobal('window', { localStorage: storage });
      const { loadRawTestDrives } = await import('./localStorageConfigPort');
      expect(loadRawTestDrives()).toBe('{not valid json');
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

    it('logs once total across both storage keys, not once per key (product/0024, requirement 14)', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.stubGlobal('window', { localStorage: throwingStorage() });
      const {
        loadRawConfig,
        saveConfig,
        clearConfig,
        loadRawViewState,
        saveViewState,
        clearViewState,
      } = await import('./localStorageConfigPort');

      loadRawConfig();
      saveConfig(DEFAULT_CONFIG);
      clearConfig();
      loadRawViewState();
      saveViewState(SOME_VIEW_STATE);
      clearViewState();

      expect(errorSpy).toHaveBeenCalledTimes(1);

      errorSpy.mockRestore();
    });
  });
});
