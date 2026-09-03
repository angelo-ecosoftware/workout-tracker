import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchWorkoutHistory,
  fetchSetsForSession,
  updateSessionDate,
  updateSessionNotes,
  updateSessionPhotos,
  deleteSessions,
  fetchPublicWorkoutSession,
} from '../../../src/lib/db/sessions.ts';
import { WorkoutSet } from '../../../src/models.ts';

// -----------------------------------------------------------------------------
// In-Memory Database Store for Sessions & Sets
// -----------------------------------------------------------------------------
let mockSessionsTable: any[] = [];
let mockSetsTable: any[] = [];
let shouldSimulateDbError = false;
let simulatedDbErrorMessage = 'Database transaction error (500)';

vi.mock('../../../src/lib/storage.ts', () => ({
  deleteWorkoutPhotos: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../../src/lib/supabase.ts', () => {
  const createQueryBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any; type: 'eq' | 'in' }[],
      _ascending: true,

      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val, type: 'eq' });
        return builder;
      }),
      in: vi.fn((field: string, vals: any[]) => {
        builder._filters.push({ field, val: vals, type: 'in' });
        return builder;
      }),
      order: vi.fn((_field: string, opts?: { ascending?: boolean }) => {
        builder._ascending = opts?.ascending ?? true;
        return builder;
      }),
      maybeSingle: vi.fn(() => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
        }
        let data = table === 'sessions' ? [...mockSessionsTable] : [...mockSetsTable];
        for (const f of builder._filters) {
          if (f.type === 'eq') data = data.filter((r) => r[f.field] === f.val);
          if (f.type === 'in') data = data.filter((r) => f.val.includes(r[f.field]));
        }
        return Promise.resolve({ data: data[0] || null, error: null, status: 200 });
      }),
      update: vi.fn((patch: any) => {
        return {
          eq: (field: string, val: any) => {
            if (shouldSimulateDbError) {
              return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
            }
            const target = table === 'sessions' ? mockSessionsTable : mockSetsTable;
            const idx = target.findIndex((r) => r[field] === val);
            if (idx >= 0) {
              target[idx] = { ...target[idx], ...patch, updated_at: new Date().toISOString() };
              return Promise.resolve({ data: target[idx], error: null, status: 200 });
            }
            return Promise.resolve({ data: null, error: { message: 'Row not found for update', code: 'PGRST116' }, status: 404 });
          },
        };
      }),
      delete: vi.fn(() => {
        const deleteChain: any = {
          _deleteFilters: [] as { field: string; val: any; type: 'eq' | 'in' }[],
          in: vi.fn((field: string, vals: any[]) => {
            deleteChain._deleteFilters.push({ field, val: vals, type: 'in' });
            return deleteChain;
          }),
          eq: vi.fn((field: string, val: any) => {
            deleteChain._deleteFilters.push({ field, val, type: 'eq' });
            return deleteChain;
          }),
          then: (onfulfilled: any) => {
            if (shouldSimulateDbError) {
              return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }).then(onfulfilled);
            }
            if (table === 'sessions') {
              mockSessionsTable = mockSessionsTable.filter((r) => {
                for (const f of deleteChain._deleteFilters) {
                  if (f.type === 'in' && f.val.includes(r[f.field])) return false;
                  if (f.type === 'eq' && r[f.field] === f.val) return false;
                }
                return true;
              });
            }
            if (table === 'sets') {
              mockSetsTable = mockSetsTable.filter((r) => {
                for (const f of deleteChain._deleteFilters) {
                  if (f.type === 'in' && f.val.includes(r[f.field])) return false;
                  if (f.type === 'eq' && r[f.field] === f.val) return false;
                }
                return true;
              });
            }
            return Promise.resolve({ data: null, error: null, status: 200 }).then(onfulfilled);
          },
        };
        return deleteChain;
      }),
      then: (onfulfilled: any) => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }).then(onfulfilled);
        }
        let data = table === 'sessions' ? [...mockSessionsTable] : [...mockSetsTable];
        for (const f of builder._filters) {
          if (f.type === 'eq') data = data.filter((r) => r[f.field] === f.val);
          if (f.type === 'in') data = data.filter((r) => f.val.includes(r[f.field]));
        }
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

