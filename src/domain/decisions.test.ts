import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DECISION_LOG_VERSION,
  clearDecision,
  decisionOf,
  defaultDecisionLog,
  entryOf,
  passesDecisionFilter,
  restoreDecisionLog,
  setDecision,
  setDecisionFilter,
  type DecisionFilter,
  type DecisionLog,
  type DecisionState,
  type StoredDecisionState,
} from './decisions';

const CARS = new Set(['kia-ev3', 'bmw-x1-xdrive25e']);

function validRaw(overrides: Record<string, unknown> = {}) {
  return {
    version: DECISION_LOG_VERSION,
    entries: {
      'kia-ev3': { state: 'shortlist', date: '2026-08-30' },
    },
    filter: 'all',
    ...overrides,
  };
}

interface LoggedEntry {
  Body: string;
  Attributes: Record<string, string>;
}

function loggedCalls(spy: ReturnType<typeof vi.spyOn>): LoggedEntry[] {
  return spy.mock.calls.map((call: unknown[]) => JSON.parse(call[0] as string));
}

describe('decisionOf / entryOf', () => {
  it('reads a car with no entry as undecided (requisito 1.3)', () => {
    const log = defaultDecisionLog();
    expect(decisionOf(log, 'kia-ev3')).toBe('undecided');
    expect(entryOf(log, 'kia-ev3')).toBeUndefined();
  });

  it('reads the stored state and entry for a car that has one', () => {
    const log: DecisionLog = {
      version: DECISION_LOG_VERSION,
      entries: { 'kia-ev3': { state: 'discarded', date: '2026-08-30' } },
      filter: 'all',
    };
    expect(decisionOf(log, 'kia-ev3')).toBe('discarded');
    expect(entryOf(log, 'kia-ev3')).toEqual({
      state: 'discarded',
      date: '2026-08-30',
    });
  });
});

describe('setDecision', () => {
  it('sets the state and the date passed in for a car with no prior entry', () => {
    const log = defaultDecisionLog();
    const next = setDecision(
      log,
      'kia-ev3',
      'shortlist',
      undefined,
      '2026-08-30',
    );
    expect(entryOf(next, 'kia-ev3')).toEqual({
      state: 'shortlist',
      date: '2026-08-30',
    });
  });

  it('keeps the existing date when only the reason changes (requisito 2.3)', () => {
    const log = setDecision(
      defaultDecisionLog(),
      'kia-ev3',
      'shortlist',
      undefined,
      '2026-08-20',
    );
    const next = setDecision(
      log,
      'kia-ev3',
      'shortlist',
      'me gusta el maletero',
      '2026-08-30',
    );
    expect(entryOf(next, 'kia-ev3')?.date).toBe('2026-08-20');
    expect(entryOf(next, 'kia-ev3')?.reason).toBe('me gusta el maletero');
  });

  it('moves the date to `today` when the state actually changes (requisito 2.3)', () => {
    const log = setDecision(
      defaultDecisionLog(),
      'kia-ev3',
      'shortlist',
      undefined,
      '2026-08-20',
    );
    const next = setDecision(
      log,
      'kia-ev3',
      'discarded',
      undefined,
      '2026-08-30',
    );
    expect(entryOf(next, 'kia-ev3')?.date).toBe('2026-08-30');
  });

  it('accepts every stored state with and without a reason (requisito 2.4)', () => {
    const states: StoredDecisionState[] = ['shortlist', 'discarded'];
    for (const state of states) {
      const withReason = setDecision(
        defaultDecisionLog(),
        'kia-ev3',
        state,
        'un motivo',
        '2026-08-30',
      );
      expect(entryOf(withReason, 'kia-ev3')).toEqual({
        state,
        date: '2026-08-30',
        reason: 'un motivo',
      });

      const withoutReason = setDecision(
        defaultDecisionLog(),
        'kia-ev3',
        state,
        undefined,
        '2026-08-30',
      );
      expect(entryOf(withoutReason, 'kia-ev3')).toEqual({
        state,
        date: '2026-08-30',
      });
    }
  });

  it('trims the reason and treats a blank one as no reason at all', () => {
    const next = setDecision(
      defaultDecisionLog(),
      'kia-ev3',
      'shortlist',
      '   ',
      '2026-08-30',
    );
    expect(entryOf(next, 'kia-ev3')).toEqual({
      state: 'shortlist',
      date: '2026-08-30',
    });

    const trimmed = setDecision(
      defaultDecisionLog(),
      'kia-ev3',
      'shortlist',
      '  con espacios  ',
      '2026-08-30',
    );
    expect(entryOf(trimmed, 'kia-ev3')?.reason).toBe('con espacios');
  });

  it('does not disturb another car already in the log', () => {
    const log = setDecision(
      defaultDecisionLog(),
      'kia-ev3',
      'shortlist',
      undefined,
      '2026-08-30',
    );
    const next = setDecision(
      log,
      'bmw-x1-xdrive25e',
      'discarded',
      undefined,
      '2026-08-30',
    );
    expect(entryOf(next, 'kia-ev3')?.state).toBe('shortlist');
    expect(entryOf(next, 'bmw-x1-xdrive25e')?.state).toBe('discarded');
  });
});

