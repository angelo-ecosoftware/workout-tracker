import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchWorkoutsData, saveWorkoutsAndExercises } from '../../../src/lib/db/workouts.ts';
import { Workout, Exercise } from '../../../src/models.ts';

// -----------------------------------------------------------------------------
// In-Memory Database Store for Workouts & Exercises
// -----------------------------------------------------------------------------
let mockWorkoutsTable: any[] = [];
let mockExercisesTable: any[] = [];
let mockWorkoutExercisesTable: any[] = [];
let shouldSimulateDbError = false;
let simulatedDbErrorMessage = 'Foreign key constraint violation (500)';

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
      upsert: vi.fn((payload: any) => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
        }
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const target = table === 'workouts' ? mockWorkoutsTable : mockExercisesTable;
          const idx = target.findIndex((r) => r.id === item.id && r.user_id === item.user_id);
          if (idx >= 0) {
            target[idx] = { ...target[idx], ...item };
          } else {
            target.push({ ...item });
          }
        });
        return Promise.resolve({ data: items, error: null, status: 200 });
      }),
      insert: vi.fn((payload: any[]) => {
        if (shouldSimulateDbError) {
          return Promise.reject(new Error(simulatedDbErrorMessage));
        }
        if (table === 'workout_exercises') {
          mockWorkoutExercisesTable.push(...payload);
        }
        return Promise.resolve({ data: payload, error: null, status: 201 });
      }),
      delete: vi.fn(() => {
        const deleteBuilder: any = {
          _eq: [] as { field: string; value: any }[],
          _not: [] as { field: string; values: string[] }[],
          eq: (field: string, value: any) => {
            deleteBuilder._eq.push({ field, value });
            return deleteBuilder;
          },
          in: (field: string, values: any[]) => {
            deleteBuilder._not.push({ field, values: values.map(String) });
            return deleteBuilder;
          },
          not: (field: string, _operator: string, value: string) => {
            deleteBuilder._not.push({
              field,
              values: value.replace(/[()"]/g, '').split(',').filter(Boolean),
            });
            return deleteBuilder;
          },
          then: (onfulfilled: any) => {
            if (shouldSimulateDbError) {
              return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }).then(onfulfilled);
            }
            const target = table === 'workouts'
              ? mockWorkoutsTable
              : table === 'exercises'
                ? mockExercisesTable
                : mockWorkoutExercisesTable;
            const before = target.length;
            const retained = target.filter((row) =>
              !deleteBuilder._eq.some((filter: any) => row[filter.field] === filter.value) ||
              deleteBuilder._not.some((filter: any) => filter.field === 'id' && filter.values.includes(String(row.id)))
            );
            if (table === 'workouts') mockWorkoutsTable = retained;
            if (table === 'exercises') mockExercisesTable = retained;
            if (table === 'workout_exercises') mockWorkoutExercisesTable = retained;
            return Promise.resolve({
              data: { count: before - retained.length },
              error: null,
              status: 200,
            }).then(onfulfilled);
          },
        };
        return deleteBuilder;
      }),
      then: (onfulfilled: any) => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }).then(onfulfilled);
        }
        let data =
          table === 'workouts'
            ? [...mockWorkoutsTable]
            : table === 'workout_exercises'
              ? [...mockWorkoutExercisesTable]
              : [...mockExercisesTable];
        for (const f of builder._filters) {
          data = data.filter((r) => r[f.field] === f.val);
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

describe('Entities: Workouts & Exercises (workouts, exercises) - Complete CRUD Matrix', () => {
  beforeEach(() => {
    mockWorkoutsTable = [];
    mockExercisesTable = [];
    mockWorkoutExercisesTable = [];
    shouldSimulateDbError = false;
    vi.clearAllMocks();
  });

  const userId = 'usr_strength_builder';

  const samplePushWorkout: Workout & { exercises: Exercise[] } = {
    id: 'w_push_1',
    name: 'Day 1 - Heavy Push',
    order: 1,
    exerciseIds: ['ex_bench', 'ex_incline'],
    exercises: [
      {
        id: 'ex_bench',
        name: 'Barbell Flat Bench Press',
        targetSets: 4,
        targetRepMin: 6,
        targetRepMax: 8,
        type: 'strength',
      },
      {
        id: 'ex_incline',
        name: 'Incline Dumbbell Press',
        targetSets: 3,
        targetRepMin: 8,
        targetRepMax: 10,
        type: 'strength',
      },
    ],
  };

  // =========================================================================
  // 1. CREATE / INSERT
  // =========================================================================
  describe('1. CREATE / INSERT Operations', () => {
    it('200 OK: Persists structured workout split and all child exercises', async () => {
      await saveWorkoutsAndExercises(userId, [samplePushWorkout]);

      expect(mockWorkoutsTable).toHaveLength(1);
      expect(mockWorkoutsTable[0].name).toBe('Day 1 - Heavy Push');
      expect(mockWorkoutsTable[0].exercise_ids).toHaveLength(2);
      expect(mockWorkoutsTable[0].exercise_ids.every((id: string) => id.startsWith('ex_'))).toBe(true);

      expect(mockExercisesTable).toHaveLength(2);
      expect(mockExercisesTable[0].name).toBe('Barbell Flat Bench Press');
      expect(mockExercisesTable[1].name).toBe('Incline Dumbbell Press');
      expect(mockWorkoutExercisesTable).toHaveLength(2);
      expect(mockWorkoutExercisesTable.map((row) => row.exercise_id))
        .toEqual(mockWorkoutsTable[0].exercise_ids);
    });

    it('500 Internal Server Error: Catches database exception when exercise creation fails', async () => {
      shouldSimulateDbError = true;
      await expect(saveWorkoutsAndExercises(userId, [samplePushWorkout])).rejects.toThrow(
        /Foreign key constraint violation/
      );
    });
  });

  // =========================================================================
  // 2. READ / QUERY
  // =========================================================================
  describe('2. READ / QUERY Operations', () => {
    beforeEach(async () => {
      await saveWorkoutsAndExercises(userId, [samplePushWorkout]);
      await saveWorkoutsAndExercises('other_user', [
        {
          id: 'w_other',
          name: 'Other Routine',
          order: 1,
          exerciseIds: ['ex_other'],
          exercises: [{ id: 'ex_other', name: 'Other Ex', targetSets: 3, targetRepMin: 10, targetRepMax: 12, type: 'strength' }],
        },
      ]);
    });

    it('200 OK: Fetches combined workouts and linked exercises for authenticated user', async () => {
      const data = await fetchWorkoutsData(userId);

      expect(data.combinedWorkouts).toHaveLength(1);
      expect(data.combinedWorkouts[0].name).toBe('Day 1 - Heavy Push');
      expect(data.combinedWorkouts[0].exercises).toHaveLength(2);
      expect(data.combinedWorkouts[0].exercises[0].name).toBe('Barbell Flat Bench Press');
      expect(data.combinedWorkouts[0].exercises[1].name).toBe('Incline Dumbbell Press');

      // Ensures other_user workouts are isolated
      expect(data.workoutsList.some((w) => w.id === 'w_other')).toBe(false);
    });

    it('404 / Empty State: Safely returns empty arrays for user without routines', async () => {
      const data = await fetchWorkoutsData('usr_brand_new');
      expect(data.combinedWorkouts).toEqual([]);
      expect(data.workoutsList).toEqual([]);
      expect(data.exercisesList).toEqual([]);
    });

    it('400 Bad Request / Unauthenticated: Returns empty arrays when userId is undefined', async () => {
      const data = await fetchWorkoutsData(undefined);
      expect(data.combinedWorkouts).toEqual([]);
    });
  });

  // =========================================================================
  // 3. UPDATE / MUTATE
  // =========================================================================
  describe('3. UPDATE / MUTATE Operations', () => {
    beforeEach(async () => {
      await saveWorkoutsAndExercises(userId, [samplePushWorkout]);
    });

    it('200 OK: Mutates routine name and adds a new exercise to the split', async () => {
      const updatedWorkout: Workout & { exercises: Exercise[] } = {
        ...samplePushWorkout,
        name: 'Day 1 - Chest & Triceps Hypertrophy',
        exerciseIds: ['ex_bench', 'ex_incline', 'ex_triceps'],
        exercises: [
          ...samplePushWorkout.exercises,
          {
            id: 'ex_triceps',
            name: 'Cable Triceps Pushdown',
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
            type: 'strength',
          },
        ],
      };

      await saveWorkoutsAndExercises(userId, [updatedWorkout]);

      const data = await fetchWorkoutsData(userId);
      expect(data.combinedWorkouts[0].name).toBe('Day 1 - Chest & Triceps Hypertrophy');
      expect(data.combinedWorkouts[0].exercises).toHaveLength(3);
      expect(data.combinedWorkouts[0].exercises[2].name).toBe('Cable Triceps Pushdown');
    });
  });

  // =========================================================================
  // 4. DELETE / CASCADE
  // =========================================================================
  describe('4. DELETE Operations', () => {
    it('200 OK: Deletes workouts and exercise templates', async () => {
      const { supabase } = await import('../../../src/lib/supabase.ts');
      await saveWorkoutsAndExercises(userId, [samplePushWorkout]);

      await supabase.from('workouts').delete().eq('user_id', userId);
      await supabase.from('exercises').delete().eq('user_id', userId);

      expect(mockWorkoutsTable).toHaveLength(0);
      expect(mockExercisesTable).toHaveLength(0);
    });
  });
});
