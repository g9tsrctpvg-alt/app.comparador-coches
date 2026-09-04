import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  InvalidTestDriveDateError,
  InvalidTestDriveRatingError,
  TEST_DRIVE_LOG_VERSION,
  answeredCount,
  averageRating,
  clearJudgement,
  defaultTestDriveLog,
  entryOf,
  isTested,
  judgementValue,
  restoreTestDriveLog,
  setJudgement,
  setNotes,
  setTestDriveDate,
} from './testDrives';

const CARS = new Set(['kia-ev3', 'bmw-x1-xdrive25e']);

function validRaw(overrides: Record<string, unknown> = {}) {
  return {
    version: TEST_DRIVE_LOG_VERSION,
    entries: {
      'kia-ev3': {
        ratings: { posture: 4, noise: 3 },
        date: '2026-09-01',
      },
    },
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

describe('isTested / entryOf / judgementValue / answeredCount', () => {
  it('reads a car with no entry as untested, with every judgement neutral (requisito 1.7, ADR 0012)', () => {
    const log = defaultTestDriveLog();
    expect(isTested(log, 'kia-ev3')).toBe(false);
    expect(entryOf(log, 'kia-ev3')).toBeUndefined();
    expect(judgementValue(entryOf(log, 'kia-ev3'), 'posture')).toBe(3);
    expect(answeredCount(entryOf(log, 'kia-ev3'))).toBe(0);
    expect(averageRating(entryOf(log, 'kia-ev3'))).toBe(3);
  });

  it('reads a partial entry with the neutral filled in for the rest (requisito 1.6)', () => {
    const log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'posture',
      5,
      '2026-09-01',
    );
    expect(isTested(log, 'kia-ev3')).toBe(true);
    expect(answeredCount(entryOf(log, 'kia-ev3'))).toBe(1);
    expect(judgementValue(entryOf(log, 'kia-ev3'), 'posture')).toBe(5);
    expect(judgementValue(entryOf(log, 'kia-ev3'), 'noise')).toBe(3);
    // (5 + 3 + 3 + 3 + 3) / 5 = 3.4
    expect(averageRating(entryOf(log, 'kia-ev3'))).toBeCloseTo(3.4);
  });

  it('a car with all five answered has no neutral left to fill', () => {
    let log = defaultTestDriveLog();
    const values = {
      posture: 5,
      noise: 1,
      visibility: 4,
      rearSeats: 2,
      boot: 5,
    } as const;
    for (const [judgement, value] of Object.entries(values)) {
      log = setJudgement(
        log,
        'kia-ev3',
        judgement as keyof typeof values,
        value,
        '2026-09-01',
      );
    }
    expect(answeredCount(entryOf(log, 'kia-ev3'))).toBe(5);
    expect(averageRating(entryOf(log, 'kia-ev3'))).toBeCloseTo(
      (5 + 1 + 4 + 2 + 5) / 5,
    );
  });
});

describe('setJudgement', () => {
  it('creates the entry with `today` as its date when none existed', () => {
    const log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-09-01',
    );
    expect(entryOf(log, 'kia-ev3')).toEqual({
      ratings: { noise: 2 },
      date: '2026-09-01',
    });
  });

  it('keeps the existing date, notes and other judgements when only one changes', () => {
    let log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-08-20',
    );
    log = setNotes(log, 'kia-ev3', 'ruido raro', '2026-08-20');
    const next = setJudgement(log, 'kia-ev3', 'posture', 5, '2026-09-01');
    expect(entryOf(next, 'kia-ev3')).toEqual({
      ratings: { noise: 2, posture: 5 },
      notes: 'ruido raro',
      date: '2026-08-20',
    });
  });

  it('rejects a rating outside 1-5', () => {
    expect(() =>
      setJudgement(defaultTestDriveLog(), 'kia-ev3', 'noise', 6, '2026-09-01'),
    ).toThrow(InvalidTestDriveRatingError);
    expect(() =>
      setJudgement(defaultTestDriveLog(), 'kia-ev3', 'noise', 0, '2026-09-01'),
    ).toThrow(InvalidTestDriveRatingError);
    expect(() =>
      setJudgement(
        defaultTestDriveLog(),
        'kia-ev3',
        'noise',
        2.5,
        '2026-09-01',
      ),
    ).toThrow(InvalidTestDriveRatingError);
  });

  it('does not disturb another car already in the log', () => {
    const log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-09-01',
    );
    const next = setJudgement(log, 'bmw-x1-xdrive25e', 'boot', 4, '2026-09-01');
    expect(entryOf(next, 'kia-ev3')?.ratings).toEqual({ noise: 2 });
    expect(entryOf(next, 'bmw-x1-xdrive25e')?.ratings).toEqual({ boot: 4 });
  });
});

