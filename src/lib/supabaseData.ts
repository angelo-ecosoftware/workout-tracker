import { supabase } from './supabase.ts';
import { UserProfile, Workout, Session, WorkoutSet, Exercise, LastSetSummary } from '../models.ts';
import { SessionEngine, SetLogger } from '../engine.ts';
import { deleteWorkoutPhotos } from './storage.ts';

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

  const localMetricsRaw = localStorage.getItem(`user_metrics_${userId}`);
  const localMetrics = localMetricsRaw ? JSON.parse(localMetricsRaw) : undefined;

  return {
    userId: data.user_id || userId,
    email: data.email || resolvedEmail,
    name: data.name || resolvedName,
    lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
    maxWorkoutOrder: data.max_workout_order ?? 3,
    lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    metrics: data.metrics || localMetrics,
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

  const localMetricsRaw = localStorage.getItem(`user_metrics_${userId}`);
  const localMetrics = localMetricsRaw ? JSON.parse(localMetricsRaw) : undefined;

  return {
    profile: {
      userId: data.user_id || userId,
      email: data.email || userEmail,
      name: data.name || userName || (userEmail ? userEmail.split('@')[0] : '') || 'Athlete',
      lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
      maxWorkoutOrder: data.max_workout_order ?? 3,
      lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      metrics: data.metrics || localMetrics,
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

  // Retrieve photos associated with these sessions to cleanly remove them from storage
  try {
    const { data: sessionRows } = await supabase
      .from('sessions')
      .select('photos')
      .in('id', sessionIds);

    const photosToDelete: string[] = [];
    (sessionRows || []).forEach((row: any) => {
      if (Array.isArray(row.photos)) {
        photosToDelete.push(...row.photos);
      } else if (typeof row.photos === 'string' && row.photos) {
        photosToDelete.push(row.photos);
      }
    });

    if (photosToDelete.length > 0) {
      await deleteWorkoutPhotos(photosToDelete);
    }
  } catch (err) {
    console.warn('Error cleaning up session photos from storage:', err);
  }

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
    startedAt: d.started_at ? new Date(d.started_at) : null,
    completedAt: d.completed_at ? new Date(d.completed_at) : null,
    restSeconds: d.rest_seconds != null ? Number(d.rest_seconds) : null,
    loggedAt: d.logged_at ? new Date(d.logged_at) : new Date(),
  }));

  return sets;
}

/**
 * Publicly fetches a single workout session by ID with its workout metadata, sets, and exercise names.
 * Safe for unauthenticated guests.
 */
