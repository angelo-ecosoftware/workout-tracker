import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockServerCache: Record<string, { data: any; expiresAt: number }> = {};

function deleteCachedScraperResult(cacheKey: string): boolean {
  if (mockServerCache[cacheKey]) {
    delete mockServerCache[cacheKey];
    return true;
  }
  return false;
}

function purgeExpiredCache(now: number = Date.now()): number {
  let purgedCount = 0;
  for (const key of Object.keys(mockServerCache)) {
    if (mockServerCache[key].expiresAt <= now) {
      delete mockServerCache[key];
      purgedCount++;
    }
  }
  return purgedCount;
}

describe('Server Scraper Cache Deletion & Memory Resource Management', () => {
  beforeEach(() => {
    mockServerCache = {
      'ah_wi123': { data: { name: 'Kipfilet' }, expiresAt: Date.now() + 60000 },
      'dirk_104': { data: { name: 'Volkoren Brood' }, expiresAt: Date.now() - 1000 },
      'plus_555': { data: { name: 'Kwark' }, expiresAt: Date.now() - 5000 },
    };
    vi.clearAllMocks();
  });

  it('1. Deletes specific cached scraper result on explicit cache invalidation request', () => {
    const deleted = deleteCachedScraperResult('ah_wi123');
    expect(deleted).toBe(true);
    expect(mockServerCache['ah_wi123']).toBeUndefined();
  });

  it('2. Returns false when attempting to delete non-existent cache key', () => {
    const deleted = deleteCachedScraperResult('non_existent_key');
    expect(deleted).toBe(false);
  });

  it('3. Automatically sweeps and purges expired scraper cache entries', () => {
    const purgedCount = purgeExpiredCache();
    expect(purgedCount).toBe(2);
    expect(Object.keys(mockServerCache)).toHaveLength(1);
    expect(mockServerCache['ah_wi123']).toBeDefined();
  });
});
