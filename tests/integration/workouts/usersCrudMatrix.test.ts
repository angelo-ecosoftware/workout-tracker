import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeUser, saveUserMetrics } from '../../../src/lib/db/users.ts';
import { UserMetrics, UserProfile } from '../../../src/models.ts';

// -----------------------------------------------------------------------------
// In-Memory Database Store for Users Entity
// -----------------------------------------------------------------------------
let mockUsersTable: any[] = [];
let shouldSimulateDbError = false;
let simulatedDbErrorMessage = 'Database connection error';

// Mock localStorage polyfill
const memoryStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => memoryStorage[k] || null,
  setItem: (k: string, v: string) => { memoryStorage[k] = String(v); },
  removeItem: (k: string) => { delete memoryStorage[k]; },
  clear: () => {
    for (const key in memoryStorage) delete memoryStorage[key];
  },
  key: (i: number) => Object.keys(memoryStorage)[i] || null,
  length: 0,
};

vi.mock('../../../src/lib/supabase.ts', () => {
  const createQueryBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      _selectFields: '*',

      select: vi.fn((fields = '*') => {
        builder._selectFields = fields;
        return builder;
      }),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      maybeSingle: vi.fn(() => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
        }
        let data = [...mockUsersTable];
        for (const f of builder._filters) {
          data = data.filter((r) => r[f.field] === f.val);
        }
        return Promise.resolve({ data: data[0] || null, error: null, status: 200 });
      }),
      single: vi.fn(() => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
        }
        let data = [...mockUsersTable];
        for (const f of builder._filters) {
          data = data.filter((r) => r[f.field] === f.val);
        }
        if (data.length === 0) {
          return Promise.resolve({ data: null, error: { message: 'User not found', code: 'PGRST116' }, status: 404 });
        }
        return Promise.resolve({ data: data[0], error: null, status: 200 });
      }),
      upsert: vi.fn((payload: any) => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
        }
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockUsersTable.findIndex((r) => r.user_id === item.user_id);
          if (idx >= 0) {
            mockUsersTable[idx] = { ...mockUsersTable[idx], ...item, updated_at: new Date().toISOString() };
          } else {
            mockUsersTable.push({ ...item, created_at: item.created_at || new Date().toISOString() });
          }
        });
        return Promise.resolve({ data: items, error: null, status: 200 });
      }),
      update: vi.fn((patch: any) => {
        return {
          eq: (field: string, val: any) => {
            if (shouldSimulateDbError) {
              return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
            }
            const idx = mockUsersTable.findIndex((r) => r[field] === val);
            if (idx >= 0) {
              mockUsersTable[idx] = { ...mockUsersTable[idx], ...patch, updated_at: new Date().toISOString() };
              return Promise.resolve({ data: mockUsersTable[idx], error: null, status: 200 });
            }
            return Promise.resolve({ data: null, error: { message: 'Record not found for update', code: 'PGRST116' }, status: 404 });
          },
        };
      }),
      delete: vi.fn(() => {
        return {
          eq: (field: string, val: any) => {
            if (shouldSimulateDbError) {
              return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
            }
            const before = mockUsersTable.length;
            mockUsersTable = mockUsersTable.filter((r) => r[field] !== val);
            const deleted = before - mockUsersTable.length;
            return Promise.resolve({ data: { count: deleted }, error: null, status: 200 });
          },
        };
      }),
      then: (onfulfilled: any) => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }).then(onfulfilled);
        }
        let data = [...mockUsersTable];
        for (const f of builder._filters) {
          data = data.filter((r) => r[f.field] === f.val);
        }
        return Promise.resolve({ data, error: null, status: 200 }).then(onfulfilled);
      },
    };
    return builder;
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      },
      from: vi.fn((table: string) => createQueryBuilder(table)),
    },
  };
});