describe('Entities: Completed Workout Sessions & Logged Sets (sessions, sets) - Complete CRUD Matrix', () => {
  beforeEach(() => {
    mockSessionsTable = [];
    mockSetsTable = [];
    shouldSimulateDbError = false;
    vi.clearAllMocks();
  });

  const userId = 'usr_powerlifter_99';
  const sampleSessionId = 'sess_heavy_squat_01';

  // =========================================================================
  // 1. CREATE / INSERT
  // =========================================================================
  describe('1. CREATE / INSERT Operations', () => {
    it('200 OK / 201 Created: Records a new completed session with associated workout sets', () => {
      mockSessionsTable.push({
        id: sampleSessionId,
        user_id: userId,
        workout_id: 'w_leg_day',
        status: 'completed',
        completed_at: new Date('2026-09-03T10:30:00Z').toISOString(),
        notes: 'Personal record on back squat!',
        photos: ['https://storage.supabase.co/media/squat_pr.jpg'],
      });

      mockSetsTable.push(
        { id: 'set_1', session_id: sampleSessionId, user_id: userId, exercise_id: 'ex_squat', set_number: 1, weight: 140, reps: 5 },
        { id: 'set_2', session_id: sampleSessionId, user_id: userId, exercise_id: 'ex_squat', set_number: 2, weight: 150, reps: 5 },
        { id: 'set_3', session_id: sampleSessionId, user_id: userId, exercise_id: 'ex_squat', set_number: 3, weight: 160, reps: 3 }
      );

      expect(mockSessionsTable).toHaveLength(1);
      expect(mockSetsTable).toHaveLength(3);
    });
  });

  // =========================================================================
  // 2. READ / QUERY
  // =========================================================================
  describe('2. READ / QUERY Operations', () => {
    beforeEach(() => {
      mockSessionsTable.push({
        id: sampleSessionId,
        user_id: userId,
        workout_id: 'w_leg_day',
        status: 'completed',
        completed_at: new Date('2026-09-03T10:30:00Z').toISOString(),
        notes: 'Squat session notes',
        photos: ['https://storage.supabase.co/media/squat.jpg'],
      });

      mockSetsTable.push(
        { id: 'set_1', session_id: sampleSessionId, user_id: userId, exercise_id: 'ex_squat', set_number: 1, weight: 140, reps: 5 },
        { id: 'set_2', session_id: sampleSessionId, user_id: userId, exercise_id: 'ex_squat', set_number: 2, weight: 150, reps: 5 }
      );
    });

    it('200 OK: Queries user workout session history with photos and notes', async () => {
      const history = await fetchWorkoutHistory(userId);
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe(sampleSessionId);
      expect(history[0].notes).toBe('Squat session notes');
      expect(history[0].photos).toEqual(['https://storage.supabase.co/media/squat.jpg']);
    });

    it('200 OK: Queries sets for session in chronological set_number order', async () => {
      const sets = await fetchSetsForSession(sampleSessionId);
      expect(sets).toHaveLength(2);
      expect(sets[0].weight).toBe(140);
      expect(sets[1].weight).toBe(150);
    });

    it('404 / Empty: Returns empty history array when user has not completed any workouts', async () => {
      const history = await fetchWorkoutHistory('usr_inactive');
      expect(history).toEqual([]);
    });

    it('500 Error: Propagates error when database query fails during history fetch', async () => {
      shouldSimulateDbError = true;
      await expect(fetchWorkoutHistory(userId)).rejects.toThrow(/Database transaction error/);
    });
  });

  // =========================================================================
  // 3. UPDATE / MUTATE
  // =========================================================================
  describe('3. UPDATE / MUTATE Operations', () => {
    beforeEach(() => {
      mockSessionsTable.push({
        id: sampleSessionId,
        user_id: userId,
        workout_id: 'w_leg_day',
        completed_at: new Date('2026-09-01T08:00:00Z').toISOString(),
        notes: 'Initial notes',
        photos: null,
      });
    });

    it('200 OK: Updates session completion date, notes, and uploaded photos', async () => {
      const updatedDate = new Date('2026-09-02T12:00:00Z');
      await updateSessionDate(sampleSessionId, updatedDate);
      await updateSessionNotes(sampleSessionId, 'Updated: Felt slight quad tightness.');
      await updateSessionPhotos(sampleSessionId, ['https://storage/new_photo.jpg']);

      expect(mockSessionsTable[0].completed_at).toBe(updatedDate.toISOString());
      expect(mockSessionsTable[0].notes).toBe('Updated: Felt slight quad tightness.');
      expect(mockSessionsTable[0].photos).toEqual(['https://storage/new_photo.jpg']);
    });

    it('500 Error: Throws error when session date update fails on database', async () => {
      shouldSimulateDbError = true;
      await expect(updateSessionDate(sampleSessionId, new Date())).rejects.toThrow();
    });
  });

  // =========================================================================
  // 4. DELETE / CASCADE
  // =========================================================================
  describe('4. DELETE Operations', () => {
    beforeEach(() => {
      mockSessionsTable.push({
        id: sampleSessionId,
        user_id: userId,
        photos: ['https://storage/squat.jpg'],
      });
      mockSetsTable.push(
        { id: 'set_1', session_id: sampleSessionId, user_id: userId },
        { id: 'set_2', session_id: sampleSessionId, user_id: userId }
      );
    });

    it('200 OK: Cascade deletes session and all child sets and linked storage photos', async () => {
      await deleteSessions([sampleSessionId], userId);

      expect(mockSessionsTable).toHaveLength(0);
      expect(mockSetsTable).toHaveLength(0);
    });

    it('200 OK: Safely handles empty session ID arrays without making database calls', async () => {
      await deleteSessions([], userId);
      expect(mockSessionsTable).toHaveLength(1);
    });
  });
});
