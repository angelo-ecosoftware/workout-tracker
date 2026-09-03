import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logDailyBodyWeight, fetchBodyMeasurementLogs } from '../../../src/lib/db/biometrics.ts';
import { bodyMeasurementFactory } from '../../shared/fixtures/factories.ts';

let mockBodyLogsDb: any[] = [];
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
      single: vi.fn(() => {
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'Database failure', code: '500' } });
        return Promise.resolve({ data: mockBodyLogsDb[mockBodyLogsDb.length - 1] || null, error: null });
      }),
      order: vi.fn((field: string, opts: { ascending: boolean }) => {
        builder._orderField = field;
        builder._ascending = opts.ascending;
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'Database failure', code: '500' } });
        let res = [...mockBodyLogsDb];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        res.sort((a, b) => (builder._ascending ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)));
        return Promise.resolve({ data: res, error: null });
      }),
      upsert: vi.fn((payload: any) => {
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'Database failure', code: '500' } });
        const item = {
          id: 'log_gen_1',
          created_at: new Date().toISOString(),
          ...payload,
        };
        const idx = mockBodyLogsDb.findIndex((r) => r.user_id === item.user_id && r.log_date === item.log_date);
        if (idx >= 0) mockBodyLogsDb[idx] = item;
        else mockBodyLogsDb.push(item);
        return builder;
      }),
      delete: vi.fn(() => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'Database failure', code: '500' } });
          const len = mockBodyLogsDb.length;
          mockBodyLogsDb = mockBodyLogsDb.filter((r) => r[field] !== val);
          return Promise.resolve({ data: { count: len - mockBodyLogsDb.length }, error: null });
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

describe('Biometrics Body Weight Tracking & Progression Logs', () => {
  beforeEach(() => {
    mockBodyLogsDb = [];
    shouldFailDb = false;
    vi.clearAllMocks();
  });

  it('1. Logs standard daily body weight and waist measurement with notes', async () => {
    const log = await logDailyBodyWeight('usr_athlete_1', {
      date: '2025-05-01',
      weightKg: 82.5,
      heightCm: 184,
      source: 'manual',
      notes: 'Morning weigh-in after fasted cardio',
    });

    expect(mockBodyLogsDb).toHaveLength(1);
    expect(log.weightKg).toBe(82.5);
    expect(log.notes).toBe('Morning weigh-in after fasted cardio');
  });

  it('2. Retrieves chronologically sorted biometric progression history', async () => {
    mockBodyLogsDb = [
      { id: 'l1', user_id: 'usr_1', log_date: '2025-05-01', weight_kg: 84.0, created_at: new Date().toISOString() },
      { id: 'l2', user_id: 'usr_1', log_date: '2025-05-02', weight_kg: 83.5, created_at: new Date().toISOString() },
      { id: 'l3', user_id: 'usr_1', log_date: '2025-05-03', weight_kg: 83.0, created_at: new Date().toISOString() },
    ];

    const logs = await fetchBodyMeasurementLogs('usr_1');
    expect(logs).toHaveLength(3);
    expect(logs[0].logDate).toBe('2025-05-01');
    expect(logs[0].weightKg).toBe(84.0);
    expect(logs[2].logDate).toBe('2025-05-03');
  });

  it('3. Generates deterministic mock objects with bodyMeasurementFactory', () => {
    const mocked = bodyMeasurementFactory.build({ userId: 'usr_custom', weightKg: 88.0 });
    expect(mocked.userId).toBe('usr_custom');
    expect(mocked.weightKg).toBe(88.0);
    expect(mocked.logDate).toBe('2025-05-01');
  });

  it('4. Deletes outdated or inaccurate biometric entry', async () => {
    const { supabase } = await import('../../../src/lib/supabase.ts');
    mockBodyLogsDb = [
      { id: 'log_keep', user_id: 'usr_1', log_date: '2025-05-01', weight_kg: 80.0 },
      { id: 'log_remove', user_id: 'usr_1', log_date: '2025-05-02', weight_kg: 180.0 },
    ];

    const { error } = await supabase.from('body_measurement_logs').delete().eq('id', 'log_remove');
    expect(error).toBeNull();
    expect(mockBodyLogsDb).toHaveLength(1);
    expect(mockBodyLogsDb[0].id).toBe('log_keep');
  });
});