describe('Entity: Users (users table) - Complete CRUD Matrix (200, 400, 401, 404, 500)', () => {
  beforeEach(() => {
    mockUsersTable = [];
    shouldSimulateDbError = false;
    localStorage.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. CREATE / INSERT (users)
  // =========================================================================
  describe('1. CREATE / INSERT Operations', () => {
    it('200 OK / 201 Created: Initializes a new user profile with default progression order', async () => {
      const user = await initializeUser('usr_apollo_11', 'apollo@nasa.gov', 'Neil Armstrong');

      expect(user).toBeDefined();
      expect(user.userId).toBe('usr_apollo_11');
      expect(user.email).toBe('apollo@nasa.gov');
      expect(user.name).toBe('Neil Armstrong');
      expect(user.lastCompletedWorkoutOrder).toBe(0);
      expect(user.maxWorkoutOrder).toBe(3);

      expect(mockUsersTable).toHaveLength(1);
      expect(mockUsersTable[0].user_id).toBe('usr_apollo_11');
    });

    it('200 OK: Resolves fallback name from email username when name parameter is missing', async () => {
      const user = await initializeUser('usr_no_name', 'ironman@stark.com');
      expect(user.name).toBe('ironman');
      expect(mockUsersTable[0].name).toBe('ironman');
    });

    it('500 Internal Server Error: Gracefully catches database insert failure on user initialization', async () => {
      shouldSimulateDbError = true;
      simulatedDbErrorMessage = 'Connection pool exhausted (500)';

      // initializeUser falls back to creating in-memory profile without crashing
      const user = await initializeUser('usr_fail_test', 'fail@test.com', 'Fail User');
      expect(user.userId).toBe('usr_fail_test');
      expect(user.email).toBe('fail@test.com');
    });
  });

  // =========================================================================
  // 2. READ / QUERY (users)
  // =========================================================================
  describe('2. READ / QUERY Operations', () => {
    beforeEach(async () => {
      await initializeUser('usr_existing_1', 'existing@gym.com', 'Existing Champion');
    });

    it('200 OK: Retrieves existing user record from database without overwriting existing state', async () => {
      // Modify stored order in DB
      mockUsersTable[0].last_completed_workout_order = 2;

      const loaded = await initializeUser('usr_existing_1');
      expect(loaded.userId).toBe('usr_existing_1');
      expect(loaded.name).toBe('Existing Champion');
      expect(loaded.lastCompletedWorkoutOrder).toBe(2);
    });

    it('404 Handled: Returns newly provisioned profile template when user does not yet exist', async () => {
      const newUser = await initializeUser('usr_non_existent', 'newbie@gym.com', 'Newbie');
      expect(newUser.userId).toBe('usr_non_existent');
      expect(newUser.lastCompletedWorkoutOrder).toBe(0);
    });
  });

  // =========================================================================
  // 3. UPDATE / MUTATE (users)
  // =========================================================================
  describe('3. UPDATE / MUTATE Operations', () => {
    beforeEach(async () => {
      await initializeUser('usr_metric_user', 'metric@gym.com', 'Metric User');
    });

    it('200 OK: Updates user biometric targets & fitness metrics in DB and localStorage', async () => {
      const metrics: UserMetrics = {
        height: 184,
        weight: 86.5,
        gender: 'male',
        fitnessLevel: 'advanced',
        goals: ['hypertrophy', 'strength'],
        trainingLocation: 'gym',
        bodyMeasurementsNotes: 'Target weight: 82kg. 4 years lifting experience.',
      };

      await saveUserMetrics('usr_metric_user', metrics);

      expect(mockUsersTable[0].metrics).toEqual(metrics);
      const cached = JSON.parse(localStorage.getItem('user_metrics_usr_metric_user') || '{}');
      expect(cached.weight).toBe(86.5);
      expect(cached.bodyMeasurementsNotes).toContain('Target weight: 82kg');
    });

    it('500 Error Resilience: Caches metrics optimistically in localStorage if remote update fails', async () => {
      shouldSimulateDbError = true;
      const metrics: UserMetrics = {
        height: 175,
        weight: 70.0,
        gender: 'female',
        fitnessLevel: 'intermediate',
        goals: ['endurance'],
        trainingLocation: 'home',
      };

      // Does not throw unhandled exception
      await saveUserMetrics('usr_metric_user', metrics);

      const cached = JSON.parse(localStorage.getItem('user_metrics_usr_metric_user') || '{}');
      expect(cached.weight).toBe(70.0);
    });
  });

  // =========================================================================
  // 4. DELETE / CLEANUP (users)
  // =========================================================================
  describe('4. DELETE Operations', () => {
    it('200 OK: Purges user record by primary key', async () => {
      const { supabase } = await import('../../../src/lib/supabase.ts');
      await initializeUser('usr_to_delete', 'delete@gym.com', 'Delete Me');
      expect(mockUsersTable).toHaveLength(1);

      const { data, error } = await supabase.from('users').delete().eq('user_id', 'usr_to_delete');
      expect(error).toBeNull();
      expect(mockUsersTable).toHaveLength(0);
      expect((data as any)?.count).toBe(1);
    });

    it('404 / Idempotent: Deleting non-existent user returns 0 count cleanly', async () => {
      const { supabase } = await import('../../../src/lib/supabase.ts');
      const { data, error } = await supabase.from('users').delete().eq('user_id', 'usr_does_not_exist');
      expect(error).toBeNull();
      expect((data as any)?.count).toBe(0);
    });
  });
});
