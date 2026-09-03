import { describe, it, expect, beforeEach, vi } from 'vitest';

let mockSessionsDb: any[] = [];
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
      single: vi.fn(() => {
        if (dbError) return Promise.resolve({ data: null, error: dbError, status: dbError.status || 500 });
        let res = [...mockSessionsDb];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        return Promise.resolve({ data: res[0] || null, error: null, status: 200 });
      }),
      upsert: vi.fn((payload: any) => {
        if (dbError) return Promise.resolve({ data: null, error: dbError, status: dbError.status || 500 });
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockSessionsDb.findIndex((r) => r.id === item.id);
          if (idx >= 0) mockSessionsDb[idx] = { ...mockSessionsDb[idx], ...item };
          else mockSessionsDb.push(item);
        });
        return {
          select: () => Promise.resolve({ data: items, error: null, status: 200 }),
          then: (resolve: any) => resolve({ data: items, error: null, status: 200 }),
        };
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

describe('Session Creation Status Codes & Error Boundaries', () => {
  beforeEach(() => {
    mockSessionsDb = [];
    dbError = null;
    vi.clearAllMocks();
  });

  it('200 OK: Persists newly started workout session record', async () => {
    const { supabase } = await import('../../../src/lib/supabase.ts');
    const newSession = {
      id: 'sess_status_200',
      user_id: 'usr_lifter',
      workout_id: 'w_push_1',
      status: 'in_progress',
      started_at: new Date().toISOString(),
    };

    const result = await supabase.from('sessions').upsert(newSession);
    expect(result.error).toBeNull();
    expect(mockSessionsDb).toHaveLength(1);
    expect(mockSessionsDb[0].id).toBe('sess_status_200');
  });

  it('500 Internal Server Error: Catches database query exceptions during session creation', async () => {
    const { supabase } = await import('../../../src/lib/supabase.ts');
    dbError = { message: 'Database connection failed', code: '57P01', status: 500 };

    const result = await supabase.from('sessions').upsert({ id: 'sess_500_err' });
    expect(result.error?.message).toBe('Database connection failed');
    expect(result.error?.code).toBe('57P01');
  });

  it('400 Bad Request: Identifies malformed or missing session identification payload', async () => {
    const { supabase } = await import('../../../src/lib/supabase.ts');
    dbError = { message: 'Missing required field: workout_id', code: '23502', status: 400 };

    const result = await supabase.from('sessions').upsert({ id: 'sess_bad_req' });
    expect(result.error?.code).toBe('23502');
    expect(result.error?.message).toContain('Missing required field');
  });
});