describe('clearDecision', () => {
  it('removes the entry entirely, reason and date included (requisito 2.5)', () => {
    const log = setDecision(
      defaultDecisionLog(),
      'kia-ev3',
      'discarded',
      'un motivo',
      '2026-08-30',
    );
    const next = clearDecision(log, 'kia-ev3');
    expect(decisionOf(next, 'kia-ev3')).toBe('undecided');
    expect(entryOf(next, 'kia-ev3')).toBeUndefined();
  });

  it('is a no-op on a car that had no entry', () => {
    const log = defaultDecisionLog();
    const next = clearDecision(log, 'kia-ev3');
    expect(next.entries).toEqual({});
  });
});

describe('setDecisionFilter / passesDecisionFilter', () => {
  it('sets the filter without touching the entries', () => {
    const log = setDecision(
      defaultDecisionLog(),
      'kia-ev3',
      'shortlist',
      undefined,
      '2026-08-30',
    );
    const next = setDecisionFilter(log, 'shortlist-only');
    expect(next.filter).toBe('shortlist-only');
    expect(next.entries).toEqual(log.entries);
  });

  const STATES: DecisionState[] = ['undecided', 'shortlist', 'discarded'];
  const FILTERS: DecisionFilter[] = ['all', 'no-discarded', 'shortlist-only'];
  const EXPECTED: Record<DecisionFilter, Record<DecisionState, boolean>> = {
    all: { undecided: true, shortlist: true, discarded: true },
    'no-discarded': { undecided: true, shortlist: true, discarded: false },
    'shortlist-only': { undecided: false, shortlist: true, discarded: false },
  };

  for (const filter of FILTERS) {
    for (const state of STATES) {
      it(`filter "${filter}" ${EXPECTED[filter][state] ? 'keeps' : 'drops'} a "${state}" car`, () => {
        expect(passesDecisionFilter(state, filter)).toBe(
          EXPECTED[filter][state],
        );
      });
    }
  }
});

