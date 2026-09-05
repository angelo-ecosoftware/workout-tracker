import { supabase } from '../supabase.ts';
import { Workout, WorkoutSet, Exercise, LastSetSummary, SessionSetInputPayload } from '../../models.ts';
import { SessionEngine, SetLogger } from '../../engine.ts';
import { initializeUser } from './users.ts';
import { deleteWorkoutPhotos } from '../storage.ts';
import { DbSessionRow, DbSetRow } from '../../types/supabase.ts';

export async function updateSessionDate(
  sessionId: string,
  newDate: Date,
  sleepHours?: number | null,
  energyScore?: number | null
) {
  const updatePayload: Record<string, any> = { completed_at: newDate.toISOString() };
  if (sleepHours !== undefined) {
    updatePayload.sleep_hours = sleepHours;
  }
  if (energyScore !== undefined) {
    updatePayload.energy_score = energyScore;
  }

  const { error } = await supabase
    .from('sessions')
    .update(updatePayload)
    .eq('id', sessionId);
  if (error) throw error;
}

export async function updateSessionNotes(sessionId: string, notes: string | null) {
  const { error } = await supabase
    .from('sessions')
    .update({ notes: notes || null })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function updateSessionCoachNotes(sessionId: string, coachNotes: string | null, coachName?: string | null) {
  const payload: Record<string, any> = { coach_notes: coachNotes || null };
  if (coachName) payload.coach_name = coachName;

  const { error } = await supabase
    .from('sessions')
    .update(payload)
    .eq('id', sessionId);
  if (error) throw error;
}

export async function markSessionAsReviewed(
  sessionId: string,
  coachId: string,
  coachName?: string | null
): Promise<{ reviewedAt: Date; coachName?: string | null }> {
  const now = new Date();
  const payload: Record<string, any> = {
    reviewed_at: now.toISOString(),
    reviewed_by_coach_id: coachId,
  };
  if (coachName) {
    payload.reviewed_by_coach_name = coachName;
  }

  const { error } = await supabase
    .from('sessions')
    .update(payload)
    .eq('id', sessionId);
  if (error) throw error;

  return { reviewedAt: now, coachName };
}

export async function updateSessionPhotos(sessionId: string, photos: string[]) {
  const { error } = await supabase
    .from('sessions')
    .update({ photos: photos && photos.length > 0 ? photos : null })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function deleteSessions(sessionIds: string[], userId?: string) {
  if (!sessionIds || sessionIds.length === 0) return;

  const { data: sessionRows } = await supabase
    .from('sessions')
    .select('photos')
    .in('id', sessionIds);

  const allPhotosToDelete: string[] = [];
  ((sessionRows as { photos: string[] | string | null }[]) || []).forEach((row) => {
    if (row.photos && Array.isArray(row.photos)) {
      allPhotosToDelete.push(...row.photos);
    }
  });

  if (allPhotosToDelete.length > 0) {
    await deleteWorkoutPhotos(allPhotosToDelete);
  }

  const { error: setsError } = await supabase
    .from('sets')
    .delete()
    .in('session_id', sessionIds);

  if (setsError) {
    console.warn('Error deleting sets cascading from sessions:', setsError);
  }

  let sessionDeleteQuery = supabase.from('sessions').delete().in('id', sessionIds);
  if (userId) {
    sessionDeleteQuery = sessionDeleteQuery.eq('user_id', userId);
  }

  const { error: sessionsError } = await sessionDeleteQuery;
  if (sessionsError) throw sessionsError;
}

export async function fetchWorkoutHistory(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false });

  if (error) throw error;

  return ((data as DbSessionRow[]) || []).map((s) => ({
    id: String(s.id),
    userId: s.user_id,
    workoutId: s.workout_id,
    status: s.status || 'in_progress',
    completedAt: s.completed_at ? new Date(s.completed_at) : null,
    sleepHours: s.sleep_hours != null ? Number(s.sleep_hours) : undefined,
    energyScore: s.energy_score != null ? Number(s.energy_score) : undefined,
    notes: s.notes || undefined,
    photos: Array.isArray(s.photos) ? s.photos : undefined,
    startedAt: s.started_at ? new Date(s.started_at) : undefined,
  }));
}

