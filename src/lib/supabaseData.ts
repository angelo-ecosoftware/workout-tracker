import { supabase } from './supabase.ts';
import { UserProfile, BodyMeasurementLog } from '../models.ts';
import { initializeUser, saveUserMetrics } from './db/users.ts';
import { logDailyBodyWeight, fetchBodyMeasurementLogs } from './db/biometrics.ts';
import { seedTemplatesIfMissing as canonicalSeedTemplatesIfMissing } from './db/workouts.ts';

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

  if (!data) {
    await canonicalSeedTemplatesIfMissing(userId);
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
  const rawBodyLogs = localStorage.getItem(`body_logs_${userId}`);
  const cachedLogs: BodyMeasurementLog[] = rawBodyLogs ? JSON.parse(rawBodyLogs) : [];
  const latestCachedWeight = cachedLogs.length > 0 ? cachedLogs[cachedLogs.length - 1].weightKg : undefined;

  const resolvedWeight = data.weight_kg != null ? Number(data.weight_kg) : (data.metrics?.weight != null ? Number(data.metrics.weight) : (localMetrics?.weight || latestCachedWeight));
  const resolvedHeight = data.height_cm != null ? Number(data.height_cm) : (data.metrics?.height != null ? Number(data.metrics.height) : localMetrics?.height);

  // Verify last_completed_workout_order against actual completed sessions in database
  // to prevent stale state / gaps if sessions were deleted
  let verifiedLastCompletedOrder = data.last_completed_workout_order ?? 0;
  try {
    const { data: latestSession } = await supabase
      .from('sessions')
      .select('workout_id, workouts(order)')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestSession) {
      // No completed sessions exist -> reset last completed order to 0
      verifiedLastCompletedOrder = 0;
    } else {
      const order =
        (latestSession as any)?.workouts?.order ??
        (latestSession as any)?.workout_order;
      if (typeof order === 'number') {
        verifiedLastCompletedOrder = order;
      }
    }

    if (data.last_completed_workout_order !== verifiedLastCompletedOrder) {
      await supabase
        .from('users')
        .update({ last_completed_workout_order: verifiedLastCompletedOrder })
        .eq('user_id', userId);
      data.last_completed_workout_order = verifiedLastCompletedOrder;
    }
  } catch (syncErr) {
    console.warn('Could not verify latest session order:', syncErr);
  }

  return {
    profile: {
      userId: data.user_id || userId,
      email: data.email || userEmail,
      name: data.name || userName || (userEmail ? userEmail.split('@')[0] : '') || 'Athlete',
      dateOfBirth: data.date_of_birth || data.metrics?.dateOfBirth,
      gender: data.gender || data.metrics?.gender,
      heightCm: resolvedHeight,
      weightKg: resolvedWeight,
      fitnessLevel: data.fitness_level || data.metrics?.fitnessLevel,
      trainingLocation: data.training_location || data.metrics?.trainingLocation,
      lastCompletedWorkoutOrder: verifiedLastCompletedOrder,
      maxWorkoutOrder: data.max_workout_order ?? 3,
      lastSetSummaryPerExercise: data.last_set_summary_per_exercise || {},
      createdAt: data.created_at ? new Date(data.created_at) : new Date(),
      metrics: data.metrics || localMetrics || (resolvedWeight ? { weight: resolvedWeight, height: resolvedHeight } : undefined),
    } as UserProfile,
    isNewUser: false,
  };
}

// ---------------------------------------------------------------------------
// Master Exercise Catalog Database Query Service
// ---------------------------------------------------------------------------
import { WGER_EXERCISE_CATALOG, CatalogExercise } from '../data/exerciseCatalog.ts';
import { registerCatalogThumbnails } from './exerciseApiService.ts';
import { ExerciseSearchEngine } from './exerciseSearch.ts';

const CATALOG_STORAGE_KEY = 'kinisia_catalog_exercises_v1';

let cachedCatalogExercises: CatalogExercise[] | null = (() => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 50) {
        return parsed as CatalogExercise[];
      }
    }
  } catch {}
  return null;
})();

if (cachedCatalogExercises && cachedCatalogExercises.length > 50) {
  try {
    ExerciseSearchEngine.setCatalog(cachedCatalogExercises);
  } catch {}
}

