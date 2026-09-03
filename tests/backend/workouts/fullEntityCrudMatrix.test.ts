import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initializeUser,
  saveUserMetrics,
  logDailyBodyWeight,
  fetchBodyMeasurementLogs,
  fetchWorkoutsData,
  saveWorkoutsAndExercises,
  updateSessionDate,
  updateSessionNotes,
  updateSessionPhotos,
  deleteSessions,
  fetchWorkoutHistory,
  fetchSetsForSession,
} from '../../../src/lib/supabaseData.ts';
import {
  saveHiveMindFoodItem,
  saveHiveMindFoodItems,
  fetchHiveMindFoodCatalog,
  getDailyDietaryLog,
  saveDailyDietaryLog,
  calculatePortionNutrients,
  computeDailyTotals,
} from '../../../src/lib/dietaryData.ts';
import {
  userFactory,
  workoutFactory,
  exerciseFactory,
  sessionFactory,
  setFactory,
} from '../../shared/fixtures/factories.ts';
import { FoodItemNutrition, DailyDietaryLog } from '../../../src/models.ts';

// -------------------------------------------------------------
// Deterministic Supabase In-Memory Mock Store with Full Query Simulation
// -------------------------------------------------------------
let mockDb: Record<string, any[]> = {
  users: [],
  workouts: [],
  exercises: [],
  workout_exercises: [],
  sessions: [],
  sets: [],
  body_measurement_logs: [],
  food_items: [],
};

let shouldSimulateError = false;
let simulatedErrorMessage = 'Internal database transaction error';

vi.mock('../../../src/lib/supabase.ts', () => {
  const createQueryBuilder = (table: string) => {
    let currentData = [...(mockDb[table] || [])];

    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        currentData = currentData.filter((row) => row[field] === val);
        return builder;
      }),
      in: vi.fn((field: string, vals: any[]) => {
        currentData = currentData.filter((row) => vals.includes(row[field]));
        return builder;
      }),
      not: vi.fn((field: string, _op: string, _val: any) => builder),
      order: vi.fn((field: string, opts?: { ascending?: boolean }) => {
        const asc = opts?.ascending ?? true;
        currentData.sort((a, b) => (asc ? (a[field] > b[field] ? 1 : -1) : (a[field] < b[field] ? 1 : -1)));
        return builder;
      }),
      limit: vi.fn((cnt: number) => {
        currentData = currentData.slice(0, cnt);
        return builder;
      }),
      or: vi.fn((_clause: string) => builder),
      single: vi.fn(async () => {
        if (shouldSimulateError) {
          return { data: null, error: { message: simulatedErrorMessage, code: '42P01' } };
        }
        const item = currentData[0] || null;
        return { data: item, error: item ? null : { message: 'Row not found', code: 'PGRST116' } };
      }),
      maybeSingle: vi.fn(async () => {
        if (shouldSimulateError) {
          return { data: null, error: { message: simulatedErrorMessage, code: '500' } };
        }
        return { data: currentData[0] || null, error: null };
      }),
      upsert: vi.fn((payload: any) => {
        if (shouldSimulateError) {
          const errRes = { data: null, error: { message: simulatedErrorMessage, code: '400' } };
          return {
            select: vi.fn(async () => errRes),
            then: (res: any) => res(errRes),
          };
        }
        const items = Array.isArray(payload) ? payload : [payload];
        mockDb[table] = [...(mockDb[table] || []), ...items];
        const successRes = { data: items, error: null };
        return {
          select: vi.fn(async () => successRes),
          then: (res: any) => res(successRes),
        };
      }),
      insert: vi.fn(async (payload: any) => {
        if (shouldSimulateError) {
          return { data: null, error: { message: simulatedErrorMessage, code: '400' } };
        }
        const items = Array.isArray(payload) ? payload : [payload];
        mockDb[table] = [...(mockDb[table] || []), ...items];
        return { data: items, error: null };
      }),
      update: vi.fn((patch: any) => {
        return {
          eq: vi.fn(async (field: string, val: any) => {
            if (shouldSimulateError) {
              return { error: { message: simulatedErrorMessage, code: '400' } };
            }
            mockDb[table] = (mockDb[table] || []).map((r) =>
              r[field] === val ? { ...r, ...patch } : r
            );
            return { error: null };
          }),
        };
      }),
      delete: vi.fn(() => {
        return {
          in: vi.fn((field: string, vals: any[]) => {
            if (shouldSimulateError) {
              return {
                then: (res: any) => res({ error: { message: simulatedErrorMessage, code: '500' } }),
              };
            }
            mockDb[table] = (mockDb[table] || []).filter((r) => !vals.includes(r[field]));
            return {
              then: (res: any) => res({ error: null }),
            };
          }),
          eq: vi.fn((field: string, val: any) => {
            if (shouldSimulateError) {
              return {
                not: vi.fn(async () => ({ error: { message: simulatedErrorMessage } })),
                then: (res: any) => res({ error: { message: simulatedErrorMessage } }),
              };
            }
            mockDb[table] = (mockDb[table] || []).filter((r) => r[field] !== val);
            return {
              not: vi.fn(async () => ({ error: null })),
              then: (res: any) => res({ error: null }),
            };
          }),
        };
      }),
      then: (resolve: any) => {
        if (shouldSimulateError) {
          return resolve({ data: null, error: { message: simulatedErrorMessage, code: '500' } });
        }
        return resolve({ data: mockDb[table] ? [...mockDb[table]] : currentData, error: null });
      },
    };
    return builder;
  };

  return {
    supabase: {
      auth: {
        getUser: vi.fn(async () => ({
          data: {
            user: {
              id: 'usr_falcon9',
              email: 'falcon9@spacex.com',
              user_metadata: { full_name: 'Falcon 9 Heavy' },
            },
          },
          error: null,
        })),
      },
      from: vi.fn((table: string) => createQueryBuilder(table)),
    },
  };
});

