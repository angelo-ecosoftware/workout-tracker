import { supabase } from '../supabase.ts';
import { deleteWorkoutPhotos } from '../storage.ts';

export async function exportAllLogs(userId: string) {
  try {
    const [userRes, workoutsRes, sessionsRes, setsRes, bodyRes] = await Promise.all([
      supabase.from('users').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('workouts').select('*').eq('user_id', userId),
      supabase.from('sessions').select('*').eq('user_id', userId),
      supabase.from('sets').select('*, sessions!inner(user_id)').eq('sessions.user_id', userId),
      supabase.from('body_measurement_logs').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: userRes.data || null,
      workouts: workoutsRes.data || [],
      sessions: sessionsRes.data || [],
      sets: setsRes.data || [],
      bodyMeasurements: bodyRes.data || [],
    };

    return exportData;
  } catch (err: any) {
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

    await supabase.from('sessions').delete().eq('user_id', userId);
    await supabase.from('body_measurement_logs').delete().eq('user_id', userId);

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

export async function importAllLogs(userId: string, data: Record<string, unknown>) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON backup file provided.');
  }

  try {
    if (data.workouts && Array.isArray(data.workouts) && data.workouts.length > 0) {
      const sanitizedWorkouts = data.workouts.map((w: Record<string, unknown>) => ({
        ...w,
        user_id: userId,
      }));
      await supabase.from('workouts').upsert(sanitizedWorkouts, { onConflict: 'id' });
    }

    if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
      const sanitizedSessions = data.sessions.map((s: Record<string, unknown>) => ({
        ...s,
        user_id: userId,
      }));
      await supabase.from('sessions').upsert(sanitizedSessions, { onConflict: 'id' });
    }

    if (data.sets && Array.isArray(data.sets) && data.sets.length > 0) {
      const cleanSets = data.sets.map((s: Record<string, unknown>) => {
        const { sessions: _s, ...rest } = s;
        return rest;
      });
      await supabase.from('sets').upsert(cleanSets, { onConflict: 'id' });
    }

    if (data.bodyMeasurements && Array.isArray(data.bodyMeasurements) && data.bodyMeasurements.length > 0) {
      const sanitizedBody = data.bodyMeasurements.map((b: Record<string, unknown>) => ({
        ...b,
        user_id: userId,
      }));
      await supabase.from('body_measurement_logs').upsert(sanitizedBody, { onConflict: 'id' });
    }

    if (data.user && typeof data.user === 'object') {
      const u = data.user as Record<string, unknown>;
      await supabase
        .from('users')
        .update({
          last_completed_workout_order: (u.last_completed_workout_order as number) ?? 0,
          last_set_summary_per_exercise: (u.last_set_summary_per_exercise as Record<string, unknown>) ?? {},
          metrics: u.metrics ?? undefined,
        })
        .eq('user_id', userId);
    }

    return true;
  } catch (err: unknown) {
    console.error('Failed to import logs into Supabase:', err);
    throw err;
  }
}
}
