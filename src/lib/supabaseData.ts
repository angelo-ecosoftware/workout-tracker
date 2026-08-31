import { supabase } from './supabase.ts';
import { UserProfile, Workout, Session, WorkoutSet, Exercise, LastSetSummary } from '../models.ts';
import { SessionEngine, SetLogger } from '../engine.ts';

// Get or create user profile
export async function initializeUser(userId: string, email: string) {
  const isV9User = userId === '2b4bd23c-ceff-460d-a73b-2c531686e3b2';

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (!data) {
    const newUser: UserProfile = {
      userId,
      email,
      name: email.split('@')[0] || 'Athlete',
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: isV9User ? 4 : 3,
      lastSetSummaryPerExercise: {},
      onboardingCompleted: isV9User ? true : false,
      trainingDaysPerWeek: isV9User ? 4 : undefined,
      createdAt: new Date(),
    };

    const { error: insertError } = await supabase.from('users').upsert({
      id: userId,
      user_id: userId,
      email,
      name: newUser.name,
      last_completed_workout_order: 0,
      max_workout_order: isV9User ? 4 : 3,
      last_set_summary_per_exercise: {},
      onboarding_completed: isV9User ? true : false,
      training_days_per_week: isV9User ? 4 : null,
      created_at: newUser.createdAt.toISOString(),
    }, { onConflict: 'id' });

    if (insertError) {
      console.warn('initializeUser upsert warning:', insertError);
    }

    return newUser;
  }

  const isV9 = (data.user_id === '2b4bd23c-ceff-460d-a73b-2c531686e3b2' || data.id === '2b4bd23c-ceff-460d-a73b-2c531686e3b2');
  return {
    userId: data.user_id || data.id || userId,
    email: data.email,
    name: data.name || data.email?.split('@')[0] || '',
    lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
    maxWorkoutOrder: data.max_workout_order ?? (isV9 ? 4 : 3),
    lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
    onboardingCompleted: data.onboarding_completed ?? (isV9 ? true : false),
    trainingDaysPerWeek: data.training_days_per_week ?? (isV9 ? 4 : undefined),
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  } as UserProfile;
}

