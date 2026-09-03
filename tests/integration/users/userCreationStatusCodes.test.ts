import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeUser } from '../../../src/lib/db/users.ts';

let mockUsersDb: any[] = [];
let dbError: { message: string; code: string; status?: number } | null = null;

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
        if (dbError) return Promise.resolve({ data: null, error: dbError, status: dbError.status || 500 });
        let res = [...mockUsersDb];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        return Promise.resolve({ data: res[0] || null, error: null, status: 200 });
      }),
      upsert: vi.fn((payload: any) => {
        if (dbError) return Promise.resolve({ data: null, error: dbError, status: dbError.status || 500 });
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockUsersDb.findIndex((r) => r.user_id === item.user_id);
          if (idx >= 0) mockUsersDb[idx] = { ...mockUsersDb[idx], ...item };
          else mockUsersDb.push(item);
        });
        return Promise.resolve({ data: items, error: null, status: 200 });
      }),
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

describe('User Creation Status Codes & Error Boundaries', () => {
  beforeEach(() => {
    mockUsersDb = [];
    dbError = null;
    vi.clearAllMocks();
  });

  it('200 OK: Creates user profile when provided valid parameters', async () => {
    const user = await initializeUser('usr_valid_200', 'valid@gym.com', 'Valid Athlete');
    expect(user.userId).toBe('usr_valid_200');
    expect(user.email).toBe('valid@gym.com');
    expect(mockUsersDb).toHaveLength(1);
  });

  it('200 OK: Returns existing user profile when user already registered (idempotency)', async () => {
    mockUsersDb = [{
      user_id: 'usr_existing_200',
      email: 'existing@gym.com',
      name: 'Existing Athlete',
      last_completed_workout_order: 2,
      max_workout_order: 3,
      last_set_summary_per_exercise: {},
      created_at: new Date().toISOString(),
    }];

    const user = await initializeUser('usr_existing_200');
    expect(user.userId).toBe('usr_existing_200');
    expect(user.lastCompletedWorkoutOrder).toBe(2);
    expect(mockUsersDb).toHaveLength(1);
  });

  it('500 Internal Server Error: Throws on database infrastructure failure', async () => {
    dbError = { message: 'Database connection terminated unexpectedly', code: '57P01', status: 500 };

    await expect(initializeUser('usr_fail_500', 'fail@gym.com')).rejects.toThrow(
      'Database connection terminated unexpectedly'
    );
  });

  it('409 Conflict: Handled via upsert idempotent replacement', async () => {
    mockUsersDb = [{ user_id: 'usr_conflict_409', email: 'first@gym.com', name: 'First Name' }];

    const user = await initializeUser('usr_conflict_409', 'first@gym.com', 'First Name');
    expect(user.name).toBe('First Name');
    expect(mockUsersDb).toHaveLength(1);
  });
});
