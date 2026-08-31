import { supabase } from './supabase.ts';
import { UserProfile, Workout, Session, WorkoutSet, Exercise, LastSetSummary } from '../models.ts';
import { SessionEngine, SetLogger } from '../engine.ts';

// Get or create user profile
export async function initializeUser(userId: string, email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    const newUser: UserProfile = {
      userId,
      email,
      name: email.split('@')[0],
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
      createdAt: new Date(),
    };

    await supabase.from('users').upsert({
      user_id: userId,
      email,
      name: newUser.name,
      last_completed_workout_order: 0,
      max_workout_order: 3,
      last_set_summary_per_exercise: {},
      created_at: newUser.createdAt.toISOString(),
    });

    return newUser;
  }

  return {
    userId: data.user_id,
    email: data.email,
    name: data.name || data.email.split('@')[0],
    lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
    maxWorkoutOrder: data.max_workout_order ?? 3,
    lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
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

    await supabase.from('exercises').upsert(exercisesV9);

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

    await supabase.from('workouts').upsert(workoutsV9);
    return;
  }

  const { data: existingWorkouts } = await supabase.from('workouts').select('id').limit(1);
  if (existingWorkouts && existingWorkouts.length > 0) {
    return;
  }

  // Seed default exercises
  const exercisesToSeed = [
    // Day 1
    { id: 'd1_e1_v7', name: 'Lat Pulldown', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
    { id: 'd1_e2_v7', name: 'Chest-Supported Row', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
    { id: 'd1_e3_v7', name: 'Incline Machine Press', type: 'strength', target_sets: 2, target_rep_min: 8, target_rep_max: 12 },
    { id: 'd1_e4_v7', name: 'Cable Lateral Raise', type: 'strength', target_sets: 4, target_rep_min: 12, target_rep_max: 15 },
    { id: 'd1_e5_v7', name: 'Rear Delt Pec Deck', type: 'strength', target_sets: 3, target_rep_min: 10, target_rep_max: 15 },
    { id: 'd1_e6_v7', name: 'Rope Triceps Pushdown', type: 'strength', target_sets: 2, target_rep_min: 10, target_rep_max: 15 },
    // Day 2
    { id: 'd2_e1_v7', name: 'Plank', type: 'timed', target_sets: 3, target_rep_min: 30, target_rep_max: 60 },
    { id: 'd2_e2_v7', name: 'Side Plank (Left)', type: 'timed', target_sets: 2, target_rep_min: 30, target_rep_max: 45 },
    { id: 'd2_e3_v7', name: 'Side Plank (Right)', type: 'timed', target_sets: 2, target_rep_min: 30, target_rep_max: 45 },
    { id: 'd2_e4_v7', name: 'Dead Bug', type: 'timed', target_sets: 3, target_rep_min: 30, target_rep_max: 60 },
    { id: 'd2_e5_v7', name: 'Romanian Deadlift', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
    { id: 'd2_e6_v7', name: 'Leg Curl', type: 'strength', target_sets: 3, target_rep_min: 10, target_rep_max: 15 },
    { id: 'd2_e7_v7', name: 'Hip Thrust / Glute Bridge', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
    { id: 'd2_e8_v7', name: 'Calf Raise', type: 'strength', target_sets: 3, target_rep_min: 12, target_rep_max: 20 },
    // Day 3
    { id: 'd3_e1_v7', name: 'Bench Press', type: 'strength', target_sets: 3, target_rep_min: 5, target_rep_max: 8 },
    { id: 'd3_e2_v7', name: 'Incline Dumbbell Press', type: 'strength', target_sets: 2, target_rep_min: 8, target_rep_max: 12 },
    { id: 'd3_e3_v7', name: 'Seated Shoulder Press', type: 'strength', target_sets: 3, target_rep_min: 8, target_rep_max: 12 },
    { id: 'd3_e4_v7', name: 'Cable Lateral Raise', type: 'strength', target_sets: 3, target_rep_min: 12, target_rep_max: 15 },
    { id: 'd3_e5_v7', name: 'Seated Cable Row', type: 'strength', target_sets: 2, target_rep_min: 8, target_rep_max: 12 },
    { id: 'd3_e6_v7', name: 'Cable Curl', type: 'strength', target_sets: 2, target_rep_min: 10, target_rep_max: 15 },
    { id: 'd3_e7_v7', name: 'Rope Triceps Pushdown', type: 'strength', target_sets: 2, target_rep_min: 10, target_rep_max: 15 },
  ];

  await supabase.from('exercises').upsert(exercisesToSeed);

  const workoutsToSeed = [
    {
      id: 'v7_w1',
      name: 'Upper (V-Taper Width)',
      order: 1,
      exercise_ids: ['d1_e1_v7', 'd1_e2_v7', 'd1_e3_v7', 'd1_e4_v7', 'd1_e5_v7', 'd1_e6_v7'],
    },
    {
      id: 'v7_w2',
      name: 'Core + Light Lower (Tendon Safe)',
      order: 2,
      exercise_ids: ['d2_e1_v7', 'd2_e2_v7', 'd2_e3_v7', 'd2_e4_v7', 'd2_e5_v7', 'd2_e6_v7', 'd2_e7_v7', 'd2_e8_v7'],
    },
    {
      id: 'v7_w3',
      name: 'Upper (Chest + Bench)',
      order: 3,
      exercise_ids: ['d3_e1_v7', 'd3_e2_v7', 'd3_e3_v7', 'd3_e4_v7', 'd3_e5_v7', 'd3_e6_v7', 'd3_e7_v7'],
    },
  ];

  await supabase.from('workouts').upsert(workoutsToSeed);
}

export async function fetchWorkoutsData(userId?: string) {
  let query = supabase
    .from('workouts')
    .select('*')
    .order('order', { ascending: true });

  if (userId) {
    query = query.or(`user_id.eq.${userId},user_id.is.null`);
  }

  const { data: workoutsRaw } = await query;

  const allWorkouts: Workout[] = (workoutsRaw || []).map((w: any) => ({
    id: String(w.id),
    name: w.name,
    order: w.order ?? w.day_number ?? 0,
    exerciseIds: w.exercise_ids || [],
  }));

  const workoutsList = allWorkouts.filter((w, i, self) =>
    i === self.findIndex((t) => t.order === w.order)
  );

  let exQuery = supabase.from('exercises').select('*');
  if (userId) {
    exQuery = exQuery.or(`user_id.eq.${userId},user_id.is.null`);
  }
  const { data: exercisesRaw } = await exQuery;
  const exercisesList: Exercise[] = (exercisesRaw || []).map((e: any) => ({
    id: String(e.id),
    name: e.name,
    type: e.type || 'strength',
    targetSets: e.target_sets ?? e.targetSets ?? 3,
    targetRepMin: e.target_rep_min ?? e.targetRepMin ?? 8,
    targetRepMax: e.target_rep_max ?? e.targetRepMax ?? 12,
  }));

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
    .eq('user_id', userId)
    .single();

  if (!data) {
    await seedTemplatesIfMissing(userId);
    const { data: authUser } = await supabase.auth.getUser();
    return await initializeUser(userId, authUser?.user?.email || '');
  }

  const defaultMaxOrder = userId === '2b4bd23c-ceff-460d-a73b-2c531686e3b2' ? 4 : 3;

  return {
    userId: data.user_id,
    email: data.email,
    name: data.name || data.email?.split('@')[0] || '',
    lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
    maxWorkoutOrder: data.max_workout_order ?? defaultMaxOrder,
    lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  } as UserProfile;
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
    .order('completed_at', { ascending: true })
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
    rir: d.rir != null ? Number(d.rir) : null,
    durationSeconds: d.duration_seconds != null ? Number(d.duration_seconds) : null,
    painScore: d.pain_score != null ? Number(d.pain_score) : null,
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
        rir: s.rir,
        durationSeconds: s.durationSeconds,
        painScore: s.painScore,
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
      rir: validatedSet.rir,
      duration_seconds: validatedSet.durationSeconds,
      pain_score: validatedSet.painScore,
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
