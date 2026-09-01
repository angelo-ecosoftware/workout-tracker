import { supabase } from './supabase.ts';
import { UserProfile, Workout, Session, WorkoutSet, Exercise, LastSetSummary } from '../models.ts';
import { SessionEngine, SetLogger } from '../engine.ts';

// Get or create user profile
export async function initializeUser(userId: string, email?: string, name?: string) {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;

  // Derive best available email and name from parameters or auth metadata
  const resolvedEmail = email || authUser?.email || '';
  const metaName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name;
  const resolvedName = name || metaName || (resolvedEmail ? resolvedEmail.split('@')[0] : '') || 'Athlete';

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) {
    const newUser: UserProfile = {
      userId,
      email: resolvedEmail,
      name: resolvedName,
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
      createdAt: new Date(),
    };

    const { error: insertError } = await supabase.from('users').upsert({
      user_id: userId,
      email: resolvedEmail,
      name: resolvedName,
      last_completed_workout_order: 0,
      max_workout_order: 3,
      last_set_summary_per_exercise: {},
      created_at: newUser.createdAt.toISOString(),
    }, { onConflict: 'user_id' });

    if (insertError) {
      console.warn('initializeUser upsert warning:', insertError);
    }

    return newUser;
  }

  // If existing record was created with empty/null email or default 'Athlete' name, patch it with Google profile data
  const isMissingEmail = !data.email && !!resolvedEmail;
  const isDefaultName = (!data.name || data.name === 'Athlete') && resolvedName !== 'Athlete';

  if (isMissingEmail || isDefaultName) {
    const patchPayload: Record<string, any> = {};
    if (isMissingEmail) patchPayload.email = resolvedEmail;
    if (isDefaultName) patchPayload.name = resolvedName;

    await supabase
      .from('users')
      .update(patchPayload)
      .eq('user_id', userId);
    
    data.email = resolvedEmail || data.email;
    data.name = resolvedName || data.name;
  }

  return {
    userId: data.user_id || userId,
    email: data.email || resolvedEmail,
    name: data.name || resolvedName,
    lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
    maxWorkoutOrder: data.max_workout_order ?? 3,
    lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
  } as UserProfile;
}

// Ensure the static workouts/exercises templates exist in Supabase
export async function seedTemplatesIfMissing(_userId?: string) {
  // Seeding disabled - users customize or manage their routines directly or via database
  return;
}

