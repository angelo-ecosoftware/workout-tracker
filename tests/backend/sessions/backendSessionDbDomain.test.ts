import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchWorkoutHistory, deleteSessions, updateSessionNotes } from '../../../src/lib/db/sessions.ts';

let mockSessionsDb: any[] = [];
let mockSetsDb: any[] = [];
let shouldFailDb = false;

vi.mock('../../../src/lib/storage.ts', () => ({
  deleteWorkoutPhotos: vi.fn(async () => {}),
}));

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
        if (table === 'sessions') {
          const matched = mockSessionsDb.filter((r) => vals.includes(r[field]));
          return Promise.resolve({ data: matched, error: null });
        }
        return builder;
      }),
      order: vi.fn((field: string, opts: { ascending: boolean }) => {
        builder._orderField = field;
        builder._ascending = opts.ascending;
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
        let res = [...mockSessionsDb];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        res.sort((a, b) => (builder._ascending ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)));
        return Promise.resolve({ data: res, error: null });
      }),
      update: vi.fn((patch: any) => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
          const idx = mockSessionsDb.findIndex((r) => r[field] === val);
          if (idx >= 0) {
            mockSessionsDb[idx] = { ...mockSessionsDb[idx], ...patch };
            return Promise.resolve({ data: mockSessionsDb[idx], error: null });
          }
          return Promise.resolve({ data: null, error: { message: 'Not found', code: '404' } });
        },
      })),
      delete: vi.fn(() => ({
        in: (field: string, vals: any[]) => ({
          eq: (userField: string, userVal: any) => {
            if (table === 'sessions') {
              mockSessionsDb = mockSessionsDb.filter((r) => !(vals.includes(r[field]) && r[userField] === userVal));
            }
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

describe('Backend Sessions Database Domain & Isolation Rules', () => {
  beforeEach(() => {
    mockSessionsDb = [];
    mockSetsDb = [];
    shouldFailDb = false;
    vi.clearAllMocks();
  });

  it('1. Schema mapping: converts snake_case database rows into Session models', async () => {
    mockSessionsDb = [{
      id: 'sess_db_1',
      user_id: 'usr_mapping_test',
      workout_id: 'w_push_hyper',
      status: 'completed',
      started_at: '2025-05-01T10:00:00.000Z',
      completed_at: '2025-05-01T11:00:00.000Z',
      notes: 'Notes saved in db',
      photos: ['photo1.png'],
    }];

    const results = await fetchWorkoutHistory('usr_mapping_test');
    expect(results).toHaveLength(1);
    expect(results[0].userId).toBe('usr_mapping_test');
    expect(results[0].workoutId).toBe('w_push_hyper');
  });

  it('2. Multi-tenant privacy: deleting sessions scoped to a user does not delete another user’s records', async () => {
    mockSessionsDb = [
      { id: 'sess_victim', user_id: 'usr_a' },
      { id: 'sess_target', user_id: 'usr_b' },
    ];

    await deleteSessions(['sess_victim'], 'usr_b');
    // Because usr_b is not the owner of sess_victim, sess_victim is not deleted
    expect(mockSessionsDb.find((s) => s.id === 'sess_victim')).toBeDefined();
  });

  it('3. Resilient field updates: updating session notes leaves photos and timestamps intact', async () => {
    mockSessionsDb = [{
      id: 'sess_atomic',
      user_id: 'usr_a',
      notes: 'Initial notes',
      photos: ['p1.jpg'],
      completed_at: '2025-05-01T10:00:00.000Z',
    }];

    await updateSessionNotes('sess_atomic', 'Updated notes text');
    expect(mockSessionsDb[0].notes).toBe('Updated notes text');
    expect(mockSessionsDb[0].photos).toEqual(['p1.jpg']);
  });
});
