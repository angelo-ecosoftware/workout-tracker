import { beforeEach, describe, expect, it } from 'vitest';
import { readStoredJson } from '../../src/utils/safeStorage.ts';

describe('safe storage reads', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the fallback when stored JSON is corrupted', () => {
    localStorage.setItem('corrupted-preference', '{not-valid-json');

    expect(readStoredJson('corrupted-preference', { enabled: false })).toEqual({ enabled: false });
  });
});
