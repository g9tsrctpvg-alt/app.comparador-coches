import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  CONFIG_VERSION,
  DEFAULT_BUDGET_EUR,
  DEFAULT_CONFIG,
  restoreConfig,
} from './config';
import { DEFAULT_WEIGHTS } from './scoring/weights';
import { DEFAULT_ASSUMPTIONS } from './scoring/assumptions';

const CARS = new Set(['kia-ev3', 'bmw-x1-xdrive25e']);

function validRaw(overrides: Record<string, unknown> = {}) {
  return {
    version: CONFIG_VERSION,
    weights: DEFAULT_WEIGHTS,
    assumptions: DEFAULT_ASSUMPTIONS,
    budgetEur: DEFAULT_BUDGET_EUR,
    hideOverBudget: false,
    overrides: {},
    ...overrides,
  };
}

describe('restoreConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the config unchanged when everything is valid', () => {
    const raw = validRaw({
      weights: { ...DEFAULT_WEIGHTS, viaje: 7 },
      budgetEur: 30000,
      hideOverBudget: true,
    });
    const result = restoreConfig(raw, CARS);
    expect(result.discardedEntirely).toBe(false);
    expect(result.config.weights.viaje).toBe(7);
    expect(result.config.budgetEur).toBe(30000);
    expect(result.config.hideOverBudget).toBe(true);
  });

  it('discards a non-object entirely and logs the reason', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig('not an object', CARS);
    expect(result.discardedEntirely).toBe(true);
    expect(result.config).toEqual(DEFAULT_CONFIG);
    expect(errorSpy).toHaveBeenCalled();
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('config_discarded');
    expect(logged.Attributes.reason).toBe('not_an_object');
  });

  it('discards null entirely', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(null, CARS);
    expect(result.discardedEntirely).toBe(true);
  });

  it('discards an unknown version entirely and logs the reason', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(validRaw({ version: 999 }), CARS);
    expect(result.discardedEntirely).toBe(true);
    expect(result.config).toEqual(DEFAULT_CONFIG);
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Attributes.reason).toBe('unknown_version');
  });

  it('discards a config with no version field at all', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { version: _version, ...withoutVersion } = validRaw();
    const result = restoreConfig(withoutVersion, CARS);
    expect(result.discardedEntirely).toBe(true);
  });

  it('falls back to default weights and logs when weights are present but invalid', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(validRaw({ weights: { viaje: 99 } }), CARS);
    expect(result.discardedEntirely).toBe(false);
    expect(result.config.weights).toEqual(DEFAULT_WEIGHTS);
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('config_field_discarded');
    expect(logged.Attributes.field).toBe('weights');
  });

  it('keeps default weights silently when the field is simply absent', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { weights: _weights, ...withoutWeights } = validRaw();
    const result = restoreConfig(withoutWeights, CARS);
    expect(result.config.weights).toEqual(DEFAULT_WEIGHTS);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('falls back to default assumptions and logs when invalid', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(
      validRaw({ assumptions: { ...DEFAULT_ASSUMPTIONS, kmPorAnio: -5 } }),
      CARS,
    );
    expect(result.config.assumptions).toEqual(DEFAULT_ASSUMPTIONS);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('falls back to the default budget and logs when out of range', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(validRaw({ budgetEur: 1 }), CARS);
    expect(result.config.budgetEur).toBe(DEFAULT_BUDGET_EUR);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('falls back to hideOverBudget=false and logs when not a boolean', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(validRaw({ hideOverBudget: 'yes' }), CARS);
    expect(result.config.hideOverBudget).toBe(false);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('keeps a valid rating override', () => {
    const result = restoreConfig(
      validRaw({ overrides: { 'kia-ev3': { aestheticsExterior: 4 } } }),
      CARS,
    );
    expect(result.config.overrides).toEqual({
      'kia-ev3': { aestheticsExterior: 4 },
    });
  });

  it('discards only the out-of-range rating, keeping the rest of the same car override', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(
      validRaw({
        overrides: {
          'kia-ev3': { aestheticsExterior: 9, travelComfort: 3 },
        },
      }),
      CARS,
    );
    expect(result.config.overrides).toEqual({
      'kia-ev3': { travelComfort: 3 },
    });
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('config_rating_discarded');
    expect(logged.Attributes.field).toBe('aestheticsExterior');
  });

  it('drops a car override entirely when every one of its ratings is invalid', () => {
    const result = restoreConfig(
      validRaw({ overrides: { 'kia-ev3': { aestheticsExterior: 0 } } }),
      CARS,
    );
    expect(result.config.overrides).toEqual({});
  });

  it('discards an override for a car that is not in the catalog', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(
      validRaw({
        overrides: { 'renault-clio': { aestheticsExterior: 4 } },
      }),
      CARS,
    );
    expect(result.config.overrides).toEqual({});
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('config_override_discarded');
    expect(logged.Attributes.reason).toBe('car_not_in_catalog');
  });

  it('keeps overrides for cars that remain while discarding the orphaned one', () => {
    const result = restoreConfig(
      validRaw({
        overrides: {
          'kia-ev3': { aestheticsExterior: 4 },
          'renault-clio': { aestheticsExterior: 2 },
        },
      }),
      CARS,
    );
    expect(result.config.overrides).toEqual({
      'kia-ev3': { aestheticsExterior: 4 },
    });
  });

  it('discards an override that is not an object', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(
      validRaw({ overrides: { 'kia-ev3': 'not an object' } }),
      CARS,
    );
    expect(result.config.overrides).toEqual({});
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Attributes.reason).toBe('not_an_object');
  });

  it('discards the whole overrides field and logs when it is not an object', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreConfig(
      validRaw({ overrides: 'not an object' }),
      CARS,
    );
    expect(result.config.overrides).toEqual({});
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('config_field_discarded');
    expect(logged.Attributes.field).toBe('overrides');
  });

  it('keeps an empty overrides object silently when absent', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { overrides: _overrides, ...withoutOverrides } = validRaw();
    const result = restoreConfig(withoutOverrides, CARS);
    expect(result.config.overrides).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
