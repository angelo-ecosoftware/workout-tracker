import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initializeUser, saveUserMetrics } from '../../../src/lib/db/users.ts';

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
      delete: vi.fn(() => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
          mockUsersDb = mockUsersDb.filter((r) => r[field] !== val);
          return Promise.resolve({ data: null, error: null });
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

describe('Backend Users Database Domain & Persistence Isolation', () => {
  beforeEach(() => {
    mockUsersDb = [];
    shouldFailDb = false;
    vi.clearAllMocks();
  });

  it('1. Strict tenant isolation: user queries only access their own profile record', async () => {
    mockUsersDb = [
      { user_id: 'usr_tenant_1', email: 'user1@gym.com', name: 'User 1' },
      { user_id: 'usr_tenant_2', email: 'user2@gym.com', name: 'User 2' },
    ];

    const profile1 = await initializeUser('usr_tenant_1');
    const profile2 = await initializeUser('usr_tenant_2');

    expect(profile1.userId).toBe('usr_tenant_1');
    expect(profile1.name).toBe('User 1');
    expect(profile2.userId).toBe('usr_tenant_2');
    expect(profile2.name).toBe('User 2');
  });

  it('2. Schema compatibility: column names snake_case maps to camelCase models', async () => {
    mockUsersDb = [{
      user_id: 'usr_case_check',
      email: 'camel@gym.com',
      name: 'Camel Casing',
      last_completed_workout_order: 1,
      max_workout_order: 4,
      last_set_summary_per_exercise: {},
      created_at: new Date().toISOString(),
    }];

    const user = await initializeUser('usr_case_check');
    expect(user.userId).toBe('usr_case_check');
    expect(user.lastCompletedWorkoutOrder).toBe(1);
    expect(user.maxWorkoutOrder).toBe(4);
  });

  it('3. Resilient transactions: partial updates do not corrupt unmentioned properties', async () => {
    mockUsersDb = [{
      user_id: 'usr_atomic',
      email: 'atomic@gym.com',
      name: 'Atomic Athlete',
      last_completed_workout_order: 2,
      max_workout_order: 3,
    }];

    await saveUserMetrics('usr_atomic', { height: 188, weight: 85.0 });

    expect(mockUsersDb[0].name).toBe('Atomic Athlete');
    expect(mockUsersDb[0].last_completed_workout_order).toBe(2);
    expect(mockUsersDb[0].metrics.height).toBe(188);
  });
});
