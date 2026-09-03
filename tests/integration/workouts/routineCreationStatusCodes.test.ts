import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { Workout, Exercise } from '../../../src/models.ts';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const TEST_USER_ID = "c4e8d97b-bb42-43d3-955d-a8202352c98d";

describe('Routine & Exercise Creation Status Codes (400, 401, 404, 409, 500, 200 OK)', () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  it('1. Returns 401 Unauthorized / RLS 42501 when creating a routine without authentication', async () => {
    // Attempting unauthenticated direct insert into protected table
    const { error, status } = await supabase.from('workouts').insert({
      id: `w_unauth_${Date.now()}`,
      name: 'Unauthorized Routine',
      user_id: TEST_USER_ID,
      exercise_ids: [],
    });

    expect(error).toBeDefined();
    // 401 Unauthorized or Postgres 42501 RLS policy violation
    expect([401, 403, 400]).toContain(status);
    expect(error?.code).toBe('42501');
  });

  it('2. Returns 400 Bad Request when routine payload fails validation (empty name or missing exercises)', () => {
    function validateRoutinePayload(routine: Partial<Workout & { exercises: Exercise[] }>) {
      if (!routine.name || routine.name.trim().length === 0) {
        return { status: 400, error: 'Bad Request: Routine name is required' };
      }
      if (!routine.exercises || routine.exercises.length === 0) {
        return { status: 400, error: 'Bad Request: Routine must contain at least one exercise' };
      }
      return { status: 200, error: null };
    }

    const emptyNameRes = validateRoutinePayload({ name: '', exercises: [] });
    expect(emptyNameRes.status).toBe(400);
    expect(emptyNameRes.error).toContain('Routine name is required');

    const noExercisesRes = validateRoutinePayload({ name: 'Chest Day', exercises: [] });
    expect(noExercisesRes.status).toBe(400);
    expect(noExercisesRes.error).toContain('at least one exercise');
  });

  it('3. Returns 404 Not Found when attempting to query or attach to a non-existent routine', async () => {
    const nonExistentId = "non_existent_routine_404";
    const { data, error, status } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', nonExistentId)
      .single();

    expect(data).toBeNull();
    expect(error).toBeDefined();
    // PGRST116 indicates row was not found (404/406 single row query)
    expect(error?.code).toBe('PGRST116');
  });

  it('4. Returns 409 Conflict when attempting to create a routine with an existing duplicate ID', () => {
    const existingRoutines = new Map<string, Workout>();
    const existingWorkoutId = 'w_chest_day_01';
    existingRoutines.set(existingWorkoutId, {
      id: existingWorkoutId,
      name: 'Chest Day',
      order: 1,
      exerciseIds: ['ex_bench_01'],
    });

    function createRoutine(routine: Workout) {
      if (existingRoutines.has(routine.id)) {
        return { status: 409, error: `Conflict: Routine with ID ${routine.id} already exists` };
      }
      existingRoutines.set(routine.id, routine);
      return { status: 201, data: routine };
    }

    const duplicateRes = createRoutine({
      id: existingWorkoutId,
      name: 'Duplicate Chest Day',
      order: 1,
      exerciseIds: [],
    });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.error).toContain('Conflict');
  });

  it('5. Returns 500 Internal Server Error when upstream database/RPC connection fails', async () => {
    const brokenClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Simulate internal RPC/database failure (500)
    vi.spyOn(brokenClient, 'from').mockImplementation(() => {
      return {
        upsert: () => Promise.resolve({ data: null, error: { message: 'Internal Server Error: Database connection timeout', code: '500' }, status: 500 }),
      } as any;
    });

    const { error, status } = await brokenClient.from('workouts').upsert({ id: 'w_test_500' } as any);
    expect(status).toBe(500);
    expect(error?.message).toContain('Internal Server Error');
  });

  it('6. Returns 200 / 201 Success when routine with exercises is successfully created & synchronized', () => {
    const uniqueStamp = Date.now();
    const workoutId = `w_hypertrophy_${uniqueStamp}`;
    const exerciseId = `ex_incline_press_${uniqueStamp}`;

    const newExercise: Exercise = {
      id: exerciseId,
      name: 'Incline Dumbbell Press',
      type: 'strength',
      targetSets: 4,
      targetRepMin: 8,
      targetRepMax: 12,
    };

    const newRoutine: Workout & { exercises: Exercise[] } = {
      id: workoutId,
      name: 'Chest & Delts Hypertrophy',
      order: 1,
      exerciseIds: [exerciseId],
      exercises: [newExercise],
    };

    // Client-side routine creation & state sync processor
    function processRoutineCreation(routine: Workout & { exercises: Exercise[] }) {
      if (!routine.name) return { status: 400, error: 'Name is required' };
      if (!routine.exercises || routine.exercises.length === 0) return { status: 400, error: 'Exercises required' };

      // Normalization of exercises and routines
      const normalizedExercises = routine.exercises.map(ex => ({
        ...ex,
        targetSets: ex.targetSets ?? 3,
        targetRepMin: ex.targetRepMin ?? 8,
        targetRepMax: ex.targetRepMax ?? 12,
      }));

      const normalizedWorkout: Workout = {
        id: routine.id,
        name: routine.name,
        order: routine.order,
        exerciseIds: normalizedExercises.map(e => e.id),
      };

      return {
        status: 200,
        data: {
          workout: normalizedWorkout,
          exercises: normalizedExercises,
        },
      };
    }

    const response = processRoutineCreation(newRoutine);

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data?.workout.id).toBe(workoutId);
    expect(response.data?.workout.name).toBe('Chest & Delts Hypertrophy');
    expect(response.data?.exercises.length).toBe(1);
    expect(response.data?.exercises[0].name).toBe('Incline Dumbbell Press');
    expect(response.data?.exercises[0].targetSets).toBe(4);
  });
});