describe('clearJudgement', () => {
  it('removes a single judgement, leaving the rest and the date intact', () => {
    let log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-09-01',
    );
    log = setJudgement(log, 'kia-ev3', 'posture', 5, '2026-09-01');
    const next = clearJudgement(log, 'kia-ev3', 'noise');
    expect(entryOf(next, 'kia-ev3')).toEqual({
      ratings: { posture: 5 },
      date: '2026-09-01',
    });
  });

  it('is a no-op on a car with no entry', () => {
    const log = defaultTestDriveLog();
    const next = clearJudgement(log, 'kia-ev3', 'noise');
    expect(next.entries).toEqual({});
  });

  it('removes the whole entry when it was the last judgement and there is no note', () => {
    const log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-09-01',
    );
    const next = clearJudgement(log, 'kia-ev3', 'noise');
    expect(entryOf(next, 'kia-ev3')).toBeUndefined();
  });

  it('keeps the entry, with empty ratings, when a note survives the last judgement', () => {
    let log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-09-01',
    );
    log = setNotes(log, 'kia-ev3', 'una nota', '2026-09-01');
    const next = clearJudgement(log, 'kia-ev3', 'noise');
    expect(entryOf(next, 'kia-ev3')).toEqual({
      ratings: {},
      notes: 'una nota',
      date: '2026-09-01',
    });
  });
});

describe('setNotes', () => {
  it('creates the entry with `today` as its date when none existed', () => {
    const log = setNotes(
      defaultTestDriveLog(),
      'kia-ev3',
      'el maletero es hondo',
      '2026-09-01',
    );
    expect(entryOf(log, 'kia-ev3')).toEqual({
      ratings: {},
      notes: 'el maletero es hondo',
      date: '2026-09-01',
    });
  });

  it('creates no entry at all for a blank note when none existed: nothing to save', () => {
    const log = setNotes(defaultTestDriveLog(), 'kia-ev3', '   ', '2026-09-01');
    expect(entryOf(log, 'kia-ev3')).toBeUndefined();
  });

  it('trims the note', () => {
    const trimmed = setNotes(
      defaultTestDriveLog(),
      'kia-ev3',
      '  con espacios  ',
      '2026-09-01',
    );
    expect(entryOf(trimmed, 'kia-ev3')?.notes).toBe('con espacios');
  });

  it('removes the entry entirely when its only note is cleared and it has no ratings', () => {
    const log = setNotes(
      defaultTestDriveLog(),
      'kia-ev3',
      'una nota',
      '2026-09-01',
    );
    const next = setNotes(log, 'kia-ev3', '   ', '2026-09-01');
    expect(entryOf(next, 'kia-ev3')).toBeUndefined();
  });

  it('keeps the entry, dropping only the note, when ratings remain after clearing it', () => {
    const log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-08-20',
    );
    const withNote = setNotes(log, 'kia-ev3', 'una nota', '2026-08-20');
    const next = setNotes(withNote, 'kia-ev3', '   ', '2026-08-20');
    expect(entryOf(next, 'kia-ev3')).toEqual({
      ratings: { noise: 2 },
      date: '2026-08-20',
    });
  });

  it('keeps the existing ratings and date when only the note changes', () => {
    const log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-08-20',
    );
    const next = setNotes(log, 'kia-ev3', 'nota nueva', '2026-09-01');
    expect(next.entries['kia-ev3']).toEqual({
      ratings: { noise: 2 },
      notes: 'nota nueva',
      date: '2026-08-20',
    });
  });
});

