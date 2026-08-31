import { describe, expect, it } from 'vitest';
import { configToParams, paramsToRawConfig } from './configUrl';
import {
  CONFIG_VERSION,
  DEFAULT_CONFIG,
  restoreConfig,
  type AppConfig,
} from './config';
import { DEFAULT_WEIGHTS } from './scoring/weights';

const CARS = new Set(['kia-ev3']);

describe('configToParams', () => {
  it('produces no parameters at all for the default configuration', () => {
    const params = configToParams(DEFAULT_CONFIG);
    expect(Array.from(params.keys())).toEqual([]);
    expect(params.toString()).toBe('');
  });

  it('produces exactly one parameter for a single changed weight, not all seven', () => {
    const params = configToParams({
      ...DEFAULT_CONFIG,
      weights: { ...DEFAULT_WEIGHTS, carga: 7 },
    });
    const keys = Array.from(params.keys());
    expect(keys).toContain('w_carga');
    expect(keys.filter((k) => k.startsWith('w_'))).toHaveLength(1);
  });

  it('includes the version whenever any other parameter is present', () => {
    const params = configToParams({
      ...DEFAULT_CONFIG,
      weights: { ...DEFAULT_WEIGHTS, carga: 7 },
    });
    expect(params.get('v')).toBe(String(CONFIG_VERSION));
  });

  it('encodes a changed assumption', () => {
    const params = configToParams({
      ...DEFAULT_CONFIG,
      assumptions: { ...DEFAULT_CONFIG.assumptions, cargaEnCasa: true },
    });
    expect(params.get('a_cargaEnCasa')).toBe('1');
  });

  it('encodes a changed budget', () => {
    const params = configToParams({ ...DEFAULT_CONFIG, budgetEur: 30000 });
    expect(params.get('budget')).toBe('30000');
  });

  it('encodes hideFailingRules only when true', () => {
    const params = configToParams({
      ...DEFAULT_CONFIG,
      hideFailingRules: true,
    });
    expect(params.get('hideFailingRules')).toBe('1');
  });

  it('encodes an eliminatory rule as field=operator:value', () => {
    const params = configToParams({
      ...DEFAULT_CONFIG,
      eliminatoryRules: [{ field: 'trunkLiters', operator: 'min', value: 500 }],
    });
    expect(params.get('r_trunkLiters')).toBe('min:500');
  });

  it('produces no r_ parameter at all with an empty rule list', () => {
    const params = configToParams(DEFAULT_CONFIG);
    expect(Array.from(params.keys()).some((k) => k.startsWith('r_'))).toBe(
      false,
    );
  });

  it('encodes a rating override with car id and field in the parameter name', () => {
    const params = configToParams({
      ...DEFAULT_CONFIG,
      overrides: { 'kia-ev3': { aestheticsExterior: 4 } },
    });
    expect(params.get('o_kia-ev3_aestheticsExterior')).toBe('4');
  });
});