export async function fetchSetsForSession(sessionId: string) {
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('session_id', sessionId)
    .order('set_number', { ascending: true });

  if (error) throw error;

  return ((data as DbSetRow[]) || []).map((set) => ({
    id: String(set.id),
    sessionId: set.session_id,
    userId: set.user_id,
    exerciseId: set.exercise_id,
    setNumber: set.set_number,
    weight: set.weight != null ? parseFloat(String(set.weight)) : null,
    reps: set.reps != null ? parseInt(String(set.reps), 10) : null,
    durationSeconds: set.duration_seconds != null ? parseInt(String(set.duration_seconds), 10) : null,
    completedAt: set.completed_at ? new Date(set.completed_at) : null,
    startedAt: set.started_at ? new Date(set.started_at) : null,
    restSeconds: set.rest_seconds != null ? parseInt(String(set.rest_seconds), 10) : null,
    loggedAt: set.logged_at ? new Date(set.logged_at) : new Date(),
  })) as WorkoutSet[];
}

export async function fetchPublicWorkoutSession(sessionId: string) {
  const { data: sessionData, error: sErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();

  if (sErr || !sessionData) return null;
  const typedSession = sessionData as DbSessionRow;

  const [setsData, workoutData, userData] = await Promise.all([
    fetchSetsForSession(sessionId),
    supabase.from('workouts').select('name').eq('id', typedSession.workout_id).maybeSingle(),
    supabase.from('users').select('name').eq('user_id', typedSession.user_id).maybeSingle(),
  ]);

  return {
    session: {
      id: String(typedSession.id),
      userId: typedSession.user_id,
      workoutId: typedSession.workout_id,
      status: typedSession.status || 'in_progress',
      completedAt: typedSession.completed_at ? new Date(typedSession.completed_at) : null,
      sleepHours: typedSession.sleep_hours != null ? Number(typedSession.sleep_hours) : undefined,
      energyScore: typedSession.energy_score != null ? Number(typedSession.energy_score) : undefined,
      notes: typedSession.notes || undefined,
      photos: Array.isArray(typedSession.photos) ? typedSession.photos : undefined,
      startedAt: typedSession.started_at ? new Date(typedSession.started_at) : undefined,
    },
    sets: setsData,
    workoutName: workoutData.data?.name || 'Workout Routine',
    athleteName: userData.data?.name || 'Athlete',
  };
}

export async function fetchAllSetsForUser(userId: string) {
  const { data, error } = await supabase
    .from('sets')
    .select('*, sessions!inner(user_id)')
    .eq('sessions.user_id', userId);

  if (error) {
    console.warn('fetchAllSetsForUser notice:', error);
    return [];
  }

  return ((data as DbSetRow[]) || []).map((set) => ({
    id: String(set.id),
    sessionId: set.session_id,
    userId: set.user_id,
    exerciseId: set.exercise_id,
    setNumber: set.set_number,
    weight: set.weight != null ? parseFloat(String(set.weight)) : null,
    reps: set.reps != null ? parseInt(String(set.reps), 10) : null,
    durationSeconds: set.duration_seconds != null ? parseInt(String(set.duration_seconds), 10) : null,
    completedAt: set.completed_at ? new Date(set.completed_at) : null,
    startedAt: set.started_at ? new Date(set.started_at) : null,
    restSeconds: set.rest_seconds != null ? parseInt(String(set.rest_seconds), 10) : null,
    loggedAt: set.logged_at ? new Date(set.logged_at) : new Date(),
  })) as WorkoutSet[];
}

export async function logSessionCompletion(
  userId: string,
  workoutId: string,
  setsData: SessionSetInputPayload[],
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

  if (sessionErr && sessionErr.message) {
    let shouldRetry = false;
    if (sessionErr.message.includes('photos') && 'photos' in sessionPayload) {
      delete sessionPayload.photos;
      shouldRetry = true;
    }
    if (sessionErr.message.includes('notes') && 'notes' in sessionPayload) {
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
  const setsToInsert: Partial<DbSetRow>[] = [];

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

    const setRow: Partial<DbSetRow> = {
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
