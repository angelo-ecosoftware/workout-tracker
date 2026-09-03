import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveUserMetrics, initializeUser } from '../../../src/lib/db/users.ts';
import { UserMetrics } from '../../../src/models.ts';

let mockUsersDb: any[] = [];
let shouldFailDb = false;

const memoryStore: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => memoryStore[k] || null,
  setItem: (k: string, v: string) => { memoryStore[k] = String(v); },
  removeItem: (k: string) => { delete memoryStore[k]; },
  clear: () => {
    for (const key in memoryStore) delete memoryStore[key];
  },
  key: (i: number) => Object.keys(memoryStore)[i] || null,
  length: 0,
};

vi.mock('../../../src/lib/supabase.ts', () => {
  const createBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      maybeSingle: vi.fn(() => {
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
        let res = [...mockUsersDb];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        return Promise.resolve({ data: res[0] || null, error: null });
      }),
      update: vi.fn((patch: any) => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
          const idx = mockUsersDb.findIndex((r) => r[field] === val);
          if (idx >= 0) {
            mockUsersDb[idx] = { ...mockUsersDb[idx], ...patch };
            return Promise.resolve({ data: mockUsersDb[idx], error: null });
          }
          return Promise.resolve({ data: null, error: { message: 'Not found', code: '404' } });
        },
      })),
    };
    return builder;
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      },
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

describe('User Preferences & Biometric Metrics Engine', () => {
  beforeEach(() => {
    mockUsersDb = [];
    shouldFailDb = false;
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Saves comprehensive metrics object with training goals and measurements', async () => {
    mockUsersDb = [{ user_id: 'usr_metrics_1', email: 'metrics@test.com' }];

    const metrics: UserMetrics = {
      height: 180,
      weight: 79.5,
      gender: 'male',
      fitnessLevel: 'intermediate',
      trainingLocation: 'gym',
      goals: ['hypertrophy', 'endurance'],
      bodyMeasurementsNotes: 'Targeting 12% body fat',
    };

    await saveUserMetrics('usr_metrics_1', metrics);

    expect(mockUsersDb[0].metrics).toEqual(metrics);
  });

  it('2. Retrieves user metrics with fallback to local storage when database is offline', async () => {
    shouldFailDb = true;
    const offlineMetrics: UserMetrics = {
      height: 175,
      weight: 72.0,
      fitnessLevel: 'advanced',
      trainingLocation: 'home',
      goals: ['strength'],
    };

    localStorage.setItem('user_metrics_usr_offline', JSON.stringify(offlineMetrics));

    const result = await initializeUser('usr_offline');
    expect(result.metrics).not.toBeNull();
    expect(result.metrics?.height).toBe(175);
    expect(result.metrics?.weight).toBe(72.0);
    expect(result.metrics?.goals).toContain('strength');
  });

  it('3. Supports non-binary and prefer_not_to_say gender values safely', async () => {
    mockUsersDb = [{ user_id: 'usr_gender_test', email: 'gender@test.com' }];

    const metrics: UserMetrics = {
      gender: 'prefer_not_to_say',
      fitnessLevel: 'beginner',
      trainingLocation: 'hybrid',
      goals: ['hypertrophy'],
    };

    await saveUserMetrics('usr_gender_test', metrics);
    expect(mockUsersDb[0].metrics.gender).toBe('prefer_not_to_say');
  });
});
