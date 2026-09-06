import { supabase } from '../supabase.ts';
import { deleteWorkoutPhotos } from '../storage.ts';

export interface ExportScopeOptions {
  includeRoutines?: boolean;
  includeExercises?: boolean;
  includeWorkoutHistory?: boolean;
  includeBodyLogs?: boolean;
  includeDietary?: boolean;
  includeProfile?: boolean;
}

export async function exportAllLogs(userId: string, options?: ExportScopeOptions) {
  const opts: ExportScopeOptions = {
    includeRoutines: options?.includeRoutines ?? true,
    includeExercises: options?.includeExercises ?? true,
    includeWorkoutHistory: options?.includeWorkoutHistory ?? true,
    includeBodyLogs: options?.includeBodyLogs ?? true,
    includeDietary: options?.includeDietary ?? true,
    includeProfile: options?.includeProfile ?? true,
  };

  try {
    const [
      workoutsRes,
      exercisesRes,
      workoutExercisesRes,
      sessionsRes,
      setsRes,
      bodyRes,
      dietaryLogsRes,
      dietaryEntriesRes,
      customFoodsRes,
      userRes
    ] = await Promise.all([
      opts.includeRoutines
        ? supabase.from('workouts').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      (opts.includeExercises || opts.includeRoutines)
        ? supabase.from('exercises').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      opts.includeRoutines
        ? supabase.from('workout_exercises').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      opts.includeWorkoutHistory
        ? supabase.from('sessions').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      opts.includeWorkoutHistory
        ? supabase.from('sets').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      opts.includeBodyLogs
        ? supabase.from('body_logs').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      opts.includeDietary
        ? supabase.from('dietary_logs').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      opts.includeDietary
        ? supabase.from('dietary_log_entries').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      opts.includeDietary
        ? supabase.from('food_items').select('*').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
      opts.includeProfile
        ? supabase.from('users').select('*').eq('user_id', userId).maybeSingle()
        : Promise.resolve({ data: null })
    ]);

    return {
      version: 3,
      exported_at: new Date().toISOString(),
      user_id: userId,
      scope: opts,
      user_profile: userRes.data || null,
      workouts: workoutsRes.data || [],
      exercises: exercisesRes.data || [],
      workout_exercises: workoutExercisesRes.data || [],
      sessions: sessionsRes.data || [],
      sets: setsRes.data || [],
      body_logs: bodyRes.data || [],
      dietary_logs: dietaryLogsRes.data || [],
      dietary_log_entries: dietaryEntriesRes.data || [],
      custom_food_items: customFoodsRes.data || [],
    };
  } catch (err: unknown) {
    console.error('Failed to export logs:', err);
    throw err;
  }
}

export async function deleteAllLogs(userId: string) {
  try {
    const { data: sessionRows } = await supabase
      .from('sessions')
      .select('photos')
      .eq('user_id', userId);

    const allPhotos: string[] = [];
    ((sessionRows as { photos: string[] | string | null }[]) || []).forEach((row) => {
      if (row.photos && Array.isArray(row.photos)) {
        allPhotos.push(...row.photos);
      }
    });

    if (allPhotos.length > 0) {
      await deleteWorkoutPhotos(allPhotos);
    }

    await supabase.from('sets').delete().eq('user_id', userId);
    await supabase.from('sessions').delete().eq('user_id', userId);
    await supabase.from('body_logs').delete().eq('user_id', userId);
    await supabase.from('dietary_log_entries').delete().eq('user_id', userId);
    await supabase.from('dietary_logs').delete().eq('user_id', userId);

    await supabase
      .from('users')
      .update({
        last_completed_workout_order: 0,
        last_set_summary_per_exercise: {},
      })
      .eq('user_id', userId);

    return true;
  } catch (err: unknown) {
    console.error('Failed to delete all logs:', err);
    throw err;
  }
}

