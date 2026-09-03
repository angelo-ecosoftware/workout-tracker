import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logDailyBodyWeight, fetchBodyMeasurementLogs } from '../../../src/lib/db/biometrics.ts';
import { BodyMeasurementLog } from '../../../src/models.ts';

// -----------------------------------------------------------------------------
// In-Memory Database Store for Body Measurement Logs
// -----------------------------------------------------------------------------
let mockBodyLogsTable: any[] = [];
let shouldSimulateDbError = false;
let simulatedDbErrorMessage = 'Database transaction deadlock (500)';

vi.mock('../../../src/lib/supabase.ts', () => {
  const createQueryBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      _ascending: true,

      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      order: vi.fn((_field: string, opts?: { ascending?: boolean }) => {
        builder._ascending = opts?.ascending ?? true;
        return builder;
      }),
      single: vi.fn(() => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
        }
        let data = [...mockBodyLogsTable];
        for (const f of builder._filters) {
          data = data.filter((r) => r[f.field] === f.val);
        }
        if (data.length === 0) {
          return Promise.resolve({ data: null, error: { message: 'Row not found', code: 'PGRST116' }, status: 404 });
        }
        return Promise.resolve({ data: data[data.length - 1], error: null, status: 200 });
      }),
      upsert: vi.fn((payload: any) => {
        if (shouldSimulateDbError) {
          return {
            select: () => ({
              single: () => Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }),
            }),
            data: null,
            error: { message: simulatedDbErrorMessage, code: '500' },
            status: 500,
          };
        }
        const item = payload;
        const idx = mockBodyLogsTable.findIndex((r) => r.user_id === item.user_id && r.log_date === item.log_date);
        if (idx >= 0) {
          mockBodyLogsTable[idx] = { ...mockBodyLogsTable[idx], ...item, updated_at: new Date().toISOString() };
        } else {
          const newRow = {
            id: item.id || `body_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            ...item,
            created_at: new Date().toISOString(),
          };
          mockBodyLogsTable.push(newRow);
        }
        const saved = idx >= 0 ? mockBodyLogsTable[idx] : mockBodyLogsTable[mockBodyLogsTable.length - 1];
        return {
          select: () => ({
            single: () => Promise.resolve({ data: saved, error: null, status: 200 }),
          }),
          data: saved,
          error: null,
          status: 200,
        };
      }),
      delete: vi.fn(() => {
        return {
          eq: (field: string, val: any) => {
            if (shouldSimulateDbError) {
              return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
            }
            const before = mockBodyLogsTable.length;
            mockBodyLogsTable = mockBodyLogsTable.filter((r) => r[field] !== val);
            const deleted = before - mockBodyLogsTable.length;
            return Promise.resolve({ data: { count: deleted }, error: null, status: 200 });
          },
        };
      }),
      then: (onfulfilled: any) => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }).then(onfulfilled);
        }
        let data = [...mockBodyLogsTable];
        for (const f of builder._filters) {
          data = data.filter((r) => r[f.field] === f.val);
        }
        data.sort((a, b) => (builder._ascending ? (a.log_date > b.log_date ? 1 : -1) : (a.log_date < b.log_date ? 1 : -1)));
        return Promise.resolve({ data, error: null, status: 200 }).then(onfulfilled);
      },
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createQueryBuilder(table)),
    },
  };
});

describe('Entity: Body Measurement Logs (body_logs / body_measurement_logs) - Complete CRUD Matrix', () => {
  beforeEach(() => {
    mockBodyLogsTable = [];
    shouldSimulateDbError = false;
    vi.clearAllMocks();
  });

  const userId = 'usr_physique_athlete';

  // =========================================================================
  // 1. CREATE / INSERT
  // =========================================================================
  describe('1. CREATE / INSERT Operations', () => {
    it('200 OK / 201 Created: Inserts a daily bodyweight and biometrics log record', async () => {
      const log = await logDailyBodyWeight(userId, {
        date: '2026-09-03',
        weightKg: 85.5,
        heightCm: 182,
        source: 'morning_weigh_in',
        notes: 'Fasted, post bathroom.',
      });

      expect(log).toBeDefined();
      expect(log.userId).toBe(userId);
      expect(log.weightKg).toBe(85.5);
      expect(log.heightCm).toBe(182);
      expect(log.logDate).toBe('2026-09-03');
      expect(log.notes).toBe('Fasted, post bathroom.');

      expect(mockBodyLogsTable).toHaveLength(1);
    });

    it('500 Internal Server Error: Throws error when database persistence fails during insert', async () => {
      shouldSimulateDbError = true;
      await expect(
        logDailyBodyWeight(userId, {
          date: '2026-09-03',
          weightKg: 85.0,
        })
      ).rejects.toThrow(/Database transaction deadlock/);
    });
  });

  // =========================================================================
  // 2. READ / QUERY
  // =========================================================================
  describe('2. READ / QUERY Operations', () => {
    beforeEach(async () => {
      await logDailyBodyWeight(userId, { date: '2026-09-01', weightKg: 86.0 });
      await logDailyBodyWeight(userId, { date: '2026-09-02', weightKg: 85.8 });
      await logDailyBodyWeight(userId, { date: '2026-09-03', weightKg: 85.4 });
      await logDailyBodyWeight('other_user', { date: '2026-09-03', weightKg: 70.0 });
    });

    it('200 OK: Queries chronological biometric logs strictly scoped to authenticated user', async () => {
      const logs = await fetchBodyMeasurementLogs(userId);
      expect(logs).toHaveLength(3);
      expect(logs[0].logDate).toBe('2026-09-01');
      expect(logs[0].weightKg).toBe(86.0);
      expect(logs[2].logDate).toBe('2026-09-03');
      expect(logs[2].weightKg).toBe(85.4);

      // Ensures other_user record is excluded
      expect(logs.some((l) => l.userId === 'other_user')).toBe(false);
    });

    it('404 / Empty: Returns empty array for user with zero logged body measurements', async () => {
      const logs = await fetchBodyMeasurementLogs('usr_with_no_logs');
      expect(logs).toEqual([]);
    });

    it('500 Graceful Handling: Returns empty array without crashing when database read errors occur', async () => {
      shouldSimulateDbError = true;
      const logs = await fetchBodyMeasurementLogs(userId);
      expect(logs).toEqual([]);
    });
  });

  // =========================================================================
  // 3. UPDATE / MUTATE
  // =========================================================================
  describe('3. UPDATE / MUTATE Operations', () => {
    it('200 OK: Upserts/updates existing body log for the same date instead of duplicating', async () => {
      await logDailyBodyWeight(userId, {
        date: '2026-09-03',
        weightKg: 85.0,
        notes: 'Initial weigh in',
      });
      expect(mockBodyLogsTable).toHaveLength(1);

      // User re-logs/corrects their weight for the same date
      const updated = await logDailyBodyWeight(userId, {
        date: '2026-09-03',
        weightKg: 84.7,
        notes: 'Corrected scale calibration',
      });

      expect(mockBodyLogsTable).toHaveLength(1); // Still 1 record (onConflict: user_id,log_date)
      expect(updated.weightKg).toBe(84.7);
      expect(updated.notes).toBe('Corrected scale calibration');
    });
  });

  // =========================================================================
  // 4. DELETE / CLEANUP
  // =========================================================================
  describe('4. DELETE Operations', () => {
    it('200 OK: Deletes a body measurement log by user_id', async () => {
      const { supabase } = await import('../../../src/lib/supabase.ts');
      await logDailyBodyWeight(userId, { date: '2026-09-03', weightKg: 85.0 });
      expect(mockBodyLogsTable).toHaveLength(1);

      const { data, error } = await supabase.from('body_measurement_logs').delete().eq('user_id', userId);
      expect(error).toBeNull();
      expect(mockBodyLogsTable).toHaveLength(0);
      expect((data as any)?.count).toBe(1);
    });
  });
});
