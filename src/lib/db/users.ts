import { supabase } from '../supabase.ts';
import { UserProfile, UserMetrics, BodyMeasurementLog } from '../../models.ts';
import { logDailyBodyWeight } from './biometrics.ts';

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
  const localOnboardingRaw = getLocalStorageItem(`onboarding_profile_${userId}`);
  const localOnboarding = localOnboardingRaw ? JSON.parse(localOnboardingRaw) : undefined;
  const rawBodyLogs = getLocalStorageItem(`body_logs_${userId}`);
  const cachedLogs: BodyMeasurementLog[] = rawBodyLogs ? JSON.parse(rawBodyLogs) : [];
  const latestCachedWeight = cachedLogs.length > 0 ? cachedLogs[cachedLogs.length - 1].weightKg : undefined;

  const resolvedWeight = data.weight_kg != null ? Number(data.weight_kg) : (data.metrics?.weight != null ? Number(data.metrics.weight) : (localMetrics?.weight || latestCachedWeight));
  const resolvedHeight = data.height_cm != null ? Number(data.height_cm) : (data.metrics?.height != null ? Number(data.metrics.height) : localMetrics?.height);
  const resolvedMetrics: UserMetrics = {
    ...(localMetrics || {}),
    ...(data.metrics || {}),
    dateOfBirth: data.date_of_birth || data.metrics?.dateOfBirth || localMetrics?.dateOfBirth || localOnboarding?.dateOfBirth,
    gender: data.gender || data.metrics?.gender || localMetrics?.gender || localOnboarding?.gender,
    trainingDays: data.training_days?.length ? data.training_days : data.metrics?.trainingDays || localMetrics?.trainingDays || localOnboarding?.trainingDays,
    sessionDurationMinutes: data.session_duration_minutes || data.metrics?.sessionDurationMinutes || localMetrics?.sessionDurationMinutes || localOnboarding?.sessionDurationMinutes,
    injuriesNotes: data.injuries_notes || data.metrics?.injuriesNotes || data.metrics?.bodyMeasurementsNotes || localMetrics?.injuriesNotes || localMetrics?.bodyMeasurementsNotes || localOnboarding?.injuriesNotes,
  };
  const resolvedBodyType = data.body_type || data.metrics?.somatotype || localMetrics?.somatotype;
  if (resolvedBodyType) resolvedMetrics.somatotype = resolvedBodyType;

  return {
    userId: data.user_id || userId,
    email: data.email || resolvedEmail,
    name: data.name || resolvedName,
    dateOfBirth: data.date_of_birth || data.metrics?.dateOfBirth || localMetrics?.dateOfBirth || localOnboarding?.dateOfBirth,
    gender: data.gender || data.metrics?.gender || localMetrics?.gender || localOnboarding?.gender,
    heightCm: resolvedHeight || localOnboarding?.heightCm,
    weightKg: resolvedWeight || localOnboarding?.weightKg,
    fitnessLevel: data.fitness_level || data.metrics?.fitnessLevel || localMetrics?.fitnessLevel || localOnboarding?.fitnessLevel,
    trainingLocation: data.training_location || data.metrics?.trainingLocation || localMetrics?.trainingLocation || localOnboarding?.trainingLocation,
    onboardingStatus: data.onboarding_status || 'not_started',
    onboardingCompletedAt: data.onboarding_completed_at || undefined,
    onboardingVersion: data.onboarding_version || undefined,
    trainingDays: data.training_days?.length ? data.training_days : data.metrics?.trainingDays || localMetrics?.trainingDays || [],
    sessionDurationMinutes: data.session_duration_minutes || data.metrics?.sessionDurationMinutes || localMetrics?.sessionDurationMinutes || localOnboarding?.sessionDurationMinutes || undefined,
    goals: data.goals?.length ? data.goals : data.metrics?.goals || localMetrics?.goals || localOnboarding?.goals || [],
    injuriesNotes: data.injuries_notes || data.metrics?.injuriesNotes || data.metrics?.bodyMeasurementsNotes || localMetrics?.injuriesNotes || localMetrics?.bodyMeasurementsNotes || localOnboarding?.injuriesNotes || undefined,
    lastCompletedWorkoutOrder: data.last_completed_workout_order ?? 0,
    maxWorkoutOrder: data.max_workout_order ?? 3,
    lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    metrics: Object.keys(resolvedMetrics).length > 0
      ? resolvedMetrics
      : (resolvedWeight ? { weight: resolvedWeight, height: resolvedHeight } : undefined),
  } as UserProfile;
}

export interface OnboardingProfileData {
  trainingDays: string[];
  sessionDurationMinutes: 30 | 60 | 90 | 120;
  fitnessLevel: UserProfile['fitnessLevel'];
  trainingLocation: UserProfile['trainingLocation'];
  goals: string[];
  dateOfBirth?: string;
  gender?: UserProfile['gender'];
  heightCm?: number;
  weightKg?: number;
  bodyType?: UserMetrics['somatotype'];
  injuriesNotes?: string;
}