// Ensure the static workouts/exercises templates exist in Supabase
export async function seedTemplatesIfMissing(userId?: string) {
  // If user is the specific v9 user, seed the v9_spartan 4-day split routines & exercises
  if (userId === '2b4bd23c-ceff-460d-a73b-2c531686e3b2') {
    const exercisesV9 = [
      // Day 1
      { id: 'd1_e1_v9', user_id: userId, name: 'Bench Press (barbell or dumbbell)', type: 'strength', target_sets: 4, target_rep_min: 6, target_rep_max: 10 },
      { id: 'd1_e2_v9', user_id: userId, name: 'Pull-ups / Lat Pulldown', type: 'strength', target_sets: 4, target_rep_min: 6, target_rep_max: 10 },
      { id: 'd1_e3_v9', user_id: userId, name: 'Overhead Press', type: 'strength', target_sets: 3, target_rep_min: 6, target_rep_max: 10 },
      { id: 'd1_e4_v9', user_id: userId, name: 'Seated Cable Row / Dumbbell Row', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
      { id: 'd1_e5_v9', user_id: userId, name: 'Lateral Raises', type: 'strength', target_sets: 4, target_rep_min: 12, target_rep_max: 20 },
      { id: 'd1_e6_v9', user_id: userId, name: 'Push-up Ladder', type: 'strength', target_sets: 4, target_rep_min: 12, target_rep_max: 15 },
      { id: 'd1_e7_v9', user_id: userId, name: 'Triceps Pushdown or Dips', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
      // Day 2
      { id: 'd2_e1_v9', user_id: userId, name: 'Back Squat or Goblet Squat', type: 'strength', target_sets: 4, target_rep_min: 6, target_rep_max: 10 },
      { id: 'd2_e2_v9', user_id: userId, name: 'Romanian Deadlift', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 10 },
      { id: 'd2_e3_v9', user_id: userId, name: 'Bulgarian Split Squat', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
      { id: 'd2_e4_v9', user_id: userId, name: 'Leg Curl (machine or Nordic)', type: 'strength', target_sets: 3, target_rep_min: 10, target_rep_max: 15 },
      { id: 'd2_e5_v9', user_id: userId, name: 'Hanging Knee Raises', type: 'strength', target_sets: 3, target_rep_min: 10, target_rep_max: 15 },
      { id: 'd2_e6_v9', user_id: userId, name: 'Plank', type: 'timed', target_sets: 3, target_rep_min: 45, target_rep_max: 60 },
      { id: 'd2_e7_v9', user_id: userId, name: 'Conditioning Block (10 min)', type: 'timed', target_sets: 10, target_rep_min: 30, target_rep_max: 30 },
      // Day 3
      { id: 'd3_e1_v9', user_id: userId, name: 'Incline Dumbbell Press', type: 'strength', target_sets: 4, target_rep_min: 8, target_rep_max: 12 },
      { id: 'd3_e2_v9', user_id: userId, name: 'Pull-ups / Lat Pulldown', type: 'strength', target_sets: 4, target_rep_min: 8, target_rep_max: 12 },
      { id: 'd3_e3_v9', user_id: userId, name: 'Dumbbell Shoulder Press', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
      { id: 'd3_e4_v9', user_id: userId, name: 'Chest-Supported Row or Rear-Delt Fly', type: 'strength', target_sets: 3, target_rep_min: 12, target_rep_max: 20 },
      { id: 'd3_e5_v9', user_id: userId, name: 'Lateral Raises', type: 'strength', target_sets: 4, target_rep_min: 12, target_rep_max: 20 },
      { id: 'd3_e6_v9', user_id: userId, name: 'Hammer Curls', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
      { id: 'd3_e7_v9', user_id: userId, name: 'Push-up Ladder', type: 'strength', target_sets: 4, target_rep_min: 12, target_rep_max: 15 },
      // Day 4
      { id: 'd4_e1_v9', user_id: userId, name: 'Deadlift or Romanian Deadlift', type: 'strength', target_sets: 3, target_rep_min: 5, target_rep_max: 8 },
      { id: 'd4_e2_v9', user_id: userId, name: 'Front Squat or Leg Press', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
      { id: 'd4_e3_v9', user_id: userId, name: 'Walking Lunges', type: 'strength', target_sets: 3, target_rep_min: 10, target_rep_max: 10 },
      { id: 'd4_e4_v9', user_id: userId, name: 'Calf Raises', type: 'strength', target_sets: 3, target_rep_min: 10, target_rep_max: 15 },
      { id: 'd4_e5_v9', user_id: userId, name: 'Ab-Wheel Rollout or Hanging Leg Raises', type: 'strength', target_sets: 3, target_rep_min: 6, target_rep_max: 15 },
      { id: 'd4_e6_v9', user_id: userId, name: 'Conditioning Block (10 min)', type: 'timed', target_sets: 10, target_rep_min: 30, target_rep_max: 30 },
    ];

    try {
      await supabase.from('exercises').upsert(exercisesV9);
    } catch (e) {
      console.warn('Exercises upsert warning:', e);
    }

    const workoutsV9 = [
      {
        id: 'v9_w1',
        user_id: userId,
        name: 'Day 1 - Upper Body A',
        order: 1,
        exercise_ids: ['d1_e1_v9', 'd1_e2_v9', 'd1_e3_v9', 'd1_e4_v9', 'd1_e5_v9', 'd1_e6_v9', 'd1_e7_v9'],
      },
      {
        id: 'v9_w2',
        user_id: userId,
        name: 'Day 2 - Lower Body A + Abs',
        order: 2,
        exercise_ids: ['d2_e1_v9', 'd2_e2_v9', 'd2_e3_v9', 'd2_e4_v9', 'd2_e5_v9', 'd2_e6_v9', 'd2_e7_v9'],
      },
      {
        id: 'v9_w3',
        user_id: userId,
        name: 'Day 3 - Upper Body B',
        order: 3,
        exercise_ids: ['d3_e1_v9', 'd3_e2_v9', 'd3_e3_v9', 'd3_e4_v9', 'd3_e5_v9', 'd3_e6_v9', 'd3_e7_v9'],
      },
      {
        id: 'v9_w4',
        user_id: userId,
        name: 'Day 4 - Lower Body B + Abs',
        order: 4,
        exercise_ids: ['d4_e1_v9', 'd4_e2_v9', 'd4_e3_v9', 'd4_e4_v9', 'd4_e5_v9', 'd4_e6_v9'],
      },
    ];

    try {
      await supabase.from('workouts').upsert(workoutsV9);
    } catch (e) {
      console.warn('Workouts upsert warning:', e);
    }
    return;
  }

  // For other/new users: do not automatically seed default workouts or exercises (keep empty)
  return;
}

export async function fetchWorkoutsData(userId?: string) {
  // Hardcoded fallback definitions for v9_spartan ONLY for user 2b4bd23c-ceff-460d-a73b-2c531686e3b2
  const isV9TargetUser = userId === '2b4bd23c-ceff-460d-a73b-2c531686e3b2';

  const v9FallbackWorkouts: Workout[] = [
    {
      id: 'v9_w1',
      name: 'Day 1 - Upper Body A',
      order: 1,
      exerciseIds: ['d1_e1_v9', 'd1_e2_v9', 'd1_e3_v9', 'd1_e4_v9', 'd1_e5_v9', 'd1_e6_v9', 'd1_e7_v9'],
    },
    {
      id: 'v9_w2',
      name: 'Day 2 - Lower Body A + Abs',
      order: 2,
      exerciseIds: ['d2_e1_v9', 'd2_e2_v9', 'd2_e3_v9', 'd2_e4_v9', 'd2_e5_v9', 'd2_e6_v9', 'd2_e7_v9'],
    },
    {
      id: 'v9_w3',
      name: 'Day 3 - Upper Body B',
      order: 3,
      exerciseIds: ['d3_e1_v9', 'd3_e2_v9', 'd3_e3_v9', 'd3_e4_v9', 'd3_e5_v9', 'd3_e6_v9', 'd3_e7_v9'],
    },
    {
      id: 'v9_w4',
      name: 'Day 4 - Lower Body B + Abs',
      order: 4,
      exerciseIds: ['d4_e1_v9', 'd4_e2_v9', 'd4_e3_v9', 'd4_e4_v9', 'd4_e5_v9', 'd4_e6_v9'],
    },
  ];

  const v9FallbackExercises: Exercise[] = [
    { id: 'd1_e1_v9', name: 'Bench Press (barbell or dumbbell)', type: 'strength', targetSets: 4, targetRepMin: 6, targetRepMax: 10 },
    { id: 'd1_e2_v9', name: 'Pull-ups / Lat Pulldown', type: 'strength', targetSets: 4, targetRepMin: 6, targetRepMax: 10 },
    { id: 'd1_e3_v9', name: 'Overhead Press', type: 'strength', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
    { id: 'd1_e4_v9', name: 'Seated Cable Row / Dumbbell Row', type: 'strength', targetSets: 3, targetRepMin: 8, target_rep_max: 12 } as any,
    { id: 'd1_e5_v9', name: 'Lateral Raises', type: 'strength', targetSets: 4, targetRepMin: 12, targetRepMax: 20 },
    { id: 'd1_e6_v9', name: 'Push-up Ladder', type: 'strength', targetSets: 4, targetRepMin: 12, targetRepMax: 15 },
    { id: 'd1_e7_v9', name: 'Triceps Pushdown or Dips', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
    { id: 'd2_e1_v9', name: 'Back Squat or Goblet Squat', type: 'strength', targetSets: 4, targetRepMin: 6, targetRepMax: 10 },
    { id: 'd2_e2_v9', name: 'Romanian Deadlift', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 10 },
    { id: 'd2_e3_v9', name: 'Bulgarian Split Squat', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
    { id: 'd2_e4_v9', name: 'Leg Curl (machine or Nordic)', type: 'strength', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
    { id: 'd2_e5_v9', name: 'Hanging Knee Raises', type: 'strength', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
    { id: 'd2_e6_v9', name: 'Plank', type: 'timed', targetSets: 3, targetRepMin: 45, targetRepMax: 60 },
    { id: 'd2_e7_v9', name: 'Conditioning Block (10 min)', type: 'timed', targetSets: 10, targetRepMin: 30, targetRepMax: 30 },
    { id: 'd3_e1_v9', name: 'Incline Dumbbell Press', type: 'strength', targetSets: 4, targetRepMin: 8, targetRepMax: 12 },
    { id: 'd3_e2_v9', name: 'Pull-ups / Lat Pulldown', type: 'strength', targetSets: 4, targetRepMin: 8, targetRepMax: 12 },
    { id: 'd3_e3_v9', name: 'Dumbbell Shoulder Press', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
    { id: 'd3_e4_v9', name: 'Chest-Supported Row or Rear-Delt Fly', type: 'strength', targetSets: 3, targetRepMin: 12, targetRepMax: 20 },
    { id: 'd3_e5_v9', name: 'Lateral Raises', type: 'strength', targetSets: 4, targetRepMin: 12, targetRepMax: 20 },
    { id: 'd3_e6_v9', name: 'Hammer Curls', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
    { id: 'd3_e7_v9', name: 'Push-up Ladder', type: 'strength', targetSets: 4, targetRepMin: 12, targetRepMax: 15 },
    { id: 'd4_e1_v9', name: 'Deadlift or Romanian Deadlift', type: 'strength', targetSets: 3, targetRepMin: 5, targetRepMax: 8 },
    { id: 'd4_e2_v9', name: 'Front Squat or Leg Press', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
    { id: 'd4_e3_v9', name: 'Walking Lunges', type: 'strength', targetSets: 3, targetRepMin: 10, targetRepMax: 10 },
    { id: 'd4_e4_v9', name: 'Calf Raises', type: 'strength', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
    { id: 'd4_e5_v9', name: 'Ab-Wheel Rollout or Hanging Leg Raises', type: 'strength', targetSets: 3, targetRepMin: 6, targetRepMax: 15 },
    { id: 'd4_e6_v9', name: 'Conditioning Block (10 min)', type: 'timed', targetSets: 10, targetRepMin: 30, targetRepMax: 30 },
  ].map((e: any) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    targetSets: e.targetSets,
    targetRepMin: e.targetRepMin,
    targetRepMax: e.targetRepMax || 12,
  }));

  let workoutsList: Workout[] = [];
  let exercisesList: Exercise[] = [];

  // For any non-v9 user / new user: keep workouts and exercises empty/null
  if (!isV9TargetUser) {
    return { combinedWorkouts: [], workoutsList: [], exercisesList: [] };
  }

  try {
    let query = supabase
      .from('workouts')
      .select('*')
      .order('order', { ascending: true })
      .eq('user_id', userId);

    const { data: workoutsRaw } = await query;
    let rawList = workoutsRaw;

    const allWorkouts: Workout[] = (rawList || []).map((w: any) => ({
      id: String(w.id),
      name: w.name,
      order: w.order ?? w.day_number ?? 0,
      exerciseIds: w.exercise_ids || [],
    }));

    workoutsList = allWorkouts.filter((w, i, self) =>
      i === self.findIndex((t) => t.order === w.order)
    );
  } catch (e) {
    console.warn('Error fetching workouts from supabase:', e);
  }

  try {
    let exQuery = supabase.from('exercises').select('*').eq('user_id', userId);
    let { data: exercisesRaw } = await exQuery;

    exercisesList = (exercisesRaw || []).map((e: any) => ({
      id: String(e.id),
      name: e.name,
      type: e.type || 'strength',
      targetSets: e.target_sets ?? e.targetSets ?? 3,
      targetRepMin: e.target_rep_min ?? e.targetRepMin ?? 8,
      targetRepMax: e.target_rep_max ?? e.targetRepMax ?? 12,
    }));
  } catch (e) {
    console.warn('Error fetching exercises from supabase:', e);
  }

  // Fallback ONLY for v9 user if DB returns empty
  if (workoutsList.length === 0) {
    workoutsList = v9FallbackWorkouts;
  }
  if (exercisesList.length === 0) {
    exercisesList = v9FallbackExercises;
  }

  const combinedWorkouts = workoutsList.map((w) => {
    const wExercises = (w.exerciseIds || [])
      .map((eid) => exercisesList.find((e) => e.id === eid))
      .filter(Boolean) as Exercise[];
    return {
      ...w,
      exercises: wExercises,
    };
  });

  return { combinedWorkouts, workoutsList, exercisesList };
}

export async function getUserProgressState(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .or(`user_id.eq.${userId},id.eq.${userId}`)
    .single();

  if (!data) {
    await seedTemplatesIfMissing(userId);
    const { data: authUser } = await supabase.auth.getUser();
    return await initializeUser(userId, authUser?.user?.email || '');
  }

  const isV9User = (data.user_id === '2b4bd23c-ceff-460d-a73b-2c531686e3b2' || data.id === '2b4bd23c-ceff-460d-a73b-2c531686e3b2');

  return {
    userId: data.user_id || data.id || userId,
    email: data.email,
    name: data.name || data.email?.split('@')[0] || '',
    lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
    maxWorkoutOrder: data.max_workout_order ?? (isV9User ? 4 : 3),
    lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
    onboardingCompleted: data.onboarding_completed ?? (isV9User ? true : false),
    trainingDaysPerWeek: data.training_days_per_week ?? (isV9User ? 4 : undefined),
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  } as UserProfile;
}

export async function saveUserOnboarding(userId: string, daysPerWeek: number) {
  const { data: authUser } = await supabase.auth.getUser();
  const email = authUser?.user?.email || '';

  // Upsert ensures that both id and user_id are set and satisfy not-null constraints
  const { error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      user_id: userId,
      email,
      name: email.split('@')[0] || 'Athlete',
      onboarding_completed: true,
      training_days_per_week: daysPerWeek,
      last_completed_workout_order: 0,
      max_workout_order: userId === '2b4bd23c-ceff-460d-a73b-2c531686e3b2' ? 4 : 3,
      last_set_summary_per_exercise: {},
      created_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (error) {
    console.error('Error saving onboarding data:', error);
    // Fallback attempt by updating user_id or id
    const { error: fallbackError } = await supabase
      .from('users')
      .update({
        onboarding_completed: true,
        training_days_per_week: daysPerWeek,
      })
      .or(`user_id.eq.${userId},id.eq.${userId}`);

    if (fallbackError) {
      console.error('Fallback update error:', fallbackError);
      throw fallbackError;
    }
  }
}

export async function updateSessionDate(sessionId: string, newDate: Date) {
  await supabase
    .from('sessions')
    .update({ completed_at: newDate.toISOString() })
    .eq('id', sessionId);
}

export async function deleteSessions(sessionIds: string[]) {
  if (!sessionIds.length) return;
  await supabase.from('sets').delete().in('session_id', sessionIds);
  await supabase.from('sessions').delete().in('id', sessionIds);
}

export async function fetchWorkoutHistory(userId: string) {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(50);

  const sessions: Session[] = (data || []).map((d: any) => ({
    id: String(d.id),
    userId: String(d.user_id),
    workoutId: String(d.workout_id),
    status: d.status || (d.is_completed ? 'completed' : 'in_progress'),
    startedAt: d.started_at ? new Date(d.started_at) : new Date(),
    completedAt: d.completed_at ? new Date(d.completed_at) : null,
  }));

  return sessions;
}

export async function fetchSetsForSession(sessionId: string) {
  const { data } = await supabase
    .from('sets')
    .select('*')
    .eq('session_id', sessionId)
    .order('set_number', { ascending: true });

  const sets: WorkoutSet[] = (data || []).map((d: any) => ({
    id: String(d.id),
    sessionId: String(d.session_id),
    userId: String(d.user_id),
    exerciseId: String(d.exercise_id),
    setNumber: d.set_number,
    weight: d.weight != null ? Number(d.weight) : null,
    reps: d.reps != null ? Number(d.reps) : null,
    durationSeconds: d.duration_seconds != null ? Number(d.duration_seconds) : null,
    loggedAt: d.logged_at ? new Date(d.logged_at) : new Date(),
  }));

  return sets;
}

export async function logSessionCompletion(
  userId: string,
  workoutId: string,
  setsData: any[],
  exercisesList: Exercise[],
  sessionCompletedAt?: Date
) {
  const { data: authUser } = await supabase.auth.getUser();
  const userProfile = await initializeUser(userId, authUser?.user?.email || '');

  const { data: workoutDataRaw } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  const workoutData: Workout = {
    id: String(workoutDataRaw?.id || workoutId),
    name: workoutDataRaw?.name || '',
    order: workoutDataRaw?.order ?? workoutDataRaw?.day_number ?? 1,
    exerciseIds: workoutDataRaw?.exercise_ids || [],
  };

  const sessionData = SessionEngine.createSession(userProfile, workoutData);
  const completedTimestamp = sessionCompletedAt ? sessionCompletedAt.toISOString() : new Date().toISOString();

  const { data: insertedSession, error: sessionErr } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      workout_id: workoutId,
      status: 'completed',
      started_at: sessionData.startedAt.toISOString(),
      completed_at: completedTimestamp,
    })
    .select()
    .single();

  if (sessionErr || !insertedSession) {
    throw new Error(sessionErr?.message || 'Failed to record workout session');
  }

  const sessionId = String(insertedSession.id);
  const newCacheUpdates: Record<string, LastSetSummary> = {};
  const setsToInsert: any[] = [];

  for (const s of setsData) {
    const ex = exercisesList.find((e) => e.id === s.exerciseId);
    if (!ex) continue;

    const validatedSet = SetLogger.validateAndCreateSet(
      {
        sessionId,
        userId,
        exerciseId: s.exerciseId,
        setNumber: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        durationSeconds: s.durationSeconds,
      },
      ex.type
    );

    setsToInsert.push({
      session_id: sessionId,
      user_id: userId,
      exercise_id: s.exerciseId,
      set_number: s.setNumber,
      weight: validatedSet.weight,
      reps: validatedSet.reps,
      duration_seconds: validatedSet.durationSeconds,
      logged_at: new Date().toISOString(),
    });

    newCacheUpdates[s.exerciseId] = {
      lastWeight: s.weight || null,
      lastReps: s.reps || null,
      lastDurationSeconds: s.durationSeconds || null,
      lastSessionId: sessionId,
    };
  }

  if (setsToInsert.length > 0) {
    const { error: setsErr } = await supabase.from('sets').insert(setsToInsert);
    if (setsErr) {
      console.error('Failed inserting sets:', setsErr);
    }
  }

  const updatedCache = { ...userProfile.lastSetSummaryPerExercise };
  for (const [key, val] of Object.entries(newCacheUpdates)) {
    updatedCache[key] = val;
  }

  await supabase
    .from('users')
    .update({
      last_completed_workout_order: workoutData.order,
      last_set_summary_per_exercise: updatedCache,
    })
    .eq('user_id', userId);
}

export async function exportAllLogs(userId: string) {
  const { data: sessions } = await supabase.from('sessions').select('*').eq('user_id', userId);
  const { data: sets } = await supabase.from('sets').select('*').eq('user_id', userId);
  return { sessions: sessions || [], sets: sets || [] };
}

export async function deleteAllLogs(userId: string) {
  await supabase.from('sets').delete().eq('user_id', userId);
  await supabase.from('sessions').delete().eq('user_id', userId);
}

export async function importAllLogs(userId: string, data: any) {
  if (!data || !Array.isArray(data.sessions) || !Array.isArray(data.sets)) {
    throw new Error('Invalid JSON structure');
  }

  if (data.sessions.length > 0) {
    await supabase.from('sessions').upsert(data.sessions);
  }
  if (data.sets.length > 0) {
    await supabase.from('sets').upsert(data.sets);
  }
}