export async function fetchPublicWorkoutSession(sessionId: string): Promise<{
  session: Session;
  workoutName: string;
  athleteName?: string;
  bodyWeightKg?: number | null;
  calculatedBmi?: number | null;
  sets: (WorkoutSet & { exerciseName: string; type: 'strength' | 'timed' })[];
} | null> {
  try {
    // 1. Fetch the session row
    const { data: sessionData, error: sessionErr } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionErr || !sessionData) {
      console.warn('Session not found for public link:', sessionErr);
      return null;
    }

    const session: Session = {
      id: String(sessionData.id),
      userId: String(sessionData.user_id),
      workoutId: String(sessionData.workout_id),
      status: sessionData.status || (sessionData.is_completed ? 'completed' : 'in_progress'),
      startedAt: sessionData.started_at ? new Date(sessionData.started_at) : new Date(),
      completedAt: sessionData.completed_at ? new Date(sessionData.completed_at) : null,
      notes: sessionData.notes || null,
      photos: Array.isArray(sessionData.photos) ? sessionData.photos : (sessionData.photos ? [sessionData.photos] : null),
    };

    // 2. Fetch workout title, exercises, sets, and athlete profile concurrently
    const [workoutRes, exercisesRes, setsRes, userRes] = await Promise.all([
      supabase.from('workouts').select('*').eq('id', sessionData.workout_id).single(),
      supabase.from('exercises').select('*'),
      supabase.from('sets').select('*').eq('session_id', sessionId).order('set_number', { ascending: true }),
      supabase.from('users').select('*').eq('user_id', sessionData.user_id).single(),
    ]);

    const workoutName = workoutRes.data?.name || 'Workout Session';
    const exercisesMap = new Map((exercisesRes.data || []).map((e: any) => [String(e.id), e]));
    
    // Optional athlete name
    const athleteName = userRes.data?.name || userRes.data?.email?.split('@')[0] || 'Athlete';

    // Check if a bodyweight log was recorded on that session date
    let bodyWeightKg: number | null = null;
    let calculatedBmi: number | null = null;
    if (session.completedAt) {
      const d = session.completedAt;
      const logDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const { data: bodyLogData } = await supabase
        .from('body_logs')
        .select('*')
        .eq('user_id', sessionData.user_id)
        .eq('log_date', logDate)
        .single();

      if (bodyLogData) {
        bodyWeightKg = Number(bodyLogData.weight_kg);
        calculatedBmi = bodyLogData.calculated_bmi ? Number(bodyLogData.calculated_bmi) : null;
      }
    }

    const populatedSets = (setsRes.data || []).map((s: any) => {
      const ex = exercisesMap.get(String(s.exercise_id));
      return {
        id: String(s.id),
        sessionId: String(s.session_id),
        userId: String(s.user_id),
        exerciseId: String(s.exercise_id),
        setNumber: s.set_number,
        weight: s.weight != null ? Number(s.weight) : null,
        reps: s.reps != null ? Number(s.reps) : null,
        durationSeconds: s.duration_seconds != null ? Number(s.duration_seconds) : null,
        startedAt: s.started_at ? new Date(s.started_at) : null,
        completedAt: s.completed_at ? new Date(s.completed_at) : null,
        restSeconds: s.rest_seconds != null ? Number(s.rest_seconds) : null,
        loggedAt: s.logged_at ? new Date(s.logged_at) : new Date(),
        exerciseName: ex?.name || 'Exercise',
        type: ex?.type === 'timed' ? 'timed' : 'strength',
      } as WorkoutSet & { exerciseName: string; type: 'strength' | 'timed' };
    });

    return {
      session,
      workoutName,
      athleteName,
      bodyWeightKg,
      calculatedBmi,
      sets: populatedSets,
    };
  } catch (err) {
    console.error('Error fetching public workout session:', err);
    return null;
  }
}