export async function saveOnboardingProfile(
  userId: string,
  profile: OnboardingProfileData,
  status: 'completed' | 'deferred' = 'completed'
): Promise<void> {
  const updatedAt = new Date().toISOString();
  const completedAt = status === 'completed' ? updatedAt : null;
  setLocalStorageItem(`onboarding_profile_${userId}`, JSON.stringify({
    ...profile,
    onboardingStatus: status,
    onboardingCompletedAt: completedAt,
  }));
  setLocalStorageItem(`onboarding_deferred_${userId}`, status === 'deferred' ? 'true' : 'false');

  const updatePayload: Record<string, unknown> = {
    training_days: profile.trainingDays,
    session_duration_minutes: profile.sessionDurationMinutes,
    fitness_level: profile.fitnessLevel,
    training_location: profile.trainingLocation,
    goals: profile.goals,
    date_of_birth: profile.dateOfBirth || null,
    gender: profile.gender || null,
    injuries_notes: profile.injuriesNotes || null,
    onboarding_status: status,
    onboarding_version: 1,
    onboarding_completed_at: completedAt,
    metrics: {
      trainingDays: profile.trainingDays,
      sessionDurationMinutes: profile.sessionDurationMinutes,
      fitnessLevel: profile.fitnessLevel,
      trainingLocation: profile.trainingLocation,
      goals: profile.goals,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      height: profile.heightCm,
      weight: profile.weightKg,
      somatotype: profile.bodyType,
      injuriesNotes: profile.injuriesNotes,
      bodyMeasurementsNotes: profile.injuriesNotes,
    },
    updated_at: updatedAt,
  };
  if (profile.heightCm) updatePayload.height_cm = profile.heightCm;
  if (profile.weightKg) updatePayload.weight_kg = profile.weightKg;
  if (profile.bodyType) updatePayload.body_type = profile.bodyType;

  const { error } = await supabase.from('users').update(updatePayload).eq('user_id', userId);
  if (error) {
    console.warn('Could not save typed onboarding profile:', error.message);
    const legacyPayload = {
      metrics: {
        trainingDays: profile.trainingDays,
        sessionDurationMinutes: profile.sessionDurationMinutes,
        fitnessLevel: profile.fitnessLevel,
        trainingLocation: profile.trainingLocation,
        goals: profile.goals,
        height: profile.heightCm,
        weight: profile.weightKg,
        somatotype: profile.bodyType,
        bodyMeasurementsNotes: profile.injuriesNotes,
      },
      updated_at: updatedAt,
    };
    await supabase.from('users').update(legacyPayload).eq('user_id', userId);
  }
}

export async function saveUserMetrics(userId: string, metrics: UserMetrics) {
  // Preserve the production contract: cache immediately for offline use,
  // persist explicit profile columns plus the JSON snapshot, then record a
  // daily body log when a weight is supplied.
  try {
    setLocalStorageItem(`user_metrics_${userId}`, JSON.stringify(metrics));
  } catch (err) {
    console.warn('Could not cache user metrics locally:', err);
  }

  try {
    const updatePayload: Record<string, unknown> = { metrics };
    if (metrics.dateOfBirth !== undefined) updatePayload.date_of_birth = metrics.dateOfBirth || null;
    if (metrics.gender !== undefined) updatePayload.gender = metrics.gender || null;
    if (metrics.height !== undefined) updatePayload.height_cm = metrics.height || null;
    if (metrics.weight !== undefined) updatePayload.weight_kg = metrics.weight || null;
    if (metrics.fitnessLevel !== undefined) updatePayload.fitness_level = metrics.fitnessLevel || null;
    if (metrics.trainingLocation !== undefined) updatePayload.training_location = metrics.trainingLocation || null;
    if (metrics.trainingDays !== undefined) updatePayload.training_days = metrics.trainingDays;
    if (metrics.sessionDurationMinutes !== undefined) updatePayload.session_duration_minutes = metrics.sessionDurationMinutes || null;
    if (metrics.goals !== undefined) updatePayload.goals = metrics.goals;
    if (metrics.injuriesNotes !== undefined) updatePayload.injuries_notes = metrics.injuriesNotes || null;
    if (metrics.somatotype !== undefined) updatePayload.body_type = metrics.somatotype || null;
    updatePayload.updated_at = new Date().toISOString();

    const { error } = await supabase.from('users').update(updatePayload).eq('user_id', userId);
    if (error) {
      // Preserve compatibility with deployments missing newer explicit columns.
      await supabase.from('users').update({ metrics, updated_at: updatePayload.updated_at }).eq('user_id', userId);
    }
  } catch (err) {
    console.warn('Supabase update metrics failed:', err);
  }

  if (metrics.weight && metrics.weight > 0) {
    const today = new Date().toISOString().split('T')[0];
    await logDailyBodyWeight(userId, {
      date: today,
      weightKg: metrics.weight,
      heightCm: metrics.height,
      source: 'profile',
      notes: metrics.bodyMeasurementsNotes,
    });
  }
}
