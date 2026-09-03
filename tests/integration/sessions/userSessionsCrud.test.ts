import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchWorkoutHistory } from '../../../src/lib/db/sessions.ts';
import { sessionFactory, setFactory } from '../../fixtures/factories.ts';

let mockSessionsDb: any[] = [];
let shouldFailDb = false;

vi.mock('../../../src/lib/supabase.ts', () => {
  const createBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      _orderField: null as string | null,
      _ascending: true,
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
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
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

describe('User Sessions Historical CRUD & Timeline Queries', () => {
  beforeEach(() => {
    mockSessionsDb = [];
    shouldFailDb = false;
    vi.clearAllMocks();
  });

  it('1. Fetches chronological session history ordered by completion date descending', async () => {
    mockSessionsDb = [
      { id: 'sess_old', user_id: 'usr_lifter', workout_id: 'w1', completed_at: '2025-05-01T10:00:00.000Z' },
      { id: 'sess_new', user_id: 'usr_lifter', workout_id: 'w2', completed_at: '2025-05-05T10:00:00.000Z' },
      { id: 'sess_mid', user_id: 'usr_lifter', workout_id: 'w3', completed_at: '2025-05-03T10:00:00.000Z' },
    ];

    const history = await fetchWorkoutHistory('usr_lifter');
    expect(history).toHaveLength(3);
    expect(history[0].id).toBe('sess_new');
    expect(history[1].id).toBe('sess_mid');
    expect(history[2].id).toBe('sess_old');
  });

  it('2. Enforces multi-tenant user isolation when loading workout histories', async () => {
    mockSessionsDb = [
      { id: 'sess_user1', user_id: 'usr_1', workout_id: 'w1', completed_at: '2025-05-01T10:00:00.000Z' },
      { id: 'sess_user2', user_id: 'usr_2', workout_id: 'w2', completed_at: '2025-05-01T10:00:00.000Z' },
    ];

    const historyUser1 = await fetchWorkoutHistory('usr_1');
    expect(historyUser1).toHaveLength(1);
    expect(historyUser1[0].id).toBe('sess_user1');

    const historyUser2 = await fetchWorkoutHistory('usr_2');
    expect(historyUser2).toHaveLength(1);
    expect(historyUser2[0].id).toBe('sess_user2');
  });

  it('3. Throws error cleanly when database query fails during history fetch', async () => {
    shouldFailDb = true;
    await expect(fetchWorkoutHistory('usr_fail')).rejects.toThrow('DB Error');
  });
});
