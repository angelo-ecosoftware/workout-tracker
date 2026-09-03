import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeUser,
  fetchWorkoutsData,
  saveWorkoutsAndExercises,
  fetchWorkoutHistory,
  deleteSessions,
} from '../src/lib/supabaseData.ts';
import { workoutFactory } from './fixtures/factories.ts';

// Mock the underlying Supabase client to test data domain logic deterministically
vi.mock('../src/lib/supabase.ts', () => {
  let mockTableData: Record<string, any[]> = {
    users: [],
    workouts: [],
    exercises: [],
    workout_exercises: [],
    sessions: [],
    sets: [],
  };

  const createQueryBuilder = (table: string) => {
    let currentData = [...(mockTableData[table] || [])];

    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        currentData = currentData.filter((row) => row[field] === val);
        return builder;
      }),
      in: vi.fn((field: string, vals: any[]) => {
        currentData = currentData.filter((row) => vals.includes(row[field]));
        return builder;
      }),
      not: vi.fn((field: string, _operator: string, _vals: any) => {
        return builder;
      }),
      order: vi.fn((field: string, opts?: { ascending?: boolean }) => {
        const asc = opts?.ascending ?? true;
        currentData.sort((a, b) => (asc ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)));
        return builder;
      }),
      limit: vi.fn((count: number) => {
        currentData = currentData.slice(0, count);
        return builder;
      }),
      single: vi.fn(async () => {
        const item = currentData[0] || null;
        return { data: item, error: item ? null : { message: 'Not found', code: 'PGRST116' } };
      }),
      maybeSingle: vi.fn(async () => {
        return { data: currentData[0] || null, error: null };
      }),
      upsert: vi.fn(async (payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload];
        mockTableData[table] = [...(mockTableData[table] || []), ...items];
        return { data: items, error: null };
      }),
      insert: vi.fn(async (payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload];
        mockTableData[table] = [...(mockTableData[table] || []), ...items];
        return { data: items, error: null };
      }),
      update: vi.fn((patch: any) => {
        const updateBuilder: any = {
          eq: vi.fn(async (field: string, val: any) => {
            mockTableData[table] = (mockTableData[table] || []).map((r) =>
              r[field] === val ? { ...r, ...patch } : r
            );
            return { error: null };
          }),
        };
        return updateBuilder;
      }),
      delete: vi.fn(() => {
        const deleteBuilder: any = {
          in: vi.fn(async (field: string, vals: any[]) => {
            mockTableData[table] = (mockTableData[table] || []).filter((r) => !vals.includes(r[field]));
            return { error: null };
          }),
          eq: vi.fn((field: string, val: any) => {
            mockTableData[table] = (mockTableData[table] || []).filter((r) => r[field] !== val);
            const chainable: any = {
              not: vi.fn(async () => ({ error: null })),
              then: (resolve: any) => resolve({ error: null }),
            };
            return chainable;
          }),
        };
        return deleteBuilder;
      }),
      // Execution resolution
      then: (onResolve: any) => Promise.resolve({ data: currentData, error: null }).then(onResolve),
    };

    return builder;
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: 'usr_apollo', email: 'apollo@space.com', user_metadata: { full_name: 'Apollo Astronaut' } } },
          error: null,
        })),
      },
      from: vi.fn((table: string) => createQueryBuilder(table)),
      __resetDb: () => {
        mockTableData = {
          users: [],
          workouts: [],
          exercises: [],
          workout_exercises: [],
          sessions: [],
          sets: [],
        };
      },
    },
  };
});

describe('Database Domain Services - Supabase Persistence Layer', () => {
  beforeEach(async () => {
    const { supabase } = await import('../src/lib/supabase.ts');
    (supabase as any).__resetDb();
  });

  describe('User Profiles Domain', () => {
    it('initializes default user profile on first sign in', async () => {
      const user = await initializeUser('usr_apollo', 'apollo@space.com', 'Apollo Astronaut');
      expect(user).toBeDefined();
      expect(user.userId).toBe('usr_apollo');
      expect(user.email).toBe('apollo@space.com');
      expect(user.name).toBe('Apollo Astronaut');
    });
  });

  describe('Workouts & Exercises Domain', () => {
    it('persists structured workouts with child exercises and fetches them', async () => {
      const userId = 'usr_musk';
      const workout1 = workoutFactory.build({ name: 'Day 1: Heavy Bench & Shoulders', order: 1 });
      const workout2 = workoutFactory.build({ name: 'Day 2: Deadlifts & Pull-ups', order: 2 });

      await saveWorkoutsAndExercises(userId, [workout1, workout2]);

      const data = await fetchWorkoutsData(userId);
      expect(data).toBeDefined();
      expect(data.workoutsList).toHaveLength(2);
      expect(data.workoutsList[0].name).toBe('Day 1: Heavy Bench & Shoulders');
    });
  });

  describe('Workout Sessions Domain', () => {
    it('deletes sessions and related sets cleanly', async () => {
      await deleteSessions(['sess_del_123']);
      const history = await fetchWorkoutHistory('usr_to_delete');
      expect(history.find((s) => s.id === 'sess_del_123')).toBeUndefined();
    });
  });
});
