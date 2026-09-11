import { supabase } from '../supabase.ts';
import { Exercise, Workout } from '../../models.ts';
import {
  DbExerciseRow,
  DbWorkoutExerciseRow,
  DbWorkoutRow,
} from '../../types/supabase.ts';

export async function seedTemplatesIfMissing(_userId?: string): Promise<void> {
  // Seeding is intentionally disabled; users manage routines directly.
}

export async function fetchWorkoutsData(userId?: string) {
  let workoutsList: Workout[] = [];
  let exercisesList: Exercise[] = [];

  if (!userId) {
    return { combinedWorkouts: [], workoutsList, exercisesList };
  }

  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('order', { ascending: true })
      .eq('user_id', userId);
    if (error) console.warn('Error fetching workouts:', error);

    const allWorkouts: Workout[] = ((data as DbWorkoutRow[]) || []).map((row) => ({
      id: String(row.id),
      name: row.name,
      order: row.order ?? row.day_number ?? 0,
      exerciseIds: Array.isArray(row.exercise_ids) ? row.exercise_ids : [],
    }));
    workoutsList = allWorkouts.filter((workout, index, list) =>
      index === list.findIndex((candidate) => candidate.order === workout.order)
    );
  } catch (error) {
    console.warn('Error fetching workouts from Supabase:', error);
  }

  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId);
    if (error) console.warn('Error fetching exercises:', error);

    exercisesList = ((data as (DbExerciseRow & { custom_cues?: unknown })[]) || []).map((row) => ({
      id: String(row.id),
      name: row.name,
      type: (row.type === 'timed' ? 'timed' : 'strength') as 'strength' | 'timed',
      targetSets: row.target_sets ?? 3,
      targetRepMin: row.target_rep_min ?? 8,
      targetRepMax: row.target_rep_max ?? 12,
      customCues: row.custom_cues || undefined,
    }));
  } catch (error) {
    console.warn('Error fetching exercises from Supabase:', error);
  }

  const junctionMap: Record<string, string[]> = {};
  try {
    const { data } = await supabase
      .from('workout_exercises')
      .select('workout_id, exercise_id, position')
      .eq('user_id', userId)
      .order('position', { ascending: true });
    for (const row of (data as DbWorkoutExerciseRow[]) || []) {
      (junctionMap[row.workout_id] ||= []).push(row.exercise_id);
    }
  } catch (error) {
    console.warn('Junction query note:', error);
  }

  const combinedWorkouts = workoutsList.map((workout) => {
    const exerciseIds = junctionMap[workout.id]?.length
      ? junctionMap[workout.id]
      : workout.exerciseIds || [];
    return {
      ...workout,
      exerciseIds,
      exercises: exerciseIds
        .map((id) => exercisesList.find((exercise) => exercise.id === id))
        .filter((exercise): exercise is Exercise => Boolean(exercise)),
    };
  });

  return { combinedWorkouts, workoutsList, exercisesList };
}

export async function fetchWorkoutById(userId: string, workoutId: string) {
  const { data: workoutData, error: workoutError } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', workoutId)
    .maybeSingle();
  if (workoutError || !workoutData) return null;

  const row = workoutData as DbWorkoutRow;
  const { data: junctionData } = await supabase
    .from('workout_exercises')
    .select('workout_id, exercise_id, position')
    .eq('user_id', userId)
    .eq('workout_id', workoutId)
    .order('position', { ascending: true });
  const ids = ((junctionData as DbWorkoutExerciseRow[]) || []).map((item) => item.exercise_id);
  const exerciseIds = ids.length ? ids : (Array.isArray(row.exercise_ids) ? row.exercise_ids : []);
  const { data: exerciseData } = exerciseIds.length
    ? await supabase.from('exercises').select('*').eq('user_id', userId).in('id', exerciseIds)
    : { data: [] };
  const exercises: Exercise[] = ((exerciseData as (DbExerciseRow & { custom_cues?: unknown })[]) || []).map((item) => ({
    id: String(item.id),
    name: item.name,
    type: (item.type === 'timed' ? 'timed' : 'strength') as 'strength' | 'timed',
    targetSets: item.target_sets ?? 3,
    targetRepMin: item.target_rep_min ?? 8,
    targetRepMax: item.target_rep_max ?? 12,
    customCues: item.custom_cues || undefined,
  }));
  const workout = {
    id: String(row.id),
    name: row.name,
    order: row.order ?? row.day_number ?? 0,
    exerciseIds,
    exercises: exerciseIds
      .map((id) => exercises.find((exercise) => exercise.id === id))
      .filter((exercise): exercise is Exercise => Boolean(exercise)),
  };
  return { combinedWorkouts: [workout], workoutsList: [workout], exercisesList: exercises };
}

export async function saveWorkoutsAndExercises(
  userId: string,
  updatedWorkouts: (Workout & { exercises: Exercise[] })[]
) {
  const exercises: Partial<DbExerciseRow>[] = [];
  const workouts: Partial<DbWorkoutRow>[] = [];
  const junctionRows: Partial<DbWorkoutExerciseRow>[] = [];

  updatedWorkouts.forEach((workout, workoutIndex) => {
    const workoutId = workout.id && !workout.id.startsWith('custom_w_')
      ? workout.id
      : `w_${Date.now()}_${workoutIndex}`;
    const exerciseIds: string[] = [];

    (workout.exercises || []).forEach((exercise, position) => {
      const exerciseId = exercise.id &&
        !exercise.id.startsWith('ex_') &&
        !exercise.id.startsWith('custom_')
        ? exercise.id
        : `ex_${Date.now()}_${workoutIndex}_${position}`;
      exerciseIds.push(exerciseId);
      exercises.push({
        id: exerciseId,
        name: exercise.name,
        type: exercise.type || 'strength',
        target_sets: exercise.targetSets ?? 3,
        target_rep_min: exercise.targetRepMin ?? 8,
        target_rep_max: exercise.targetRepMax ?? 12,
        user_id: userId,
        custom_cues: exercise.customCues || null,
      });
      junctionRows.push({
        workout_id: workoutId,
        exercise_id: exerciseId,
        position,
        user_id: userId,
      });
    });

    workouts.push({
      id: workoutId,
      name: workout.name,
      order: workout.order ?? workoutIndex + 1,
      user_id: userId,
      exercise_ids: exerciseIds,
    });
  });

  if (exercises.length > 0) {
    const { error } = await supabase.from('exercises').upsert(exercises);
    if (error) console.warn('Exercise upsert warning:', error);
  }

  const activeWorkoutIds = workouts.map((workout) => workout.id);
  if (activeWorkoutIds.length > 0) {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', userId)
      .not('id', 'in', `(${activeWorkoutIds.map((id) => `"${id}"`).join(',')})`);
    if (error) console.warn('Workouts cleanup warning:', error);
  } else {
    const { error } = await supabase.from('workouts').delete().eq('user_id', userId);
    if (error) console.warn('Workouts clear-all warning:', error);
  }

  if (workouts.length > 0) {
    const { error } = await supabase.from('workouts').upsert(workouts);
    if (error) throw new Error(`Failed to save workouts: ${error.message}`);
  }

  try {
    await supabase.from('workout_exercises').delete().eq('user_id', userId);
    if (junctionRows.length > 0) {
      await supabase.from('workout_exercises').insert(junctionRows);
    }
  } catch (error) {
    console.warn('Junction table sync note:', error);
  }
}