describe('setTestDriveDate', () => {
  it('changes the date of an existing entry', () => {
    const log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-08-20',
    );
    const next = setTestDriveDate(log, 'kia-ev3', '2026-09-01');
    expect(entryOf(next, 'kia-ev3')?.date).toBe('2026-09-01');
  });

  it('is a no-op on a car with no entry', () => {
    const log = defaultTestDriveLog();
    const next = setTestDriveDate(log, 'kia-ev3', '2026-09-01');
    expect(next.entries).toEqual({});
  });

  it('rejects a string with the right shape but no real day (requisito 1.8)', () => {
    const log = setJudgement(
      defaultTestDriveLog(),
      'kia-ev3',
      'noise',
      2,
      '2026-08-20',
    );
    expect(() => setTestDriveDate(log, 'kia-ev3', '2026-02-30')).toThrow(
      InvalidTestDriveDateError,
    );
    expect(() => setTestDriveDate(log, 'kia-ev3', '30-08-2026')).toThrow(
      InvalidTestDriveDateError,
    );
  });
});

describe('restoreTestDriveLog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the log unchanged when everything is valid', () => {
    const result = restoreTestDriveLog(validRaw(), CARS);
    expect(result.discardedEntirely).toBe(false);
    expect(result.testDriveLog).toEqual({
      version: TEST_DRIVE_LOG_VERSION,
      entries: {
        'kia-ev3': { ratings: { posture: 4, noise: 3 }, date: '2026-09-01' },
      },
    });
  });

  it('keeps a valid note', () => {
    const result = restoreTestDriveLog(
      validRaw({
        entries: {
          'kia-ev3': {
            ratings: { posture: 4 },
            date: '2026-09-01',
            notes: 'buen maletero',
          },
        },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toEqual({
      ratings: { posture: 4 },
      date: '2026-09-01',
      notes: 'buen maletero',
    });
  });

  it('discards a non-object entirely and logs the reason', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog('not an object', CARS);
    expect(result.discardedEntirely).toBe(true);
    expect(result.testDriveLog).toEqual(defaultTestDriveLog());
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('test_drive_log_discarded');
    expect(logged.Attributes.reason).toBe('not_an_object');
  });

  it('discards null entirely', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(null, CARS);
    expect(result.discardedEntirely).toBe(true);
  });

  it('discards an unknown version entirely and logs it', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(validRaw({ version: 999 }), CARS);
    expect(result.discardedEntirely).toBe(true);
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Attributes.reason).toBe('unknown_version');
    expect(logged.Attributes['test_drive_log.version']).toBe('999');
  });

  it('discards a log with no version field at all', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { version: _version, ...withoutVersion } = validRaw();
    const result = restoreTestDriveLog(withoutVersion, CARS);
    expect(result.discardedEntirely).toBe(true);
  });

  it('keeps an empty entries object silently when entries is simply absent (requisito 3.3)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { entries: _entries, ...withoutEntries } = validRaw();
    const result = restoreTestDriveLog(withoutEntries, CARS);
    expect(result.testDriveLog.entries).toEqual({});
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('discards entries entirely and logs when present but not an object', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(validRaw({ entries: 'nope' }), CARS);
    expect(result.testDriveLog.entries).toEqual({});
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('test_drive_log_discarded');
    expect(logged.Attributes.reason).toBe('entries_not_an_object');
  });

  it('discards a single entry that is not an object, keeping the rest', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(
      validRaw({
        entries: {
          'kia-ev3': 'nope',
          'bmw-x1-xdrive25e': { ratings: { boot: 4 }, date: '2026-09-01' },
        },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toBeUndefined();
    expect(result.testDriveLog.entries['bmw-x1-xdrive25e']).toEqual({
      ratings: { boot: 4 },
      date: '2026-09-01',
    });
    const logged = loggedCalls(errorSpy).find(
      (entry) => entry.Attributes.reason === 'not_an_object',
    )!;
    expect(logged.Body).toBe('test_drive_entry_discarded');
    expect(logged.Attributes['car.id']).toBe('kia-ev3');
  });

  it('discards an entry with an invalid date entirely', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(
      validRaw({
        entries: {
          'kia-ev3': { ratings: { posture: 4 }, date: '2026-02-30' },
        },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toBeUndefined();
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('test_drive_entry_discarded');
    expect(logged.Attributes.reason).toBe('invalid_date');
  });

  it('discards a single invalid rating, keeping the entry and the rest of its ratings (requisito 3.3)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(
      validRaw({
        entries: {
          'kia-ev3': {
            ratings: { posture: 4, noise: 9 },
            date: '2026-09-01',
          },
        },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toEqual({
      ratings: { posture: 4 },
      date: '2026-09-01',
    });
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('test_drive_rating_discarded');
    expect(logged.Attributes['car.id']).toBe('kia-ev3');
    expect(logged.Attributes.judgement).toBe('noise');
  });

  it('discards a rating that is not a number', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(
      validRaw({
        entries: {
          'kia-ev3': { ratings: { posture: '4' }, date: '2026-09-01' },
        },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toEqual({
      ratings: {},
      date: '2026-09-01',
    });
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('test_drive_rating_discarded');
  });

  it('discards only the ratings, keeping the entry, when ratings is present but not an object', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(
      validRaw({
        entries: { 'kia-ev3': { ratings: 'nope', date: '2026-09-01' } },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toEqual({
      ratings: {},
      date: '2026-09-01',
    });
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('test_drive_ratings_discarded');
    expect(logged.Attributes.reason).toBe('ratings_not_an_object');
  });

  it('keeps an entry with ratings simply absent', () => {
    const result = restoreTestDriveLog(
      validRaw({ entries: { 'kia-ev3': { date: '2026-09-01' } } }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toEqual({
      ratings: {},
      date: '2026-09-01',
    });
  });

  it('discards an entry whose note is present but fails the schema', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(
      validRaw({
        entries: {
          'kia-ev3': {
            ratings: { posture: 4 },
            date: '2026-09-01',
            notes: 42,
          },
        },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toBeUndefined();
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('test_drive_entry_discarded');
    expect(logged.Attributes.reason).toBe('invalid_notes');
  });

  it('never logs the content of a note written by the user (requisito 9.1)', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const secret = 'una-nota-que-no-debe-salir-en-los-logs';
    // La fecha es inválida a propósito: descarta la entrada entera, con una
    // nota bien formada dentro que nunca debería aparecer en lo registrado.
    const result = restoreTestDriveLog(
      validRaw({
        entries: {
          'kia-ev3': {
            ratings: {},
            date: 'not-a-date',
            notes: secret,
          },
        },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['kia-ev3']).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    for (const call of errorSpy.mock.calls) {
      expect(call[0]).not.toContain(secret);
    }
  });

  it('discards an entry for a car outside the current catalogue', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = restoreTestDriveLog(
      validRaw({
        entries: {
          'coche-descatalogado': { ratings: {}, date: '2026-09-01' },
        },
      }),
      CARS,
    );
    expect(result.testDriveLog.entries['coche-descatalogado']).toBeUndefined();
    const logged = loggedCalls(errorSpy)[0]!;
    expect(logged.Body).toBe('test_drive_entry_discarded');
    expect(logged.Attributes.reason).toBe('car_not_in_catalog');
  });
});