export async function fetchAllSetsForUser(userId: string) {
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: true });

  if (error) {
    console.error('Error fetching all user sets:', error);
    return [];
  }

  const sets: WorkoutSet[] = (data || []).map((d: any) => ({
    id: String(d.id),
    sessionId: String(d.session_id),
    userId: String(d.user_id),
    exerciseId: String(d.exercise_id),
    setNumber: d.set_number,
    weight: d.weight != null ? Number(d.weight) : null,
    reps: d.reps != null ? Number(d.reps) : null,
    durationSeconds: d.duration_seconds != null ? Number(d.duration_seconds) : null,
    startedAt: d.started_at ? new Date(d.started_at) : null,
    completedAt: d.completed_at ? new Date(d.completed_at) : null,
    restSeconds: d.rest_seconds != null ? Number(d.rest_seconds) : null,
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
  photos?: string[],
  sessionStartedAt?: Date,
  _idempotencyKey?: string,
  sleepHours?: number,
  energyScore?: number
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
  const startedTimestamp = sessionStartedAt ? sessionStartedAt.toISOString() : sessionData.startedAt.toISOString();
  const completedTimestamp = sessionCompletedAt ? sessionCompletedAt.toISOString() : new Date().toISOString();

  // Deduplication check: prevent inserting the exact same session twice within the same timestamp/workout
  const { data: existingSession } = await supabase
    .from('sessions')
    .select('id')
    .eq('user_id', userId)
    .eq('workout_id', workoutId)
    .eq('completed_at', completedTimestamp)
    .maybeSingle();

  if (existingSession) {
    console.log(`Session already logged for this completion timestamp (${existingSession.id}), skipping duplicate.`);
    return;
  }

  const sessionPayload: Record<string, any> = {
    user_id: userId,
    workout_id: workoutId,
    status: 'completed',
    started_at: startedTimestamp,
    completed_at: completedTimestamp,
  };

  if (sleepHours != null && !isNaN(sleepHours)) {
    sessionPayload.sleep_hours = sleepHours;
  }
  if (energyScore != null && !isNaN(energyScore)) {
    sessionPayload.energy_score = energyScore;
  }

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

  // Graceful fallback if the Supabase table has not run the migration for optional columns yet
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
    if (sessionErr.message.includes('sleep_hours') && 'sleep_hours' in sessionPayload) {
      delete sessionPayload.sleep_hours;
      shouldRetry = true;
    }
    if (sessionErr.message.includes('energy_score') && 'energy_score' in sessionPayload) {
      delete sessionPayload.energy_score;
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

    const setRow: Record<string, any> = {
      session_id: sessionId,
      user_id: userId,
      exercise_id: s.exerciseId,
      set_number: s.setNumber,
      weight: validatedSet.weight,
      reps: validatedSet.reps,
      duration_seconds: validatedSet.durationSeconds,
      logged_at: new Date().toISOString(),
    };

    if (s.startedAt) {
      setRow.started_at = s.startedAt instanceof Date ? s.startedAt.toISOString() : s.startedAt;
    }
    if (s.completedAt) {
      setRow.completed_at = s.completedAt instanceof Date ? s.completedAt.toISOString() : s.completedAt;
    }
    if (s.restSeconds != null) {
      setRow.rest_seconds = s.restSeconds;
    }

    setsToInsert.push(setRow);

    newCacheUpdates[s.exerciseId] = {
      lastWeight: s.weight || null,
      lastReps: s.reps || null,
      lastDurationSeconds: s.durationSeconds || null,
      lastSessionId: sessionId,
    };
  }

  if (setsToInsert.length > 0) {
    let { error: setsErr } = await supabase.from('sets').insert(setsToInsert);
    if (setsErr && (setsErr.message.includes('started_at') || setsErr.message.includes('rest_seconds') || setsErr.message.includes('completed_at'))) {
      console.warn('Retrying set insert with basic columns only...');
      const basicSets = setsToInsert.map(r => ({
        session_id: r.session_id,
        user_id: r.user_id,
        exercise_id: r.exercise_id,
        set_number: r.set_number,
        weight: r.weight,
        reps: r.reps,
        duration_seconds: r.duration_seconds,
        logged_at: r.logged_at,
      }));
      const retrySets = await supabase.from('sets').insert(basicSets);
      setsErr = retrySets.error;
    }
    if (setsErr) {
      console.error('Failed inserting sets:', setsErr);
      throw new Error(`Failed to save workout sets: ${setsErr.message}`);
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

export async function saveUserMetrics(userId: string, metrics: import('../models.ts').UserMetrics) {
  // 1. Always save to local storage for instant offline availability
  try {
    localStorage.setItem(`user_metrics_${userId}`, JSON.stringify(metrics));
  } catch (err) {
    console.warn('Could not cache user metrics locally:', err);
  }

  // 2. Persist to Supabase users profile (both explicit fields and JSON metrics)
  try {
    const updatePayload: Record<string, any> = { metrics };
    if (metrics.dateOfBirth) updatePayload.date_of_birth = metrics.dateOfBirth;
    if (metrics.gender) updatePayload.gender = metrics.gender;
    if (metrics.height) updatePayload.height_cm = metrics.height;
    if (metrics.weight) updatePayload.weight_kg = metrics.weight;
    if (metrics.fitnessLevel) updatePayload.fitness_level = metrics.fitnessLevel;
    if (metrics.trainingLocation) updatePayload.training_location = metrics.trainingLocation;
    updatePayload.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('user_id', userId);

    if (error) {
      // Fallback if explicit columns are missing
      await supabase.from('users').update({ metrics }).eq('user_id', userId);
    }
  } catch (err) {
    console.warn('Supabase update metrics failed:', err);
  }

  // 3. If weight is provided, record/upsert a daily body log for today (1 entry per day)
  if (metrics.weight && metrics.weight > 0) {
    const todayStr = new Date().toISOString().split('T')[0];
    await logDailyBodyWeight(userId, {
      date: todayStr,
      weightKg: metrics.weight,
      heightCm: metrics.height,
      source: 'profile',
      notes: metrics.bodyMeasurementsNotes,
    });
  }
}

/**
 * Logs or updates a daily body measurement entry for a user.
 * Ensures the BMI and weight are recorded once per day so day-to-day progression is retained.
 */
export async function logDailyBodyWeight(
  userId: string,
  payload: {
    date: string; // YYYY-MM-DD
    weightKg: number;
    heightCm?: number;
    waistCm?: number;
    source?: 'profile' | 'workout_session' | 'manual';
    notes?: string;
  }
): Promise<import('../models.ts').BodyMeasurementLog> {
  const heightM = payload.heightCm ? payload.heightCm / 100 : undefined;
  const calculatedBmi = heightM && heightM > 0
    ? Number((payload.weightKg / (heightM * heightM)).toFixed(1))
    : undefined;

  const logEntry: import('../models.ts').BodyMeasurementLog = {
    id: `blog_${userId}_${payload.date}`,
    userId,
    logDate: payload.date,
    weightKg: payload.weightKg,
    heightCm: payload.heightCm,
    calculatedBmi,
    waistCm: payload.waistCm,
    notes: payload.notes,
    source: payload.source || 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 1. Local Storage persistence for offline & instant retrieval
  try {
    const localKey = `body_logs_${userId}`;
    const rawLogs = localStorage.getItem(localKey);
    const logs: import('../models.ts').BodyMeasurementLog[] = rawLogs ? JSON.parse(rawLogs) : [];
    
    // Replace today's log if it exists, or append new entry
    const existingIdx = logs.findIndex((l) => l.logDate === payload.date);
    if (existingIdx >= 0) {
      logs[existingIdx] = { ...logs[existingIdx], ...logEntry, updatedAt: new Date() };
    } else {
      logs.push(logEntry);
    }

    // Keep sorted by date ascending
    logs.sort((a, b) => a.logDate.localeCompare(b.logDate));
    localStorage.setItem(localKey, JSON.stringify(logs));
  } catch (lErr) {
    console.warn('Could not save body log locally:', lErr);
  }

  // 2. Supabase DB persistence
  try {
    const dbPayload = {
      id: logEntry.id,
      user_id: userId,
      log_date: payload.date,
      weight_kg: payload.weightKg,
      height_cm: payload.heightCm || null,
      calculated_bmi: calculatedBmi || null,
      waist_cm: payload.waistCm || null,
      notes: payload.notes || null,
      source: logEntry.source,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('body_logs').upsert(dbPayload, { onConflict: 'user_id,log_date' });
    if (error) {
      console.warn('Could not sync body log to Supabase body_logs table:', error);
    }
  } catch (dbErr) {
    console.warn('Supabase body_logs upsert error:', dbErr);
  }

  return logEntry;
}

/**
 * Fetches historical body measurement logs for trend and BMI analytics.
 */
export async function fetchBodyMeasurementLogs(userId: string): Promise<import('../models.ts').BodyMeasurementLog[]> {
  // 1. Try Supabase
  try {
    const { data, error } = await supabase
      .from('body_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: String(d.id),
        userId: d.user_id,
        logDate: d.log_date,
        weightKg: Number(d.weight_kg),
        heightCm: d.height_cm ? Number(d.height_cm) : undefined,
        calculatedBmi: d.calculated_bmi ? Number(d.calculated_bmi) : undefined,
        waistCm: d.waist_cm ? Number(d.waist_cm) : undefined,
        notes: d.notes || undefined,
        source: d.source || 'manual',
        createdAt: d.created_at ? new Date(d.created_at) : new Date(),
        updatedAt: d.updated_at ? new Date(d.updated_at) : new Date(),
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch body_logs from Supabase:', err);
  }

  // 2. Local Storage fallback
  try {
    const raw = localStorage.getItem(`body_logs_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  return [];
}

export async function exportAllLogs(userId: string) {
  // Fetch complete dataset for the user: Workouts (Routines), Exercises, Workout-Exercise links, Sessions, Sets, Body Logs, Dietary Logs & Entries, Custom Food Items, and User Profile
  const [
    { data: workouts },
    { data: exercises },
    { data: workoutExercises },
    { data: sessions },
    { data: sets },
    { data: bodyLogs },
    { data: dietaryLogs },
    { data: dietaryLogEntries },
    { data: customFoodItems },
    { data: userProfile }
  ] = await Promise.all([
    supabase.from('workouts').select('*').eq('user_id', userId),
    supabase.from('exercises').select('*').eq('user_id', userId),
    supabase.from('workout_exercises').select('*').eq('user_id', userId),
    supabase.from('sessions').select('*').eq('user_id', userId),
    supabase.from('sets').select('*').eq('user_id', userId),
    supabase.from('body_logs').select('*').eq('user_id', userId),
    supabase.from('dietary_logs').select('*').eq('user_id', userId),
    supabase.from('dietary_log_entries').select('*').eq('user_id', userId),
    supabase.from('food_items').select('*').eq('user_id', userId),
    supabase.from('users').select('*').eq('id', userId).maybeSingle()
  ]);

  return {
    version: 3,
    exported_at: new Date().toISOString(),
    user_id: userId,
    user_profile: userProfile || null,
    workouts: workouts || [],
    exercises: exercises || [],
    workout_exercises: workoutExercises || [],
    sessions: sessions || [],
    sets: sets || [],
    body_logs: bodyLogs || [],
    dietary_logs: dietaryLogs || [],
    dietary_log_entries: dietaryLogEntries || [],
    custom_food_items: customFoodItems || [],
  };
}

export async function deleteAllLogs(userId: string) {
  await supabase.from('sets').delete().eq('user_id', userId);
  await supabase.from('sessions').delete().eq('user_id', userId);
  await supabase.from('body_logs').delete().eq('user_id', userId);
  await supabase.from('dietary_log_entries').delete().eq('user_id', userId);
  await supabase.from('dietary_logs').delete().eq('user_id', userId);
}

export async function importAllLogs(userId: string, data: any) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON structure');
  }

  // 1. Restore User Profile & Settings if present
  if (data.user_profile) {
    try {
      await supabase.from('users').upsert({
        ...data.user_profile,
        id: userId,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to restore user profile:', e);
    }
  }

  // 2. Restore Exercises first (needed for foreign keys)
  if (Array.isArray(data.exercises) && data.exercises.length > 0) {
    const cleanExercises = data.exercises.map((ex: any) => ({
      ...ex,
      user_id: userId,
    }));
    await supabase.from('exercises').upsert(cleanExercises);
  }

  // 3. Restore Workouts (Routines)
  if (Array.isArray(data.workouts) && data.workouts.length > 0) {
    const cleanWorkouts = data.workouts.map((w: any) => ({
      ...w,
      user_id: userId,
    }));
    await supabase.from('workouts').upsert(cleanWorkouts);
  }

  // 4. Restore Workout-Exercises Junction
  if (Array.isArray(data.workout_exercises) && data.workout_exercises.length > 0) {
    const cleanJunction = data.workout_exercises.map((we: any) => ({
      ...we,
      user_id: userId,
    }));
    await supabase.from('workout_exercises').upsert(cleanJunction);
  }

  // 5. Restore Sessions (Workout Logs)
  if (Array.isArray(data.sessions) && data.sessions.length > 0) {
    const cleanSessions = data.sessions.map((s: any) => ({
      ...s,
      user_id: userId,
    }));
    await supabase.from('sessions').upsert(cleanSessions);
  }

  // 6. Restore Sets
  if (Array.isArray(data.sets) && data.sets.length > 0) {
    const cleanSets = data.sets.map((st: any) => ({
      ...st,
      user_id: userId,
    }));
    await supabase.from('sets').upsert(cleanSets);
  }

  // 7. Restore Body Logs (Weigh-ins & BMI)
  if (Array.isArray(data.body_logs) && data.body_logs.length > 0) {
    const cleanBodyLogs = data.body_logs.map((bl: any) => ({
      ...bl,
      user_id: userId,
    }));
    await supabase.from('body_logs').upsert(cleanBodyLogs, { onConflict: 'user_id,log_date' });
  }

  // 8. Restore Custom Food Items
  if (Array.isArray(data.custom_food_items) && data.custom_food_items.length > 0) {
    const cleanCustomFoods = data.custom_food_items.map((cf: any) => ({
      ...cf,
      user_id: userId,
    }));
    await supabase.from('food_items').upsert(cleanCustomFoods, { onConflict: 'id' });
  }

  // 9. Restore Daily Dietary Summaries
  if (Array.isArray(data.dietary_logs) && data.dietary_logs.length > 0) {
    const cleanDietaryLogs = data.dietary_logs.map((dl: any) => ({
      ...dl,
      user_id: userId,
    }));
    await supabase.from('dietary_logs').upsert(cleanDietaryLogs, { onConflict: 'user_id,log_date' });
  }

  // 10. Restore Granular Dietary Log Entries
  if (Array.isArray(data.dietary_log_entries) && data.dietary_log_entries.length > 0) {
    const cleanDietaryEntries = data.dietary_log_entries.map((de: any) => ({
      ...de,
      user_id: userId,
    }));
    await supabase.from('dietary_log_entries').upsert(cleanDietaryEntries, { onConflict: 'id' });
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

// Re-export roles, coaching, privacy, and routine library APIs
export * from './db/roles.ts';

