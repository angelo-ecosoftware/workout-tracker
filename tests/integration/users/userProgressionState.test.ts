import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeUser } from '../../../src/lib/db/users.ts';

let mockUsersDb: any[] = [];
let shouldFailDb = false;

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
      upsert: vi.fn((payload: any) => {
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockUsersDb.findIndex((r) => r.user_id === item.user_id);
          if (idx >= 0) mockUsersDb[idx] = { ...mockUsersDb[idx], ...item };
          else mockUsersDb.push(item);
        });
        return Promise.resolve({ data: items, error: null });
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

describe('User Workout Progression State & Last Set Engine', () => {
  beforeEach(() => {
    mockUsersDb = [];
    shouldFailDb = false;
    vi.clearAllMocks();
  });

  it('1. Initializes user with progression tracking attributes', async () => {
    mockUsersDb = [{
      user_id: 'usr_prog_1',
      email: 'prog@test.com',
      name: 'Progression Athlete',
      last_completed_workout_order: 1,
      max_workout_order: 3,
      last_set_summary_per_exercise: {
        ex_bench: { lastWeight: 90, lastReps: 8, lastSessionId: 'sess_101' },
      },
      created_at: new Date().toISOString(),
    }];

    const user = await initializeUser('usr_prog_1');
    expect(user.lastCompletedWorkoutOrder).toBe(1);
    expect(user.maxWorkoutOrder).toBe(3);
    expect(user.lastSetSummaryPerExercise['ex_bench'].lastWeight).toBe(90);
  });

  it('2. Tracks maxWorkoutOrder boundary for routine cycle calculations', async () => {
    mockUsersDb = [{
      user_id: 'usr_cycle_1',
      email: 'cycle@test.com',
      last_completed_workout_order: 3,
      max_workout_order: 4,
      created_at: new Date().toISOString(),
    }];

    const user = await initializeUser('usr_cycle_1');
    expect(user.maxWorkoutOrder).toBe(4);
  });
});

