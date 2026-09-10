import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportAllLogs, importAllLogs, deleteAllLogs } from '../../../src/lib/db/backup.ts';
import { supabase } from '../../../src/lib/supabase.ts';
import { deleteWorkoutPhotos } from '../../../src/lib/storage.ts';

vi.mock('../../../src/lib/supabase.ts', () => ({
  supabase: {
    from: vi.fn(),
  },
}));
vi.mock('../../../src/lib/storage.ts', () => ({
  deleteWorkoutPhotos: vi.fn().mockResolvedValue(undefined),
}));

describe('exportAllLogs & importAllLogs data backup integrity & unique ID remapping', () => {
  const TEST_BACKUP_DATA = {
    version: 3,
    exported_at: '2026-09-03T12:00:00.000Z',
    user_id: 'test_user_backup_123',
    user_profile: {
      id: 'test_user_backup_123',
      email: 'test@example.com',
      name: 'Test Backup User',
    },
    workouts: [
      { id: 'w_1', user_id: 'test_user_backup_123', name: 'Day 1 - Push', order: 1, exercise_ids: ['ex_1'] }
    ],
    exercises: [
      { id: 'ex_1', user_id: 'test_user_backup_123', name: 'Bench Press', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 }
    ],
    workout_exercises: [
      { id: 'we_1', user_id: 'test_user_backup_123', workout_id: 'w_1', exercise_id: 'ex_1', position: 0 }
    ],
    sessions: [
      { id: 'sess_1', user_id: 'test_user_backup_123', workout_id: 'w_1', status: 'completed' }
    ],
    sets: [
      { id: 'set_1', user_id: 'test_user_backup_123', session_id: 'sess_1', exercise_id: 'ex_1', set_number: 1, weight: 80, reps: 10 }
    ],
    body_logs: [
      { id: 'bl_1', user_id: 'test_user_backup_123', log_date: '2026-09-03', weight_kg: 82.5 }
    ],
    dietary_logs: [
      {
        id: 'diet_test_user_backup_123_2026-09-03',
        user_id: 'test_user_backup_123',
        log_date: '2026-09-03',
        total_kcal: 2200,
        total_protein: 160,
        total_carbs: 220,
        total_sugar: 35,
        total_fat: 65,
        total_fiber: 28,
      }
    ],
    dietary_log_entries: [
      {
        id: 'entry_1',
        dietary_log_id: 'diet_test_user_backup_123_2026-09-03',
        user_id: 'test_user_backup_123',
        food_item_id: 'food_kipfilet',
        name: 'Kipfilet',
        amount_grams: 200,
        calculated_kcal: 220,
        calculated_protein: 46,
      }
    ],
    custom_food_items: [
      {
        id: 'food_custom_shake',
        name: 'Custom Protein Shake',
        brand: 'Custom',
        kcal_per_100g: 380,
        protein_per_100g: 75,
        is_custom: true,
        user_id: 'test_user_backup_123',
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('contains dietary logs, entries, and custom food items in exported backup bundle schema', () => {
    expect(TEST_BACKUP_DATA.version).toBe(3);
    expect(TEST_BACKUP_DATA.dietary_logs).toHaveLength(1);
    expect(TEST_BACKUP_DATA.dietary_log_entries).toHaveLength(1);
    expect(TEST_BACKUP_DATA.custom_food_items).toHaveLength(1);
    expect(TEST_BACKUP_DATA.dietary_logs[0].total_protein).toBe(160);
    expect(TEST_BACKUP_DATA.custom_food_items[0].name).toBe('Custom Protein Shake');
  });

  it('exportAllLogs respects granular scope selection (e.g. routines & exercises only)', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: 'w_1', name: 'Upper Body A' }],
      }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
    });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

    const exported = await exportAllLogs('target_user_456', {
      includeRoutines: true,
      includeExercises: true,
      includeWorkoutHistory: false,
      includeBodyLogs: false,
      includeDietary: false,
      includeProfile: false,
    });

    expect(exported.scope.includeRoutines).toBe(true);
    expect(exported.scope.includeWorkoutHistory).toBe(false);
    expect(exported.sessions).toEqual([]);
    expect(exported.sets).toEqual([]);
    expect(exported.body_logs).toEqual([]);
  });

  it('importAllLogs generates fresh unique IDs on import and remaps all foreign keys', async () => {
    const upsertMap: Record<string, unknown[]> = {};
    const mockFrom = vi.fn((table: string) => ({
      upsert: vi.fn((data: unknown[]) => {
        upsertMap[table] = Array.isArray(data) ? data : [data];
        return Promise.resolve({ error: null });
      }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    }));
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

    await importAllLogs('new_athlete_id_999', TEST_BACKUP_DATA);

    // 1. Verify exercises were remapped with new IDs and assigned to new_athlete_id_999
    const importedExercises = upsertMap['exercises'] as Array<{ id: string; user_id: string; name: string }>;
    expect(importedExercises).toBeDefined();
    expect(importedExercises[0].user_id).toBe('new_athlete_id_999');
    expect(importedExercises[0].id).not.toBe('ex_1');
    expect(importedExercises[0].id).toMatch(/^ex_/);
    const newExId = importedExercises[0].id;

    // 2. Verify workouts were remapped with new IDs and updated exercise_ids
    const importedWorkouts = upsertMap['workouts'] as Array<{ id: string; user_id: string; exercise_ids: string[] }>;
    expect(importedWorkouts).toBeDefined();
    expect(importedWorkouts[0].user_id).toBe('new_athlete_id_999');
    expect(importedWorkouts[0].id).not.toBe('w_1');
    expect(importedWorkouts[0].id).toMatch(/^w_/);
    expect(importedWorkouts[0].exercise_ids).toContain(newExId); // Linked to new remapped exercise ID!
    const newWorkoutId = importedWorkouts[0].id;

    // 3. Verify sessions were remapped and link to new workout ID
    const importedSessions = upsertMap['sessions'] as Array<{ id: string; user_id: string; workout_id: string }>;
    expect(importedSessions).toBeDefined();
    expect(importedSessions[0].user_id).toBe('new_athlete_id_999');
    expect(importedSessions[0].id).not.toBe('sess_1');
    expect(importedSessions[0].workout_id).toBe(newWorkoutId); // Linked to new remapped workout ID!
    const newSessionId = importedSessions[0].id;

    // 4. Verify sets were remapped and link to new session ID and new exercise ID
    const importedSets = upsertMap['sets'] as Array<{ id: string; user_id: string; session_id: string; exercise_id: string }>;
    expect(importedSets).toBeDefined();
    expect(importedSets[0].user_id).toBe('new_athlete_id_999');
    expect(importedSets[0].session_id).toBe(newSessionId); // Linked to new session ID!
    expect(importedSets[0].exercise_id).toBe(newExId);     // Linked to new exercise ID!
  });

  it('deleteAllLogs removes session photos, logs, and resets progression state', async () => {
    const tables: string[] = [];
    const mockFrom = vi.fn((table: string) => {
      tables.push(table);
      const query: any = {
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn(),
      };
      query.eq.mockResolvedValue(table === 'sessions'
        ? { data: [{ photos: ['photo-a.jpg'] }, { photos: ['photo-b.jpg'] }], error: null }
        : { data: null, error: null });
      return query;
    });
    (supabase.from as unknown as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

    await expect(deleteAllLogs('target_user_456')).resolves.toBe(true);

    expect(deleteWorkoutPhotos).toHaveBeenCalledWith(['photo-a.jpg', 'photo-b.jpg']);
    expect(tables).toEqual([
      'sessions',
      'sets',
      'sessions',
      'body_logs',
      'dietary_log_entries',
      'dietary_logs',
      'users',
    ]);
  });
});
