import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildErrorLogEntry, logError } from './logger';

describe('buildErrorLogEntry', () => {
  it('shapes the OTel fields with service.name and ERROR severity', () => {
    const entry = buildErrorLogEntry('catalog_load_failed', {
      'error.message': 'boom',
    });

    expect(entry.SeverityText).toBe('ERROR');
    expect(entry.SeverityNumber).toBe(17);
    expect(entry.Body).toBe('catalog_load_failed');
    expect(entry.Attributes).toEqual({ 'error.message': 'boom' });
    expect(entry.Resource).toEqual({ 'service.name': 'comparador-coches-web' });
    expect(() => new Date(entry.Timestamp).toISOString()).not.toThrow();
  });

  it('defaults to an empty attribute set', () => {
    const entry = buildErrorLogEntry('something_failed');
    expect(entry.Attributes).toEqual({});
  });
});

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the entry to console.error as a single JSON line', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('catalog_load_failed', { 'error.message': 'boom' });

    expect(spy).toHaveBeenCalledOnce();
    const [line] = spy.mock.calls[0] ?? [];
    expect(typeof line).toBe('string');
    const parsed = JSON.parse(line as string) as { Body: string };
    expect(parsed.Body).toBe('catalog_load_failed');
  });
});
