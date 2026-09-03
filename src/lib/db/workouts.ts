import { supabase } from '../supabase.ts';
import { Workout, Exercise, UserProfile } from '../../models.ts';

export async function seedTemplatesIfMissing(_userId?: string) {
  return;
}

export async function fetchWorkoutsData(userId?: string) {
  let workoutsList: Workout[] = [];
  let exercisesList: Exercise[] = [];

  if (!userId) {
    return { combinedWorkouts: [], workoutsList: [], exercisesList: [] };
  }

  try {
    const query = supabase
      .from('workouts')
      .select('*')
      .order('order', { ascending: true })
      .eq('user_id', userId);

    const { data: workoutsRaw, error: wError } = await query;
    if (wError) console.warn('Error fetching workouts:', wError);

    const allWorkouts: Workout[] = (workoutsRaw || []).map((w: any) => ({
      id: String(w.id),
      name: w.name,
      order: w.order ?? w.day_number ?? 0,
      exerciseIds: Array.isArray(w.exercise_ids) ? w.exercise_ids : [],
    }));

    workoutsList = allWorkouts.filter((w, i, self) =>
      i === self.findIndex((t) => t.order === w.order)
    );
  } catch (e) {
    console.warn('Error fetching workouts from supabase:', e);
  }

  try {
    const { data: exercisesRaw, error: eError } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId);

    if (eError) console.warn('Error fetching exercises:', eError);

    exercisesList = (exercisesRaw || []).map((e: any) => ({
      id: String(e.id),
      name: e.name,
      type: e.type,
      targetSets: e.target_sets,
      targetRepMin: e.target_rep_min,
      targetRepMax: e.target_rep_max,
      description: e.description,
    }));
  } catch (e) {
    console.warn('Error fetching exercises from supabase:', e);
  }

  const exerciseMap = new Map<string, Exercise>();
  exercisesList.forEach((e) => exerciseMap.set(e.id, e));

  const combinedWorkouts = workoutsList.map((w) => {
    const exList = (w.exerciseIds || [])
      .map((id) => exerciseMap.get(id))
      .filter((e): e is Exercise => !!e);

    return {
      ...w,
      exercises: exList,
    };
  });

  return { combinedWorkouts, workoutsList, exercisesList };
}

export async function saveWorkoutsAndExercises(
  userId: string,
  updatedWorkouts: (Workout & { exercises: Exercise[] })[]
) {
  try {
    const allExercises: Exercise[] = [];
    const exerciseIdMap = new Map<string, Exercise>();

    updatedWorkouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        if (!exerciseIdMap.has(ex.id)) {
          exerciseIdMap.set(ex.id, ex);
          allExercises.push(ex);
        }
      });
    });

    if (allExercises.length > 0) {
      const exerciseRows = allExercises.map((e) => ({
        id: e.id,
        user_id: userId,
        name: e.name,
        type: e.type,
        target_sets: e.targetSets,
        target_rep_min: e.targetRepMin,
        target_rep_max: e.targetRepMax,
      }));

      const { error: exError } = await supabase
        .from('exercises')
        .upsert(exerciseRows, { onConflict: 'id' });

      if (exError) throw exError;
    }

    const workoutRows = updatedWorkouts.map((w) => ({
      id: w.id,
      user_id: userId,
      name: w.name,
      order: w.order,
      exercise_ids: w.exercises.map((e) => e.id),
    }));

    const { error: wError } = await supabase
      .from('workouts')
      .upsert(workoutRows, { onConflict: 'id' });

    if (wError) throw wError;
  } catch (err: any) {
    console.error('Failed to save routines and exercises to Supabase:', err);
    throw err;
  }
}