export async function importAllLogs(
  userId: string,
  data: Record<string, unknown>,
  options?: { preserveOriginalIds?: boolean }
) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON backup file provided.');
  }

  // Remap IDs so imported items receive fresh unique IDs and never conflict across accounts
  const shouldRemapIds = options?.preserveOriginalIds !== true;
  const idRemap = new Map<string, string>();

  const generateNewId = (oldId: string | number | undefined, prefix: string): string => {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const time = Date.now();
    return `${prefix}_${time}_${randomSuffix}`;
  };

  try {
    // 1. Restore User Profile if present
    if (data.user_profile && typeof data.user_profile === 'object') {
      const u = data.user_profile as Record<string, unknown>;
      await supabase
        .from('users')
        .update({
          last_completed_workout_order: (u.last_completed_workout_order as number) ?? 0,
          last_set_summary_per_exercise: (u.last_set_summary_per_exercise as Record<string, unknown>) ?? {},
          metrics: u.metrics ?? undefined,
        })
        .eq('user_id', userId);
    }

    // 2. Restore Exercises
    if (Array.isArray(data.exercises) && data.exercises.length > 0) {
      const cleanExercises = data.exercises.map((ex: Record<string, unknown>) => {
        const oldId = String(ex.id || '');
        const newId = shouldRemapIds ? generateNewId(oldId, 'ex') : oldId;
        if (oldId) idRemap.set(oldId, newId);

        return {
          ...ex,
          id: newId,
          user_id: userId,
          created_at: ex.created_at || new Date().toISOString(),
        };
      });
      await supabase.from('exercises').upsert(cleanExercises, { onConflict: 'id' });
    }

    // 3. Restore Workouts
    if (Array.isArray(data.workouts) && data.workouts.length > 0) {
      const cleanWorkouts = data.workouts.map((w: Record<string, unknown>) => {
        const oldId = String(w.id || '');
        const newId = shouldRemapIds ? generateNewId(oldId, 'w') : oldId;
        if (oldId) idRemap.set(oldId, newId);

        const oldExerciseIds = Array.isArray(w.exercise_ids) ? w.exercise_ids : [];
        const newExerciseIds = shouldRemapIds
          ? oldExerciseIds.map((eid: string) => idRemap.get(String(eid)) || eid)
          : oldExerciseIds;

        return {
          ...w,
          id: newId,
          exercise_ids: newExerciseIds,
          user_id: userId,
          created_at: w.created_at || new Date().toISOString(),
        };
      });
      await supabase.from('workouts').upsert(cleanWorkouts, { onConflict: 'id' });
    }

    // 4. Restore Workout-Exercises Junction
    if (Array.isArray(data.workout_exercises) && data.workout_exercises.length > 0) {
      const cleanJunction = data.workout_exercises.map((we: Record<string, unknown>) => {
        const oldWorkoutId = String(we.workout_id || '');
        const oldExId = String(we.exercise_id || '');
        return {
          ...we,
          id: shouldRemapIds
            ? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateNewId(we.id as string, 'we'))
            : we.id,
          workout_id: idRemap.get(oldWorkoutId) || oldWorkoutId,
          exercise_id: idRemap.get(oldExId) || oldExId,
          user_id: userId,
        };
      });
      await supabase.from('workout_exercises').upsert(cleanJunction);
    }

    // 5. Restore Sessions
    if (Array.isArray(data.sessions) && data.sessions.length > 0) {
      const cleanSessions = data.sessions.map((s: Record<string, unknown>) => {
        const oldSessionId = String(s.id || '');
        const newSessionId = shouldRemapIds
          ? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateNewId(oldSessionId, 'sess'))
          : oldSessionId;
        if (oldSessionId) idRemap.set(oldSessionId, newSessionId);

        const oldWorkoutId = String(s.workout_id || '');
        return {
          ...s,
          id: newSessionId,
          workout_id: idRemap.get(oldWorkoutId) || (oldWorkoutId || null),
          user_id: userId,
        };
      });
      await supabase.from('sessions').upsert(cleanSessions, { onConflict: 'id' });
    }

    // 6. Restore Sets
    if (Array.isArray(data.sets) && data.sets.length > 0) {
      const cleanSets = data.sets.map((st: Record<string, unknown>) => {
        const { sessions: _s, ...rest } = st;
        const oldSessionId = String(st.session_id || '');
        const oldExId = String(st.exercise_id || '');

        return {
          ...rest,
          id: shouldRemapIds
            ? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateNewId(st.id as string, 'set'))
            : st.id,
          session_id: idRemap.get(oldSessionId) || oldSessionId,
          exercise_id: idRemap.get(oldExId) || oldExId,
          user_id: userId,
        };
      });
      await supabase.from('sets').upsert(cleanSets, { onConflict: 'id' });
    }

    // 7. Restore Body Logs
    if (Array.isArray(data.body_logs) && data.body_logs.length > 0) {
      const cleanBodyLogs = data.body_logs.map((bl: Record<string, unknown>) => ({
        ...bl,
        id: shouldRemapIds
          ? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateNewId(bl.id as string, 'bl'))
          : bl.id,
        user_id: userId,
      }));
      await supabase.from('body_logs').upsert(cleanBodyLogs, { onConflict: 'user_id,log_date' });
    }

    // 8. Restore Custom Food Items
    if (Array.isArray(data.custom_food_items) && data.custom_food_items.length > 0) {
      const cleanCustomFoods = data.custom_food_items.map((cf: Record<string, unknown>) => ({
        ...cf,
        id: shouldRemapIds ? `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` : cf.id,
        user_id: userId,
      }));
      await supabase.from('food_items').upsert(cleanCustomFoods, { onConflict: 'id' });
    }

    // 9. Restore Daily Dietary Summaries
    if (Array.isArray(data.dietary_logs) && data.dietary_logs.length > 0) {
      const cleanDietaryLogs = data.dietary_logs.map((dl: Record<string, unknown>) => ({
        ...dl,
        user_id: userId,
      }));
      await supabase.from('dietary_logs').upsert(cleanDietaryLogs, { onConflict: 'user_id,log_date' });
    }

    // 10. Restore Granular Dietary Log Entries
    if (Array.isArray(data.dietary_log_entries) && data.dietary_log_entries.length > 0) {
      const cleanDietaryEntries = data.dietary_log_entries.map((de: Record<string, unknown>) => ({
        ...de,
        id: shouldRemapIds
          ? (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : generateNewId(de.id as string, 'entry'))
          : de.id,
        user_id: userId,
      }));
      await supabase.from('dietary_log_entries').upsert(cleanDietaryEntries, { onConflict: 'id' });
    }

    return true;
  } catch (err: unknown) {
    console.error('Failed to import logs into Supabase:', err);
    throw err;
  }
}
}
