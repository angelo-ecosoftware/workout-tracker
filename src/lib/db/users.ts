import { supabase } from '../supabase.ts';
import { UserProfile, UserMetrics, BodyMeasurementLog } from '../../models.ts';

function getLocalStorageItem(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage?.getItem) {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore environments where localStorage is blocked or undefined
  }
  return null;
}

function setLocalStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined' && localStorage?.setItem) {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore environments where localStorage is blocked or undefined
  }
}

export async function initializeUser(userId: string, email?: string, name?: string): Promise<UserProfile> {
  const authData = supabase?.auth?.getUser ? (await supabase.auth.getUser()).data : null;
  const authUser = authData?.user;

  const resolvedEmail = email || authUser?.email || '';
  const metaName = authUser?.user_metadata?.full_name || authUser?.user_metadata?.name;
  const resolvedName = name || metaName || (resolvedEmail ? resolvedEmail.split('@')[0] : '') || 'Athlete';

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // Fallback to local storage or in-memory profile if offline/DB failure
    const localMetricsRaw = getLocalStorageItem(`user_metrics_${userId}`);
    const localMetrics = localMetricsRaw ? JSON.parse(localMetricsRaw) : undefined;
    
    // If this is a database fatal crash / infrastructure connection termination, throw
    if (error.code === '57P01') {
      throw new Error(error.message || 'Database query error');
    }

    return {
      userId,
      email: resolvedEmail,
      name: resolvedName,
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
      createdAt: new Date(),
      metrics: localMetrics,
    };
  }

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

    if (typeof supabase.from('users').upsert === 'function') {
      const { error: insertError } = await supabase.from('users').upsert(
        {
          user_id: userId,
          email: resolvedEmail,
          name: resolvedName,
          last_completed_workout_order: 0,
          max_workout_order: 3,
          last_set_summary_per_exercise: {},
          created_at: newUser.createdAt.toISOString(),
        },
        { onConflict: 'user_id' }
      );

      if (insertError) {
        console.warn('initializeUser upsert warning:', insertError);
      }
    }

    return newUser;
  }

  const isMissingEmail = !data.email && !!resolvedEmail;
  const isDefaultName = (!data.name || data.name === 'Athlete') && resolvedName !== 'Athlete';

  if (isMissingEmail || isDefaultName) {
    const patchPayload: Record<string, any> = {};
    if (isMissingEmail) patchPayload.email = resolvedEmail;
    if (isDefaultName) patchPayload.name = resolvedName;

    await supabase.from('users').update(patchPayload).eq('user_id', userId);
    data.email = resolvedEmail || data.email;
    data.name = resolvedName || data.name;
  }

  const localMetricsRaw = getLocalStorageItem(`user_metrics_${userId}`);
  const localMetrics = localMetricsRaw ? JSON.parse(localMetricsRaw) : undefined;
  const rawBodyLogs = getLocalStorageItem(`body_logs_${userId}`);
  const cachedLogs: BodyMeasurementLog[] = rawBodyLogs ? JSON.parse(rawBodyLogs) : [];
  const latestCachedWeight = cachedLogs.length > 0 ? cachedLogs[cachedLogs.length - 1].weightKg : undefined;

  const resolvedWeight = data.weight_kg != null ? Number(data.weight_kg) : (data.metrics?.weight != null ? Number(data.metrics.weight) : (localMetrics?.weight || latestCachedWeight));
  const resolvedHeight = data.height_cm != null ? Number(data.height_cm) : (data.metrics?.height != null ? Number(data.metrics.height) : localMetrics?.height);

  return {
    userId: data.user_id || userId,
    email: data.email || resolvedEmail,
    name: data.name || resolvedName,
    dateOfBirth: data.date_of_birth || data.metrics?.dateOfBirth,
    gender: data.gender || data.metrics?.gender,
    heightCm: resolvedHeight,
    weightKg: resolvedWeight,
    fitnessLevel: data.fitness_level || data.metrics?.fitnessLevel,
    trainingLocation: data.training_location || data.metrics?.trainingLocation,
    lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
    maxWorkoutOrder: data.max_workout_order ?? 3,
    lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    metrics: data.metrics || localMetrics || (resolvedWeight ? { weight: resolvedWeight, height: resolvedHeight } : undefined),
  } as UserProfile;
}

export async function saveUserMetrics(userId: string, metrics: UserMetrics) {
  try {
    setLocalStorageItem(`user_metrics_${userId}`, JSON.stringify(metrics));
    const { error } = await supabase
      .from('users')
      .update({ metrics })
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase saveUserMetrics error:', error);
    }
  } catch (err) {
    console.warn('Failed to save user metrics:', err);
  }
}
