import { beforeEach, describe, expect, it } from 'vitest';
import { readStoredJson, removeStaleUserMetricCaches } from '../../src/utils/safeStorage.ts';

describe('safe storage reads', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the fallback when stored JSON is corrupted', () => {
    localStorage.setItem('corrupted-preference', '{not-valid-json');

    expect(readStoredJson('corrupted-preference', { enabled: false })).toEqual({ enabled: false });
  });

  it('keeps only the current user metrics cache', () => {
    localStorage.setItem('user_metrics_current', '{"weight":85}');
    localStorage.setItem('user_metrics_old', '{"weight":80}');

    removeStaleUserMetricCaches('current');

    expect(localStorage.getItem('user_metrics_current')).toBe('{"weight":85}');
    expect(localStorage.getItem('user_metrics_old')).toBeNull();
  });
});
