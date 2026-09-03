import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeUser, saveUserMetrics } from '../../../src/lib/db/users.ts';
import { UserProfile, UserMetrics } from '../../../src/models.ts';

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
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'Database failure', code: '500' } });
        let res = [...mockUsersDb];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        return Promise.resolve({ data: res[0] || null, error: null });
      }),
      upsert: vi.fn((payload: any) => {
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'Database failure', code: '500' } });
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockUsersDb.findIndex((r) => r.user_id === item.user_id);
          if (idx >= 0) mockUsersDb[idx] = { ...mockUsersDb[idx], ...item, updated_at: new Date().toISOString() };
          else mockUsersDb.push({ ...item, created_at: item.created_at || new Date().toISOString() });
        });
        return Promise.resolve({ data: items, error: null });
      }),
      update: vi.fn((patch: any) => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'Database failure', code: '500' } });
          const idx = mockUsersDb.findIndex((r) => r[field] === val);
          if (idx >= 0) {
            mockUsersDb[idx] = { ...mockUsersDb[idx], ...patch, updated_at: new Date().toISOString() };
            return Promise.resolve({ data: mockUsersDb[idx], error: null });
          }
          return Promise.resolve({ data: null, error: { message: 'Not found', code: '404' } });
        },
      })),
      delete: vi.fn(() => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'Database failure', code: '500' } });
          mockUsersDb = mockUsersDb.filter((r) => r[field] !== val);
          return Promise.resolve({ data: null, error: null });
        },
      })),
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

describe('Happy Path User Forms: Onboarding, Profile Edits & Metric Capture', () => {
  beforeEach(() => {
    mockUsersDb = [];
    shouldFailDb = false;
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Form 1: User Profile Initial Setup', () => {
    it('populates default profile parameters on first registration', async () => {
      const profile = await initializeUser('usr_happy_1', 'athlete1@test.com', 'Alex Rivers');

      expect(profile.userId).toBe('usr_happy_1');
      expect(profile.email).toBe('athlete1@test.com');
      expect(profile.name).toBe('Alex Rivers');
      expect(profile.lastCompletedWorkoutOrder).toBe(0);
      expect(profile.maxWorkoutOrder).toBe(3);
      expect(profile.lastSetSummaryPerExercise).toEqual({});
    });
  });

  describe('Form 2: Biometric & Preference Settings Form', () => {
    it('persists structured body metrics and goals', async () => {
      await initializeUser('usr_happy_2', 'athlete2@test.com', 'Sam Strong');

      const onboardingData: UserMetrics = {
        gender: 'male',
        fitnessLevel: 'intermediate',
        trainingLocation: 'gym',
        goals: ['hypertrophy', 'strength'],
        height: 182,
        weight: 81.5,
        bodyMeasurementsNotes: 'Targeting 85kg lean mass',
      };

      await saveUserMetrics('usr_happy_2', onboardingData);

      expect(mockUsersDb[0].metrics).toEqual(onboardingData);
      const cached = JSON.parse(localStorage.getItem('user_metrics_usr_happy_2') || '{}');
      expect(cached.goals).toContain('hypertrophy');
      expect(cached.height).toBe(182);
    });
  });

  describe('Form 3: Profile Settings Update Form', () => {
    it('modifies training location and fitness level preferences dynamically', async () => {
      await initializeUser('usr_happy_3', 'athlete3@test.com', 'Jordan Lee');

      const initialMetrics: UserMetrics = {
        fitnessLevel: 'beginner',
        trainingLocation: 'home',
        goals: ['endurance'],
      };
      await saveUserMetrics('usr_happy_3', initialMetrics);

      const updatedMetrics: UserMetrics = {
        fitnessLevel: 'advanced',
        trainingLocation: 'hybrid',
        goals: ['strength', 'hypertrophy'],
        weight: 78.0,
      };
      await saveUserMetrics('usr_happy_3', updatedMetrics);

      expect(mockUsersDb[0].metrics.fitnessLevel).toBe('advanced');
      expect(mockUsersDb[0].metrics.trainingLocation).toBe('hybrid');
      expect(mockUsersDb[0].metrics.weight).toBe(78.0);
    });
  });
});