let mockLocalStorage: Record<string, string> = {};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (key: string) => mockLocalStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockLocalStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete mockLocalStorage[key];
    },
    clear: () => {
      mockLocalStorage = {};
    },
  };
}

describe('Full-On CRUD & Error Code Testing Across All Application Entities', () => {
  beforeEach(() => {
    mockDb = {
      users: [],
      workouts: [],
      exercises: [],
      workout_exercises: [],
      sessions: [],
      sets: [],
      body_measurement_logs: [],
      food_items: [],
    };
    mockLocalStorage = {};
    if (globalThis.localStorage) {
      globalThis.localStorage.clear();
    }
    shouldSimulateError = false;
    simulatedErrorMessage = 'Internal database transaction error';
  });

  // =========================================================================
  // 1. ENTITY: USER PROFILE & BIOMETRIC SETTINGS
  // =========================================================================
  describe('Entity 1: User Profile & Target Biomarkers (users)', () => {
    it('✅ CREATE (201): Initializes new user with default parameters when first logging in', async () => {
      const user = await initializeUser('usr_starship', 'starship@spacex.com', 'Starship V3');
      expect(user).toBeDefined();
      expect(user.userId).toBe('usr_starship');
      expect(user.email).toBe('starship@spacex.com');
      expect(user.name).toBe('Starship V3');
      expect(user.maxWorkoutOrder).toBe(3);
    });

    it('✅ READ (200): Retrieves existing user profile and persists across visits', async () => {
      await initializeUser('usr_existing', 'existing@gym.com', 'Existing Athlete');
      const loaded = await initializeUser('usr_existing');
      expect(loaded.userId).toBe('usr_existing');
      expect(loaded.name).toBe('Existing Athlete');
    });

    it('✅ UPDATE (200): Saves user metrics and custom targets to database and local store', async () => {
      const metrics = {
        height: 188,
        weight: 92.5,
        gender: 'male' as const,
        fitnessLevel: 'advanced' as const,
        goals: ['hypertrophy', 'strength'],
        trainingLocation: 'gym' as const,
      };

      await saveUserMetrics('usr_metrics_test', metrics);
      const stored = localStorage.getItem('user_metrics_usr_metrics_test');
      expect(stored).toBeDefined();
      expect(JSON.parse(stored || '{}').weight).toBe(92.5);
    });
  });

  // =========================================================================
  // 2. ENTITY: DAILY BODY MEASUREMENTS & BIOMETRICS
  // =========================================================================
  describe('Entity 2: Body Measurement Logs (body_measurement_logs)', () => {
    it('✅ CREATE / UPSERT (200): Logs daily bodyweight check-in with notes and calculated metrics', async () => {
      const log = await logDailyBodyWeight('usr_bio', {
        date: '2026-09-03',
        weightKg: 84.8,
        heightCm: 185,
        source: 'workout_session',
        notes: 'Fasted morning weight after high carb day.',
      });

      expect(log).toBeDefined();
      expect(log.userId).toBe('usr_bio');
      expect(log.weightKg).toBe(84.8);
      expect(log.logDate).toBe('2026-09-03');
      expect(log.notes).toContain('Fasted morning weight');
    });

    it('✅ READ (200): Fetches chronological history of bodyweight logs for trend graphs', async () => {
      await logDailyBodyWeight('usr_bio', { date: '2026-09-01', weightKg: 85.2 });
      await logDailyBodyWeight('usr_bio', { date: '2026-09-02', weightKg: 85.0 });
      await logDailyBodyWeight('usr_bio', { date: '2026-09-03', weightKg: 84.7 });

      const logs = await fetchBodyMeasurementLogs('usr_bio');
      expect(logs).toHaveLength(3);
      expect(logs[0].logDate).toBe('2026-09-01');
      expect(logs[2].weightKg).toBe(84.7);
    });

    it('❌ ERROR HANDLING (400/500): Throws structured exception on DB failure', async () => {
      shouldSimulateError = true;
      simulatedErrorMessage = 'Duplicate primary key constraint violation';

      // Verify that database failure when updating user profile throws or reports correctly
      const workout = workoutFactory.build({ name: 'Faulty Routine' });
      await expect(saveWorkoutsAndExercises('usr_bio_err', [workout])).rejects.toThrow();
    });
  });

  // =========================================================================
  // 3. ENTITY: WORKOUT ROUTINES & EXERCISE TEMPLATES
  // =========================================================================
  describe('Entity 3: Workouts & Exercises (workouts & exercises)', () => {
    it('✅ CREATE & UPDATE (200): Upserts full workout splits and associated exercises', async () => {
      const userId = 'usr_builder';
      const workout = workoutFactory.build({
        name: 'Pull Day: Back & Biceps Focus',
        order: 1,
        exercises: [
          exerciseFactory.build({ name: 'Weighted Pull-Ups', targetSets: 4, targetRepMin: 6, targetRepMax: 8 }),
          exerciseFactory.build({ name: 'Barbell Rows', targetSets: 3, targetRepMin: 8, targetRepMax: 12 }),
        ],
      });

      await saveWorkoutsAndExercises(userId, [workout]);
      const data = await fetchWorkoutsData(userId);

      expect(data.workoutsList).toHaveLength(1);
      expect(data.workoutsList[0].name).toBe('Pull Day: Back & Biceps Focus');
    });

    it('✅ READ EMPTY (200): Safely handles new users with zero configured routines', async () => {
      const data = await fetchWorkoutsData('usr_empty_routines');
      expect(data.workoutsList).toEqual([]);
      expect(data.exercisesList).toEqual([]);
      expect(data.combinedWorkouts).toEqual([]);
    });

    it('❌ ERROR HANDLING (400/500): Catches database failures during batch exercise sync', async () => {
      shouldSimulateError = true;
      simulatedErrorMessage = 'Foreign key violation: exercises.user_id';

      const workout = workoutFactory.build({ name: 'Invalid Routine' });
      await expect(saveWorkoutsAndExercises('usr_err', [workout])).rejects.toThrow();
    });
  });

  // =========================================================================
  // 4. ENTITY: WORKOUT SESSIONS & SET LOGS
  // =========================================================================
  describe('Entity 4: Completed Workout Sessions & Sets (sessions & sets)', () => {
    it('✅ UPDATE METADATA (200): Updates completed date, session notes, and check-in photos', async () => {
      const sessionId = 'sess_metadata_test';
      mockDb.sessions = [
        {
          id: sessionId,
          user_id: 'usr_setter',
          workout_id: 'wk_1',
          completed_at: new Date().toISOString(),
          notes: 'Old notes',
        },
      ];

      const newDate = new Date('2026-09-02T10:00:00Z');
      await updateSessionDate(sessionId, newDate);
      await updateSessionNotes(sessionId, 'Felt incredible energy throughout all sets.');
      await updateSessionPhotos(sessionId, ['https://storage/photo1.jpg', 'https://storage/photo2.jpg']);

      const history = await fetchWorkoutHistory('usr_setter');
      expect(history).toHaveLength(1);
      expect(history[0].notes).toBe('Felt incredible energy throughout all sets.');
      expect(history[0].photos).toHaveLength(2);
    });

    it('✅ READ SETS (200): Queries all individual exercise sets for a session', async () => {
      const sessionId = 'sess_with_sets';
      mockDb.sets = [
        { id: 'set_1', session_id: sessionId, user_id: 'usr_1', exercise_id: 'ex_1', set_number: 1, weight: 80, reps: 10 },
        { id: 'set_2', session_id: sessionId, user_id: 'usr_1', exercise_id: 'ex_1', set_number: 2, weight: 85, reps: 8 },
        { id: 'set_3', session_id: sessionId, user_id: 'usr_1', exercise_id: 'ex_2', set_number: 1, duration_seconds: 45 },
      ];

      const sets = await fetchSetsForSession(sessionId);
      expect(sets).toHaveLength(3);
      expect(sets[0].weight).toBe(80);
      expect(sets[1].reps).toBe(8);
      expect(sets[2].durationSeconds).toBe(45);
    });

    it('✅ DELETE (200 / 204): Cascades session deletion across both sessions and sets tables', async () => {
      mockDb.sessions = [{ id: 'sess_to_purge', user_id: 'usr_p' }];
      mockDb.sets = [{ id: 'set_to_purge', session_id: 'sess_to_purge', user_id: 'usr_p' }];

      await deleteSessions(['sess_to_purge']);

      expect(mockDb.sessions.find((s) => s.id === 'sess_to_purge')).toBeUndefined();
      expect(mockDb.sets.find((s) => s.session_id === 'sess_to_purge')).toBeUndefined();
    });

    it('❌ ERROR HANDLING (400/500): Catches database failures during batch exercise sync', async () => {
      shouldSimulateError = true;
      simulatedErrorMessage = 'Foreign key violation: exercises.user_id';

      const workout = workoutFactory.build({ name: 'Invalid Routine' });
      await expect(saveWorkoutsAndExercises('usr_err', [workout])).rejects.toThrow();
    });
  });

  // =========================================================================
  // 5. ENTITY: FOOD CATALOG ITEMS & DAILY DIETARY LOGS
  // =========================================================================
  describe('Entity 5: Dietary Food Catalog & Macro Logs (food_items)', () => {
    it('✅ CREATE (201): Saves custom user-created food items with macro specifications', async () => {
      const customMeal: FoodItemNutrition = {
        id: 'food_oatmeal_bowl',
        name: 'Whey Protein Oatmeal Bowl',
        brand: 'Custom Kitchen',
        servingUnit: 'gram',
        kcalPer100g: 360,
        proteinPer100g: 32,
        carbsPer100g: 50,
        sugarPer100g: 4,
        fatPer100g: 6,
        fiberPer100g: 8,
        isCustom: true,
        userId: 'usr_nutritionist',
      };

      const saved = await saveHiveMindFoodItem(customMeal, 'usr_nutritionist');
      expect(saved.name).toBe('Whey Protein Oatmeal Bowl');
      expect(mockDb.food_items).toHaveLength(1);
      expect(mockDb.food_items[0].kcal_per_100g).toBe(360);
    });

    it('✅ BATCH CREATE (201): Bulk saves grocery scraper items into Hive-Mind catalog', async () => {
      const items: FoodItemNutrition[] = [
        {
          id: 'food_chicken_breast',
          name: 'Chicken Breast Fillet',
          brand: 'AH',
          servingUnit: 'gram',
          kcalPer100g: 110,
          proteinPer100g: 24,
          carbsPer100g: 0,
          sugarPer100g: 0,
          fatPer100g: 1.5,
          fiberPer100g: 0,
        },
        {
          id: 'food_greek_yogurt',
          name: 'Greek Yogurt 0% Fat',
          brand: 'Fage',
          servingUnit: 'gram',
          kcalPer100g: 54,
          proteinPer100g: 10.3,
          carbsPer100g: 3.0,
          sugarPer100g: 3.0,
          fatPer100g: 0,
          fiberPer100g: 0,
        },
      ];

      await saveHiveMindFoodItems(items);
      expect(mockDb.food_items.length).toBeGreaterThanOrEqual(2);
    });

    it('✅ CALCULATE & LOG MACROS (200): Calculates portion macros and aggregates daily nutrition totals', () => {
      const chicken: FoodItemNutrition = {
        id: 'chk_1',
        name: 'Chicken Fillet',
        servingUnit: 'gram',
        kcalPer100g: 120,
        proteinPer100g: 25,
        carbsPer100g: 0,
        sugarPer100g: 0,
        fatPer100g: 2,
        fiberPer100g: 0,
      };

      // Calculate 250g portion
      const portion = calculatePortionNutrients(chicken, 250);
      expect(portion.calculatedKcal).toBe(300);
      expect(portion.calculatedProtein).toBe(62.5);
      expect(portion.calculatedFat).toBe(5);

      // Aggregate full daily log
      const log: DailyDietaryLog = {
        date: '2026-09-03',
        entries: [
          {
            id: 'entry_1',
            foodItemId: chicken.id,
            name: chicken.name,
            brand: chicken.brand,
            amountGrams: 250,
            kcalPer100g: chicken.kcalPer100g,
            proteinPer100g: chicken.proteinPer100g,
            carbsPer100g: chicken.carbsPer100g,
            sugarPer100g: chicken.sugarPer100g,
            fatPer100g: chicken.fatPer100g,
            fiberPer100g: chicken.fiberPer100g,
            ...portion,
            loggedAt: new Date().toISOString(),
          },
        ],
        totalKcal: 300,
        totalProtein: 62.5,
        totalCarbs: 0,
        totalSugar: 0,
        totalFat: 5,
        totalFiber: 0,
      };

      saveDailyDietaryLog('usr_macro_tracker', log);
      const loaded = getDailyDietaryLog('usr_macro_tracker', '2026-09-03');
      expect(loaded.totalProtein).toBe(62.5);
      expect(loaded.totalKcal).toBe(300);
    });

    it('❌ ERROR HANDLING (400/500): Throws error on database write rejection', async () => {
      shouldSimulateError = true;
      simulatedErrorMessage = 'Column "kcal_per_100g" exceeds numeric boundary';

      const item: FoodItemNutrition = {
        id: 'food_err',
        name: 'Corrupted Food Item',
        servingUnit: 'gram',
        kcalPer100g: -999,
        proteinPer100g: 0,
        carbsPer100g: 0,
        sugarPer100g: 0,
        fatPer100g: 0,
        fiberPer100g: 0,
      };

      await expect(saveHiveMindFoodItem(item, 'usr_err')).rejects.toThrow();
    });
  });
});