/**
 * Fetches all 1,500+ animated GIF exercises directly from the Supabase PostgreSQL database (public.exercises).
 * Uses chunked range pagination to bypass Supabase's default 1,000 row cap.
 * Automatically persists full catalog to localStorage so the installed mobile app has 100% of all exercises offline.
 */
export async function fetchAllCatalogExercises(): Promise<CatalogExercise[]> {
  if (cachedCatalogExercises && cachedCatalogExercises.length > 50) {
    // Return instantly from memory / persistent storage, while allowing silent background refresh if online
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return cachedCatalogExercises;
    }
  }

  try {
    const allRows: any[] = [];
    const pageSize = 1000;
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, type, target_sets, target_rep_min, target_rep_max, category, image_url, is_custom')
        .order('name', { ascending: true })
        .range(from, from + pageSize - 1);

      if (error) {
        console.warn('Could not fetch catalog exercises from Supabase:', error);
        break;
      }

      if (!data || data.length === 0) break;
      allRows.push(...data);

      if (data.length < pageSize) break;
      from += pageSize;
    }

    if (allRows.length > 0) {
      // Register thumbnail URLs into runtime lookup
      registerCatalogThumbnails(allRows);

      const seen = new Set<string>();
      const mapped: CatalogExercise[] = [];

      const wgerMap = new Map<string, CatalogExercise>();
      for (const w of WGER_EXERCISE_CATALOG) {
        wgerMap.set(w.name.toLowerCase().trim(), w);
      }

      for (const row of allRows) {
        const key = row.name.toLowerCase().trim();
        if (seen.has(key)) continue;
        seen.add(key);

        const base = wgerMap.get(key);
        if (base) {
          mapped.push({
            ...base,
            id: String(row.id),
            category: (row.category as any) || base.category,
            images: row.image_url ? [row.image_url] : base.images,
          });
        } else {
          const category = (row.category as any) || 'Full Body';
          mapped.push({
            id: String(row.id),
            name: row.name,
            category: category,
            muscles: [category],
            equipment: 'Free Weights / Machine',
            type: (row.type === 'timed' ? 'timed' : 'strength') as 'strength' | 'timed',
            defaultSets: row.target_sets ?? 3,
            defaultRepMin: row.target_rep_min ?? 8,
            defaultRepMax: row.target_rep_max ?? 12,
            images: row.image_url ? [row.image_url] : undefined,
          });
        }
      }

      cachedCatalogExercises = mapped;
      ExerciseSearchEngine.setCatalog(mapped);

      // Persist full catalog locally so standalone installed PWA has all exercises instantly offline
      try {
        localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(mapped));
      } catch (storageErr) {
        console.warn('Could not persist catalog to localStorage:', storageErr);
      }

      return mapped;
    }
  } catch (err) {
    console.warn('Error querying exercises table:', err);
  }

  return cachedCatalogExercises && cachedCatalogExercises.length > 0
    ? cachedCatalogExercises
    : WGER_EXERCISE_CATALOG;
}

// Re-export roles, coaching, privacy, and routine library APIs
export * from './db/roles.ts';
export { initializeUser } from './db/users.ts';
export { saveUserMetrics } from './db/users.ts';
export { logDailyBodyWeight, fetchBodyMeasurementLogs } from './db/biometrics.ts';
export {
  seedTemplatesIfMissing,
  fetchWorkoutsData,
  fetchWorkoutById,
  saveWorkoutsAndExercises,
} from './db/workouts.ts';
export {
  updateSessionDate,
  updateSessionNotes,
  updateSessionCoachNotes,
  markSessionAsReviewed,
  updateSessionPhotos,
  deleteSessions,
  fetchWorkoutHistory,
  fetchSessionById,
  fetchSetsForSession,
  fetchAllSetsForUser,
  logSessionCompletion,
} from './db/sessions.ts';
export {
  createPublicSessionShare,
  fetchPublicWorkoutSession,
} from './db/publicSessionSharing.ts';
export {
  exportAllLogs,
  deleteAllLogs,
  importAllLogs,
} from './db/backup.ts';
export type { ExportScopeOptions } from './db/backup.ts';

