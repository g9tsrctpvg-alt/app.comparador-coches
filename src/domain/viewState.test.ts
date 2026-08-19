import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  VIEW_STATE_VERSION,
  defaultViewState,
  restoreViewState,
} from './viewState';

const ENTITIES = new Set([
  'kia-ev3',
  'bmw-x1-xdrive25e',
  'alfa-romeo-giulietta',
]);
const DEFAULT_COMPARISON_ID = 'alfa-romeo-giulietta';

function validRaw(overrides: Record<string, unknown> = {}) {
  return {
    version: VIEW_STATE_VERSION,
    comparisonId: 'kia-ev3',
    fieldSet: 'completa',
    sortCriterion: 'priceEur',
    photoView: 'rear',
    focusedId: 'bmw-x1-xdrive25e',
    ...overrides,
  };
}

describe('defaultViewState', () => {
  it('uses the given id as the default comparison and null for the rest', () => {
    const state = defaultViewState(DEFAULT_COMPARISON_ID);
    expect(state).toEqual({
      version: VIEW_STATE_VERSION,
      comparisonId: DEFAULT_COMPARISON_ID,
      fieldSet: 'esenciales',
      sortCriterion: 'lengthMm',
      photoView: 'side',
      focusedId: null,
    });
  });

  it('accepts null when there is no reference to default to', () => {
    expect(defaultViewState(null).comparisonId).toBeNull();
  });
});

describe('restoreViewState', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the view state unchanged when everything is valid', () => {
    const result = restoreViewState(
      validRaw(),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.discardedEntirely).toBe(false);
    expect(result.viewState).toEqual({
      version: VIEW_STATE_VERSION,
      comparisonId: 'kia-ev3',
      fieldSet: 'completa',
      sortCriterion: 'priceEur',
      photoView: 'rear',
      focusedId: 'bmw-x1-xdrive25e',
    });
  });

  it('discards a non-object entirely and logs the reason', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(
      'not an object',
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.discardedEntirely).toBe(true);
    expect(result.viewState).toEqual(defaultViewState(DEFAULT_COMPARISON_ID));
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('view_state_discarded');
    expect(logged.Attributes.reason).toBe('not_an_object');
  });

  it('discards null entirely', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(null, ENTITIES, DEFAULT_COMPARISON_ID);
    expect(result.discardedEntirely).toBe(true);
  });

  it('discards an unknown version entirely and logs the reason', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(
      validRaw({ version: 999 }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.discardedEntirely).toBe(true);
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Attributes.reason).toBe('unknown_version');
  });

  it('discards a view state with no version field at all', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { version: _version, ...withoutVersion } = validRaw();
    const result = restoreViewState(
      withoutVersion,
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.discardedEntirely).toBe(true);
  });

  it('falls back to the default field set and logs when the value is not one of the two', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(
      validRaw({ fieldSet: 'todo' }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.fieldSet).toBe('esenciales');
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('view_state_field_discarded');
    expect(logged.Attributes.field).toBe('fieldSet');
  });

  it('keeps the default field set silently when the field is simply absent', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { fieldSet: _fieldSet, ...withoutFieldSet } = validRaw();
    const result = restoreViewState(
      withoutFieldSet,
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.fieldSet).toBe('esenciales');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('falls back to the default sort criterion and logs when unknown', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(
      validRaw({ sortCriterion: 'weight' }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.sortCriterion).toBe('lengthMm');
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Attributes.field).toBe('sortCriterion');
  });

  it('falls back to the default photo view and logs when unknown', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(
      validRaw({ photoView: 'top' }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.photoView).toBe('side');
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Attributes.field).toBe('photoView');
  });

  it('keeps a comparisonId that is in the catalog', () => {
    const result = restoreViewState(
      validRaw({ comparisonId: 'bmw-x1-xdrive25e' }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.comparisonId).toBe('bmw-x1-xdrive25e');
  });

  it('distinguishes an explicit "Ninguno" (null) from an absent field', () => {
    const result = restoreViewState(
      validRaw({ comparisonId: null }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.comparisonId).toBeNull();
  });

  it('falls back to the default comparison and logs when the id is not in the catalog', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(
      validRaw({ comparisonId: 'renault-clio' }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.comparisonId).toBe(DEFAULT_COMPARISON_ID);
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('view_state_entity_discarded');
    expect(logged.Attributes.field).toBe('comparisonId');
    expect(logged.Attributes['entity.id']).toBe('renault-clio');
  });

  it('falls back to the default comparison and logs when the id is not a string', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(
      validRaw({ comparisonId: 42 }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.comparisonId).toBe(DEFAULT_COMPARISON_ID);
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('view_state_field_discarded');
    expect(logged.Attributes.field).toBe('comparisonId');
  });

  it('keeps the default comparison silently when the field is simply absent', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { comparisonId: _comparisonId, ...withoutComparisonId } = validRaw();
    const result = restoreViewState(
      withoutComparisonId,
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.comparisonId).toBe(DEFAULT_COMPARISON_ID);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('keeps a focusedId that is in the catalog', () => {
    const result = restoreViewState(
      validRaw({ focusedId: 'kia-ev3' }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.focusedId).toBe('kia-ev3');
  });

  it('falls back to null and logs when the focused id is not in the catalog', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreViewState(
      validRaw({ focusedId: 'renault-clio' }),
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.focusedId).toBeNull();
    const logged = JSON.parse(errorSpy.mock.calls[0]?.[0] as string);
    expect(logged.Body).toBe('view_state_entity_discarded');
    expect(logged.Attributes.field).toBe('focusedId');
  });

  it('keeps null focusedId silently when the field is simply absent', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { focusedId: _focusedId, ...withoutFocusedId } = validRaw();
    const result = restoreViewState(
      withoutFocusedId,
      ENTITIES,
      DEFAULT_COMPARISON_ID,
    );
    expect(result.viewState.focusedId).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