export async function fetchWorkoutsData(userId?: string) {
  let workoutsList: Workout[] = [];
  let exercisesList: Exercise[] = [];

  if (!userId) {
    return { combinedWorkouts: [], workoutsList: [], exercisesList: [] };
  }

  try {
    let query = supabase
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
    let exQuery = supabase.from('exercises').select('*').eq('user_id', userId);
    let { data: exercisesRaw, error: exError } = await exQuery;
    if (exError) console.warn('Error fetching exercises:', exError);

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

  // Also query workout_exercises junction table to preserve ordering and ensure exercises are properly linked
  let junctionMap: Record<string, string[]> = {};
  try {
    const { data: junctionRows } = await supabase
      .from('workout_exercises')
      .select('workout_id, exercise_id, position')
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (junctionRows && junctionRows.length > 0) {
      junctionRows.forEach((row: any) => {
        if (!junctionMap[row.workout_id]) {
          junctionMap[row.workout_id] = [];
        }
        junctionMap[row.workout_id].push(row.exercise_id);
      });
    }
  } catch (jErr) {
    console.warn('Junction query note:', jErr);
  }

  const combinedWorkouts = workoutsList.map((w) => {
    // Prefer junction ordering if available, else fallback to exerciseIds
    const targetExerciseIds = (junctionMap[w.id] && junctionMap[w.id].length > 0)
      ? junctionMap[w.id]
      : (w.exerciseIds || []);

    const wExercises = targetExerciseIds
      .map((eid) => exercisesList.find((e) => e.id === eid))
      .filter(Boolean) as Exercise[];

    return {
      ...w,
      exerciseIds: targetExerciseIds,
      exercises: wExercises,
    };
  });

  return { combinedWorkouts, workoutsList, exercisesList };
}

export async function getUserProgressState(userId: string) {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  const userEmail = authUser?.email || '';
  const userName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name;

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const isFirstRegistration = !data;

  if (!data) {
    await seedTemplatesIfMissing(userId);
    const createdProfile = await initializeUser(userId, userEmail, userName);
    return {
      profile: createdProfile,
      isNewUser: true,
    };
  }

  // If user exists, ensure email or name aren't stuck at empty or 'Athlete'
  const isMissingEmail = !data.email && !!userEmail;
  const isDefaultName = (!data.name || data.name === 'Athlete') && !!userName;

  if (isMissingEmail || isDefaultName) {
    const patchPayload: Record<string, any> = {};
    if (isMissingEmail) patchPayload.email = userEmail;
    if (isDefaultName) patchPayload.name = userName;

    await supabase
      .from('users')
      .update(patchPayload)
      .eq('user_id', userId);

    data.email = userEmail || data.email;
    data.name = userName || data.name;
  }

  return {
    profile: {
      userId: data.user_id || userId,
      email: data.email || userEmail,
      name: data.name || userName || (userEmail ? userEmail.split('@')[0] : '') || 'Athlete',
      lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
      maxWorkoutOrder: data.max_workout_order ?? 3,
      lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    } as UserProfile,
    isNewUser: false,
  };
}

export async function updateSessionDate(sessionId: string, newDate: Date) {
  await supabase
    .from('sessions')
    .update({ completed_at: newDate.toISOString() })
    .eq('id', sessionId);
}

export async function updateSessionNotes(sessionId: string, notes: string | null) {
  await supabase
    .from('sessions')
    .update({ notes })
    .eq('id', sessionId);
}

export async function updateSessionPhotos(sessionId: string, photos: string[]) {
  await supabase
    .from('sessions')
    .update({ photos })
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
    notes: d.notes || null,
    photos: Array.isArray(d.photos) ? d.photos : (d.photos ? [d.photos] : null),
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
  sessionCompletedAt?: Date,
  notes?: string,
  photos?: string[]
) {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData?.user;
  const userProfile = await initializeUser(
    userId,
    authUser?.email || '',
    authUser?.user_metadata?.full_name || authUser?.user_metadata?.name
  );

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

  const sessionPayload: Record<string, any> = {
    user_id: userId,
    workout_id: workoutId,
    status: 'completed',
    started_at: sessionData.startedAt.toISOString(),
    completed_at: completedTimestamp,
  };

  if (notes && notes.trim().length > 0) {
    sessionPayload.notes = notes.trim();
  }

  if (photos && photos.length > 0) {
    sessionPayload.photos = photos;
  }

  let { data: insertedSession, error: sessionErr } = await supabase
    .from('sessions')
    .insert(sessionPayload)
    .select()
    .single();

  // Graceful fallback if the Supabase table has not run the migration for the 'photos' or 'notes' column yet
  if (sessionErr && sessionErr.message) {
    let shouldRetry = false;
    if (sessionErr.message.includes('photos') && 'photos' in sessionPayload) {
      console.warn('Supabase sessions table missing "photos" column. Retrying insert without photos field.');
      delete sessionPayload.photos;
      shouldRetry = true;
    }
    if (sessionErr.message.includes('notes') && 'notes' in sessionPayload) {
      console.warn('Supabase sessions table missing "notes" column. Retrying insert without notes field.');
      delete sessionPayload.notes;
      shouldRetry = true;
    }
    if (shouldRetry) {
      const retry = await supabase
        .from('sessions')
        .insert(sessionPayload)
        .select()
        .single();
      insertedSession = retry.data;
      sessionErr = retry.error;
    }
  }

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

export async function saveWorkoutsAndExercises(
  userId: string,
  updatedWorkouts: (Workout & { exercises: Exercise[] })[]
) {
  const allExercises: any[] = [];
  const workoutRows: any[] = [];
  const junctionRows: any[] = [];

  updatedWorkouts.forEach((w, wIdx) => {
    const workoutId = (w.id && !w.id.startsWith('custom_w_')) ? w.id : `w_${Date.now()}_${wIdx}`;
    
    // Map exercise IDs accurately
    const exerciseIds: string[] = [];

    (w.exercises || []).forEach((ex, pos) => {
      const exId = (ex.id && !ex.id.startsWith('ex_') && !ex.id.startsWith('custom_')) 
        ? ex.id 
        : `ex_${Date.now()}_${wIdx}_${pos}`;

      exerciseIds.push(exId);

      allExercises.push({
        id: exId,
        name: ex.name,
        type: ex.type || 'strength',
        target_sets: ex.targetSets ?? 3,
        target_rep_min: ex.targetRepMin ?? 8,
        target_rep_max: ex.targetRepMax ?? 12,
        user_id: userId,
      });

      junctionRows.push({
        workout_id: workoutId,
        exercise_id: exId,
        position: pos,
        user_id: userId,
      });
    });

    workoutRows.push({
      id: workoutId,
      name: w.name,
      order: w.order ?? (wIdx + 1),
      user_id: userId,
      exercise_ids: exerciseIds,
    });
  });

  // 1. Upsert exercises first so foreign keys exist
  if (allExercises.length > 0) {
    const { error: exErr } = await supabase.from('exercises').upsert(allExercises);
    if (exErr) console.warn('Exercise upsert warning:', exErr);
  }

  // 2. Delete removed workouts for this user that are not in updated list
  const activeWorkoutIds = workoutRows.map(w => w.id);
  if (activeWorkoutIds.length > 0) {
    const { error: delErr } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', userId)
      .not('id', 'in', `(${activeWorkoutIds.map(id => `"${id}"`).join(',')})`);
    if (delErr) console.warn('Workouts cleanup warning:', delErr);
  } else {
    // If all workouts were deleted by user, clear all workouts for this user
    const { error: delAllErr } = await supabase
      .from('workouts')
      .delete()
      .eq('user_id', userId);
    if (delAllErr) console.warn('Workouts clear-all warning:', delAllErr);
  }

  // 3. Upsert workouts
  if (workoutRows.length > 0) {
    const { error: wErr } = await supabase.from('workouts').upsert(workoutRows);
    if (wErr) throw new Error(`Failed to save workouts: ${wErr.message}`);
  }

  // 4. Re-sync junction table
  try {
    await supabase.from('workout_exercises').delete().eq('user_id', userId);
    if (junctionRows.length > 0) {
      await supabase.from('workout_exercises').insert(junctionRows);
    }
  } catch (jErr) {
    console.warn('Junction table sync note:', jErr);
  }
}
