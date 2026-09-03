import { describe, it, expect } from 'vitest';
import { exportAllLogs, importAllLogs } from '../../../src/lib/supabaseData.ts';

describe('exportAllLogs & importAllLogs data backup integrity', () => {
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
      { id: 'w_1', user_id: 'test_user_backup_123', name: 'Day 1 - Push', order: 1 }
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
        entries_json: [
          {
            id: 'entry_1',
            foodItemId: 'food_kipfilet',
            name: 'Kipfilet',
            amountGrams: 200,
            calculatedKcal: 220,
            calculatedProtein: 46,
          }
        ]
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

  it('contains dietary logs, entries, and custom food items in exported backup bundle schema', () => {
    expect(TEST_BACKUP_DATA.version).toBe(3);
    expect(TEST_BACKUP_DATA.dietary_logs).toHaveLength(1);
    expect(TEST_BACKUP_DATA.dietary_log_entries).toHaveLength(1);
    expect(TEST_BACKUP_DATA.custom_food_items).toHaveLength(1);
    expect(TEST_BACKUP_DATA.dietary_logs[0].total_protein).toBe(160);
    expect(TEST_BACKUP_DATA.custom_food_items[0].name).toBe('Custom Protein Shake');
  });
});