describe('paramsToRawConfig', () => {
  it('returns undefined for an empty URL: no configuration to restore', () => {
    expect(paramsToRawConfig(new URLSearchParams(''))).toBeUndefined();
  });

  it('round-trips a single changed weight through configToParams and restoreConfig', () => {
    const original = {
      ...DEFAULT_CONFIG,
      weights: { ...DEFAULT_WEIGHTS, carga: 8 },
    };
    const params = configToParams(original);
    const raw = paramsToRawConfig(params);
    const { config, discardedEntirely } = restoreConfig(raw, CARS);
    expect(discardedEntirely).toBe(false);
    expect(config.weights).toEqual(original.weights);
  });

  it('migrates a legacy w_viaje link (product/0033, requisito 5.5): splits it evenly', () => {
    const raw = paramsToRawConfig(new URLSearchParams('w_viaje=7&v=2'));
    const { config, discardedEntirely } = restoreConfig(raw, CARS);
    expect(discardedEntirely).toBe(false);
    expect(config.version).toBe(CONFIG_VERSION);
    expect(config.weights.carga).toBe(3.5);
    expect(config.weights.habitabilidad).toBe(3.5);
  });

  it('never emits w_viaje for a new link: only w_carga and w_habitabilidad', () => {
    const params = configToParams({
      ...DEFAULT_CONFIG,
      weights: { ...DEFAULT_WEIGHTS, carga: 3, habitabilidad: 8 },
    });
    expect(params.has('w_viaje')).toBe(false);
    expect(params.get('w_carga')).toBe('3');
    expect(params.get('w_habitabilidad')).toBe('8');
  });

  it('round-trips a numeric assumption', () => {
    const original = {
      ...DEFAULT_CONFIG,
      assumptions: { ...DEFAULT_CONFIG.assumptions, kmPorAnio: 25000 },
    };
    const raw = paramsToRawConfig(configToParams(original));
    const { config } = restoreConfig(raw, CARS);
    expect(config.assumptions.kmPorAnio).toBe(25000);
  });

  it('round-trips a boolean assumption', () => {
    const original = {
      ...DEFAULT_CONFIG,
      assumptions: { ...DEFAULT_CONFIG.assumptions, pensandoVender: true },
    };
    const raw = paramsToRawConfig(configToParams(original));
    const { config } = restoreConfig(raw, CARS);
    expect(config.assumptions.pensandoVender).toBe(true);
  });

  it('round-trips the budget', () => {
    const original = { ...DEFAULT_CONFIG, budgetEur: 60000 };
    const raw = paramsToRawConfig(configToParams(original));
    const { config } = restoreConfig(raw, CARS);
    expect(config.budgetEur).toBe(60000);
  });

  it('round-trips hideFailingRules', () => {
    const original = { ...DEFAULT_CONFIG, hideFailingRules: true };
    const raw = paramsToRawConfig(configToParams(original));
    const { config } = restoreConfig(raw, CARS);
    expect(config.hideFailingRules).toBe(true);
  });

  it('round-trips an eliminatory rule', () => {
    const original: AppConfig = {
      ...DEFAULT_CONFIG,
      eliminatoryRules: [{ field: 'trunkLiters', operator: 'min', value: 500 }],
    };
    const raw = paramsToRawConfig(configToParams(original));
    const { config } = restoreConfig(raw, CARS);
    expect(config.eliminatoryRules).toEqual(original.eliminatoryRules);
  });

  it('round-trips two rules on different fields, each independently', () => {
    const original: AppConfig = {
      ...DEFAULT_CONFIG,
      eliminatoryRules: [
        { field: 'trunkLiters', operator: 'min', value: 500 },
        { field: 'lengthMm', operator: 'max', value: 4600 },
      ],
    };
    const raw = paramsToRawConfig(configToParams(original));
    const { config } = restoreConfig(raw, CARS);
    expect(config.eliminatoryRules).toHaveLength(2);
    expect(config.eliminatoryRules).toEqual(
      expect.arrayContaining([...original.eliminatoryRules]),
    );
  });

  it('ignores a malformed rule parameter with no operator separator', () => {
    const raw = paramsToRawConfig(
      new URLSearchParams('r_trunkLiters=500&v=2'),
    ) as { eliminatoryRules: unknown[] };
    expect(raw.eliminatoryRules).toEqual([]);
  });

  it('round-trips an override', () => {
    const original = {
      ...DEFAULT_CONFIG,
      overrides: { 'kia-ev3': { aestheticsInterior: 5 } },
    };
    const raw = paramsToRawConfig(configToParams(original));
    const { config } = restoreConfig(raw, CARS);
    expect(config.overrides).toEqual(original.overrides);
  });

  it('ignores a malformed override parameter with no field separator', () => {
    const raw = paramsToRawConfig(
      new URLSearchParams('o_noseparator=4&v=1'),
    ) as { overrides: Record<string, unknown> };
    expect(raw.overrides).toEqual({});
  });

  it('yields version undefined when the URL has no v parameter', () => {
    const raw = paramsToRawConfig(new URLSearchParams('w_viaje=7')) as {
      version: unknown;
    };
    expect(raw.version).toBeUndefined();
  });
});
