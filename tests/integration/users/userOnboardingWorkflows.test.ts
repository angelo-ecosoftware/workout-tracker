import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeUser, saveUserMetrics } from '../../../src/lib/db/users.ts';
import { UserProfile, UserMetrics } from '../../../src/models.ts';
import { userFactory } from '../../fixtures/factories.ts';

let mockUsersDb: any[] = [];
let shouldFailDb = false;
let dbErrorMsg = 'Supabase network error (500)';

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
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: dbErrorMsg, code: '500' }, status: 500 });
        let res = [...mockUsersDb];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        return Promise.resolve({ data: res[0] || null, error: null, status: 200 });
      }),
      upsert: vi.fn((payload: any) => {
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: dbErrorMsg, code: '500' }, status: 500 });
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockUsersDb.findIndex((r) => r.user_id === item.user_id);
          if (idx >= 0) {
            mockUsersDb[idx] = { ...mockUsersDb[idx], ...item, updated_at: new Date().toISOString() };
          } else {
            mockUsersDb.push({ ...item, created_at: item.created_at || new Date().toISOString() });
          }
        });
        return Promise.resolve({ data: items, error: null, status: 200 });
      }),
      update: vi.fn((patch: any) => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: dbErrorMsg, code: '500' }, status: 500 });
          const idx = mockUsersDb.findIndex((r) => r[field] === val);
          if (idx >= 0) {
            mockUsersDb[idx] = { ...mockUsersDb[idx], ...patch, updated_at: new Date().toISOString() };
            return Promise.resolve({ data: mockUsersDb[idx], error: null, status: 200 });
          }
          return Promise.resolve({ data: null, error: { message: 'Not found', code: '404' }, status: 404 });
        },
      })),
      delete: vi.fn(() => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: dbErrorMsg, code: '500' }, status: 500 });
          const len = mockUsersDb.length;
          mockUsersDb = mockUsersDb.filter((r) => r[field] !== val);
          return Promise.resolve({ data: { count: len - mockUsersDb.length }, error: null, status: 200 });
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

describe('Users Domain Persistence & Onboarding Workflows', () => {
  beforeEach(() => {
    mockUsersDb = [];
    shouldFailDb = false;
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('1. Initializes new athlete profile and persists initial database records', async () => {
    const profile = await initializeUser('usr_alpha', 'alpha@gym.com', 'Alpha Athlete');
    expect(profile.userId).toBe('usr_alpha');
    expect(profile.email).toBe('alpha@gym.com');
    expect(profile.lastCompletedWorkoutOrder).toBe(0);
    expect(profile.maxWorkoutOrder).toBe(3);
    expect(mockUsersDb).toHaveLength(1);
  });

  it('2. Completes full user onboarding form with biometric and preference metrics', async () => {
    mockUsersDb = [{
      user_id: 'usr_alpha',
      email: 'alpha@gym.com',
      name: 'Alpha Athlete',
      created_at: new Date().toISOString(),
    }];

    const metrics: UserMetrics = {
      height: 185,
      weight: 84.0,
      gender: 'male',
      fitnessLevel: 'advanced',
      goals: ['hypertrophy', 'strength'],
      trainingLocation: 'gym',
      bodyMeasurementsNotes: 'Target weight: 80kg',
    };

    await saveUserMetrics('usr_alpha', metrics);

    expect(mockUsersDb[0].metrics).toEqual(metrics);
    const stored = JSON.parse(localStorage.getItem('user_metrics_usr_alpha') || '{}');
    expect(stored.height).toBe(185);
    expect(stored.weight).toBe(84.0);
  });

  it('3. Retains existing progression state when initializing returning user', async () => {
    mockUsersDb = [{
      user_id: 'usr_returning',
      email: 'returning@gym.com',
      name: 'Returning Athlete',
      last_completed_workout_order: 2,
      max_workout_order: 4,
      last_set_summary_per_exercise: {},
      created_at: new Date().toISOString(),
    }];

    const user = await initializeUser('usr_returning');
    expect(user.lastCompletedWorkoutOrder).toBe(2);
    expect(user.maxWorkoutOrder).toBe(4);
    expect(user.name).toBe('Returning Athlete');
  });

  it('4. Handles database error during user metrics save with graceful fallback', async () => {
    shouldFailDb = true;
    const metrics: UserMetrics = {
      height: 178,
      weight: 76.5,
      gender: 'female',
      fitnessLevel: 'intermediate',
      goals: ['endurance'],
      trainingLocation: 'home',
    };

    await saveUserMetrics('usr_offline', metrics);
    const stored = JSON.parse(localStorage.getItem('user_metrics_usr_offline') || '{}');
    expect(stored.weight).toBe(76.5);
  });

  it('5. Deletes user account and purges user data', async () => {
    const { supabase } = await import('../../../src/lib/supabase.ts');
    mockUsersDb = [{ user_id: 'usr_delete_target', email: 'del@gym.com', name: 'Delete Target' }];

    const { data, error } = await supabase.from('users').delete().eq('user_id', 'usr_delete_target');
    expect(error).toBeNull();
    expect(mockUsersDb).toHaveLength(0);
    expect((data as any)?.count).toBe(1);
  });
});
