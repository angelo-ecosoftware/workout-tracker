import { describe, expect, it } from 'vitest';
import {
  getCollectionScrollKey,
  readCollectionScroll,
  saveCollectionScroll,
} from '../../../src/utils/routeContinuity.ts';

const memoryStorage = new Map<string, string>();
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => memoryStorage.set(key, value),
  },
});

describe('route continuity storage', () => {
  it('scopes collection positions by user, collection, and context', () => {
    expect(getCollectionScrollKey('user-a', 'logbook', 'recent')).toBe('route_scroll_user-a_logbook_recent');
    expect(getCollectionScrollKey('user-a', 'logbook', 'recent')).not.toBe(
      getCollectionScrollKey('user-b', 'logbook', 'recent')
    );
  });

  it('ignores corrupt positions and restores valid positions', () => {
    sessionStorage.setItem('route_scroll_user-a_logbook_default', '{bad');
    expect(readCollectionScroll('user-a', 'logbook', 'default')).toBeNull();
    saveCollectionScroll('user-a', 'logbook', 'default', 321);
    expect(readCollectionScroll('user-a', 'logbook', 'default')).toBe(321);
  });
});