describe('restoreDecisionLog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the log unchanged when everything is valid', () => {
    const result = restoreDecisionLog(validRaw(), CARS);
    expect(result.discardedEntirely).toBe(false);
    expect(result.decisionLog).toEqual({
      version: DECISION_LOG_VERSION,
      entries: { 'kia-ev3': { state: 'shortlist', date: '2026-08-30' } },
      filter: 'all',
    });
  });

  it('keeps a valid reason', () => {
    const result = restoreDecisionLog(
      validRaw({
        entries: {
          'kia-ev3': {
            state: 'discarded',
            date: '2026-08-30',
            reason: 'demasiado caro',
          },
        },
      }),
      CARS,
    );
    expect(result.decisionLog.entries['kia-ev3']).toEqual({
      state: 'discarded',
      date: '2026-08-30',
      reason: 'demasiado caro',
    });
  });

  it('discards a non-object entirely and logs the reason', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog('not an object', CARS);
    expect(result.discardedEntirely).toBe(true);
    expect(result.decisionLog).toEqual(defaultDecisionLog());
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('decision_log_discarded');
    expect(logged.Attributes.reason).toBe('not_an_object');
  });

  it('discards null entirely', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(null, CARS);
    expect(result.discardedEntirely).toBe(true);
  });

  it('discards an unknown version entirely and logs it', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(validRaw({ version: 999 }), CARS);
    expect(result.discardedEntirely).toBe(true);
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Attributes.reason).toBe('unknown_version');
    expect(logged.Attributes['decision_log.version']).toBe('999');
  });

  it('discards a log with no version field at all', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { version: _version, ...withoutVersion } = validRaw();
    const result = restoreDecisionLog(withoutVersion, CARS);
    expect(result.discardedEntirely).toBe(true);
  });

  it('keeps an empty entries object silently when entries is simply absent (requisito 3.3)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { entries: _entries, ...withoutEntries } = validRaw();
    const result = restoreDecisionLog(withoutEntries, CARS);
    expect(result.decisionLog.entries).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('discards entries entirely and logs when present but not an object', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(validRaw({ entries: 'nope' }), CARS);
    expect(result.decisionLog.entries).toEqual({});
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('decision_log_discarded');
    expect(logged.Attributes.reason).toBe('entries_not_an_object');
  });

  it('discards a single entry that is not an object, keeping the rest', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(
      validRaw({
        entries: {
          'kia-ev3': 'nope',
          'bmw-x1-xdrive25e': { state: 'discarded', date: '2026-08-30' },
        },
      }),
      CARS,
    );
    expect(result.decisionLog.entries['kia-ev3']).toBeUndefined();
    expect(result.decisionLog.entries['bmw-x1-xdrive25e']).toEqual({
      state: 'discarded',
      date: '2026-08-30',
    });
    const logged = loggedCalls(errorSpy).find(
      (entry) => entry.Attributes.reason === 'not_an_object',
    )!;
    expect(logged.Body).toBe('decision_entry_discarded');
    expect(logged.Attributes['car.id']).toBe('kia-ev3');
  });

  it('discards an entry with an invalid state', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(
      validRaw({
        entries: { 'kia-ev3': { state: 'candidate', date: '2026-08-30' } },
      }),
      CARS,
    );
    expect(result.decisionLog.entries['kia-ev3']).toBeUndefined();
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Attributes.reason).toBe('invalid_state');
  });

  it('discards an entry with an invalid date', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(
      validRaw({
        entries: { 'kia-ev3': { state: 'shortlist', date: '30-08-2026' } },
      }),
      CARS,
    );
    expect(result.decisionLog.entries['kia-ev3']).toBeUndefined();
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Attributes.reason).toBe('invalid_date');
  });

  it('discards an entry whose reason is present but fails the schema', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(
      validRaw({
        entries: {
          'kia-ev3': { state: 'shortlist', date: '2026-08-30', reason: 42 },
        },
      }),
      CARS,
    );
    expect(result.decisionLog.entries['kia-ev3']).toBeUndefined();
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Attributes.reason).toBe('invalid_reason');
  });

  it('never logs the content of a reason written by the user (requisito 7.1)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const secret = 'un-motivo-que-no-debe-salir-en-los-logs';
    // La fecha es inválida a propósito: descarta la entrada entera, con un
    // motivo bien formado dentro que nunca debería aparecer en lo
    // registrado — el motivo no es lo que falla.
    const result = restoreDecisionLog(
      validRaw({
        entries: {
          'kia-ev3': {
            state: 'shortlist',
            date: 'not-a-date',
            reason: secret,
          },
        },
      }),
      CARS,
    );
    expect(result.decisionLog.entries['kia-ev3']).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    for (const call of errorSpy.mock.calls) {
      expect(call[0]).not.toContain(secret);
    }
  });

  it('discards an entry for a car outside the current catalogue', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(
      validRaw({
        entries: {
          'coche-descatalogado': { state: 'shortlist', date: '2026-08-30' },
        },
      }),
      CARS,
    );
    expect(result.decisionLog.entries['coche-descatalogado']).toBeUndefined();
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('decision_entry_discarded');
    expect(logged.Attributes.reason).toBe('car_not_in_catalog');
  });

  it('falls back to "all" silently when the filter is simply absent', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { filter: _filter, ...withoutFilter } = validRaw();
    const result = restoreDecisionLog(withoutFilter, CARS);
    expect(result.decisionLog.filter).toBe('all');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('falls back to "all" and logs when the filter is present but invalid', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreDecisionLog(validRaw({ filter: 'starred' }), CARS);
    expect(result.decisionLog.filter).toBe('all');
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('decision_log_field_discarded');
    expect(logged.Attributes.field).toBe('filter');
  });
});
