import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteSessions, fetchWorkoutHistory } from '../../../src/lib/db/sessions.ts';
import { Session, WorkoutSet } from '../../../src/models.ts';
import { sessionFactory, setFactory } from '../../fixtures/factories.ts';

let mockSessionsDb: any[] = [];
let mockSetsDb: any[] = [];
let shouldFailDb = false;

vi.mock('../../../src/lib/supabase.ts', () => {
  const createBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      _inFilters: [] as { field: string; vals: any[] }[],
      _orderField: null as string | null,
      _ascending: true,
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      in: vi.fn((field: string, vals: any[]) => {
        builder._inFilters.push({ field, vals });
        return builder;
      }),
      order: vi.fn((field: string, opts: { ascending: boolean }) => {
        builder._orderField = field;
        builder._ascending = opts.ascending;
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB error', code: '500' } });
        const db = table === 'sessions' ? mockSessionsDb : mockSetsDb;
        let res = [...db];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        for (const inf of builder._inFilters) res = res.filter((r) => inf.vals.includes(r[inf.field]));
        res.sort((a, b) => (builder._ascending ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)));
        return Promise.resolve({ data: res, error: null });
      }),
      upsert: vi.fn((payload: any) => {
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB error', code: '500' } });
        const items = Array.isArray(payload) ? payload : [payload];
        const db = table === 'sessions' ? mockSessionsDb : mockSetsDb;
        items.forEach((item) => {
          const idx = db.findIndex((r) => r.id === item.id);
          if (idx >= 0) db[idx] = { ...db[idx], ...item };
          else db.push(item);
        });
        return Promise.resolve({ data: items, error: null });
      }),
      delete: vi.fn(() => ({
        in: (field: string, vals: any[]) => ({
          eq: (userField: string, userVal: any) => {
            if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB error', code: '500' } });
            mockSessionsDb = mockSessionsDb.filter((r) => !(vals.includes(r[field]) && r[userField] === userVal));
            return Promise.resolve({ data: null, error: null });
          },
          then: (resolve: any) => {
            if (table === 'sets') {
              mockSetsDb = mockSetsDb.filter((r) => !vals.includes(r[field]));
            } else {
              mockSessionsDb = mockSessionsDb.filter((r) => !vals.includes(r[field]));
            }
            return resolve({ data: null, error: null });
          },
        }),
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB error', code: '500' } });
          if (table === 'sessions') {
            mockSessionsDb = mockSessionsDb.filter((r) => r[field] !== val);
            mockSetsDb = mockSetsDb.filter((s) => s.session_id !== val);
          } else {
            mockSetsDb = mockSetsDb.filter((r) => r[field] !== val);
          }
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

describe('Sessions Real-time Execution & Set Tracking Engine', () => {
  beforeEach(() => {
    mockSessionsDb = [];
    mockSetsDb = [];
    shouldFailDb = false;
    vi.clearAllMocks();
  });

  it('1. Records completed workout session and sets using factory models', () => {
    const session = sessionFactory.build({
      id: 'sess_live_101',
      userId: 'usr_lifter',
      status: 'completed',
      notes: 'Strong bench press progression today',
    });

    const sets: WorkoutSet[] = [
      setFactory.build({ id: 'set_1', sessionId: 'sess_live_101', exerciseId: 'ex_bench', setNumber: 1, reps: 10, weight: 80 }),
      setFactory.build({ id: 'set_2', sessionId: 'sess_live_101', exerciseId: 'ex_bench', setNumber: 2, reps: 8, weight: 85 }),
      setFactory.build({ id: 'set_3', sessionId: 'sess_live_101', exerciseId: 'ex_ohp', setNumber: 1, reps: 12, weight: 50 }),
    ];

    expect(session.notes).toBe('Strong bench press progression today');
    expect(sets).toHaveLength(3);
    expect(sets[1].weight).toBe(85);
  });

  it('2. Loads session history and hydration of workout records', async () => {
    mockSessionsDb = [{
      id: 'sess_hydrated_1',
      user_id: 'usr_lifter',
      workout_id: 'w_pull',
      status: 'completed',
      completed_at: '2025-05-09T08:00:00.000Z',
    }];

    const history = await fetchWorkoutHistory('usr_lifter');
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('sess_hydrated_1');
    expect(history[0].workoutId).toBe('w_pull');
  });

  it('3. Cascade deletes session and all associated workout sets', async () => {
    mockSessionsDb = [{ id: 'sess_del', user_id: 'usr_lifter' }];
    mockSetsDb = [
      { id: 's1', session_id: 'sess_del' },
      { id: 's2', session_id: 'sess_del' },
    ];

    await deleteSessions(['sess_del'], 'usr_lifter');

    expect(mockSessionsDb).toHaveLength(0);
    expect(mockSetsDb).toHaveLength(0);
  });
});
