import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const PROMPT_VERSION = 'routine-v1';
const CATALOG_OWNER_ID = '00000000-0000-0000-0000-000000000000';

type CatalogExercise = {
  id: string;
  name: string;
  type: 'strength' | 'timed';
  target_sets: number | null;
  target_rep_min: number | null;
  target_rep_max: number | null;
};

type ProfileSnapshot = {
  fitnessLevel: string | null;
  goals: string[];
  trainingDays: string[];
  sessionDurationMinutes: number | null;
  trainingLocation: string | null;
  injuriesNotes: string | null;
};

const normalizeName = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ');

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const getServiceClient = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Supabase server configuration is missing');
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
};

const getAuthenticatedUserId = async (token: string) => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const apiKey = process.env.SUPABASE_ANON_KEY
    || process.env.VITE_SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !apiKey) throw new Error('Supabase auth configuration is missing');

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) return null;
  const user = await response.json() as { id?: string };
  return user.id || null;
};

const getGeminiKey = () =>
  process.env.GEMINI_API_KEY
  || process.env.GEMINI_API_NAME
  || process.env.GOOGLE_API_KEY
  || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  || '';

const getQuota = async (supabase: ReturnType<typeof getServiceClient>, userId: string, quotaDate: string) => {
  const { data } = await supabase
    .from('ai_routine_generation_quotas')
    .select('used_count')
    .eq('user_id', userId)
    .eq('quota_date', quotaDate)
    .maybeSingle();
  return Number(data?.used_count || 0);
};

const responseError = (res: VercelResponse, status: number, error: string, used = 0) =>
  res.status(status).json({ error, quota: { used, limit: 'unlimited' } });

const getBearerToken = (req: VercelRequest) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
};

const extractJson = (text: string): unknown => {
  const withoutFence = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(withoutFence);
};

const buildProgram = (
  generated: unknown,
  catalog: CatalogExercise[],
  userId: string,
): { program: { workouts: unknown[] }; error?: string } => {
  if (!generated || typeof generated !== 'object') return { program: { workouts: [] }, error: 'Gemini returned an invalid routine.' };
  const candidate = generated as { title?: unknown; description?: unknown; days?: unknown };
  if (typeof candidate.title !== 'string' || !Array.isArray(candidate.days) || candidate.days.length < 1 || candidate.days.length > 7) {
    return { program: { workouts: [] }, error: 'Gemini returned an invalid routine structure.' };
  }

  const catalogByName = new Map(catalog.map((exercise) => [normalizeName(exercise.name), exercise]));
  const workouts: unknown[] = [];
  for (const [dayIndex, dayValue] of candidate.days.entries()) {
    if (!dayValue || typeof dayValue !== 'object') return { program: { workouts: [] }, error: 'Gemini returned an invalid workout day.' };
    const day = dayValue as { day?: unknown; exercises?: unknown };
    if (typeof day.day !== 'string' || !Array.isArray(day.exercises) || day.exercises.length < 1 || day.exercises.length > 15) {
      return { program: { workouts: [] }, error: 'Gemini returned an invalid workout day.' };
    }

    const exercises: unknown[] = [];
    for (const exerciseValue of day.exercises) {
      if (!exerciseValue || typeof exerciseValue !== 'object') {
        return { program: { workouts: [] }, error: 'Gemini returned an invalid exercise.' };
      }
      const exercise = exerciseValue as {
        exerciseName?: unknown;
        sets?: unknown;
        repMin?: unknown;
        repMax?: unknown;
      };
      if (typeof exercise.exerciseName !== 'string') {
        return { program: { workouts: [] }, error: 'Gemini returned an exercise without a name.' };
      }
      const matched = catalogByName.get(normalizeName(exercise.exerciseName));
      if (!matched) {
        return { program: { workouts: [] }, error: `Gemini suggested an unavailable exercise: ${exercise.exerciseName}` };
      }
      const sets = Number(exercise.sets);
      const repMin = Number(exercise.repMin);
      const repMax = Number(exercise.repMax);
      if (!Number.isInteger(sets) || sets < 1 || sets > 6 || !Number.isInteger(repMin) || repMin < 1 || repMin > 30 || !Number.isInteger(repMax) || repMax < repMin || repMax > 30) {
        return { program: { workouts: [] }, error: `Gemini returned invalid targets for ${matched.name}.` };
      }
      exercises.push({
        id: matched.id,
        userId,
        name: matched.name,
        type: matched.type,
        targetSets: sets,
        targetRepMin: repMin,
        targetRepMax: repMax,
      });
    }

    workouts.push({
      id: `ai_${randomUUID()}`,
      userId,
      name: day.day,
      order: dayIndex + 1,
      exercises,
      exerciseIds: exercises.map((exercise) => (exercise as { id: string }).id),
    });
  }

  return {
    program: {
      workouts,
      ...(typeof candidate.title === 'string' ? { title: candidate.title } : {}),
      ...(typeof candidate.description === 'string' ? { description: candidate.description } : {}),
    },
  };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = getBearerToken(req);
  if (!token) return responseError(res, 401, 'You must be signed in to generate a routine.');

  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch (error) {
    return responseError(res, 500, error instanceof Error ? error.message : 'Server configuration is missing');
  }

  let userId: string | null;
  try {
    userId = await getAuthenticatedUserId(token);
  } catch (error) {
    return responseError(res, 500, error instanceof Error ? error.message : 'Supabase auth configuration is missing');
  }
  if (!userId) return responseError(res, 401, 'Your session is no longer valid.');
  const quotaDate = new Date().toISOString().slice(0, 10);
  const currentUsed = await getQuota(supabase, userId, quotaDate);
  if (req.method === 'GET') return res.status(200).json({ quota: { used: currentUsed, limit: 'unlimited' } });

  const { data: profile } = await supabase
    .from('users')
    .select('fitness_level, goals, training_days, session_duration_minutes, training_location, injuries_notes')
    .eq('user_id', userId)
    .maybeSingle();
  const requestedProfile = req.body?.profile as Partial<ProfileSnapshot> | undefined;
  if (!profile && !requestedProfile) {
    return responseError(res, 400, 'Complete your profile before generating a routine.', currentUsed);
  }

  const profileSnapshot: ProfileSnapshot = {
    fitnessLevel: profile?.fitness_level || requestedProfile?.fitnessLevel || null,
    goals: Array.isArray(profile?.goals) && profile.goals.length > 0 ? profile.goals : (requestedProfile?.goals || []),
    trainingDays: Array.isArray(profile?.training_days) && profile.training_days.length > 0 ? profile.training_days : (requestedProfile?.trainingDays || []),
    sessionDurationMinutes: profile?.session_duration_minutes || requestedProfile?.sessionDurationMinutes || null,
    trainingLocation: profile?.training_location || requestedProfile?.trainingLocation || null,
    injuriesNotes: profile?.injuries_notes || requestedProfile?.injuriesNotes || null,
  };
  if (profileSnapshot.goals.length === 0 || profileSnapshot.trainingDays.length === 0) {
    return responseError(res, 400, 'Complete your fitness goals and training days before generating a routine.', currentUsed);
  }
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const requestHash = createHash('sha256')
    .update(stableStringify({ profileSnapshot, model, promptVersion: PROMPT_VERSION, catalogVersion: 'v1' }))
    .digest('hex');

  const { data: cached } = await supabase
    .from('ai_routine_generation_cache')
    .select('program_data, model, prompt_version, created_at')
    .eq('user_id', userId)
    .eq('request_hash', requestHash)
    .maybeSingle();
  if (cached?.program_data) {
    return res.status(200).json({
      source: 'cache',
      program: cached.program_data,
      quota: { used: currentUsed, limit: 'unlimited' },
    });
  }

  const { data: reservation, error: reservationError } = await supabase.rpc('reserve_ai_routine_generation', {
    p_user_id: userId,
    p_quota_date: quotaDate,
  });
  const reservationRow = Array.isArray(reservation) ? reservation[0] : reservation;
  const used = Number(reservationRow?.used_count || currentUsed);
  if (reservationError || !reservationRow?.allowed) return responseError(res, 500, 'Could not reserve a routine generation.', used);

  const [{ data: globalExercises, error: globalExercisesError }, { data: customExercises, error: customExercisesError }] = await Promise.all([
    supabase.from('exercises').select('id,name,type,target_sets,target_rep_min,target_rep_max').eq('user_id', CATALOG_OWNER_ID).order('name'),
    supabase.from('exercises').select('id,name,type,target_sets,target_rep_min,target_rep_max').eq('user_id', userId).order('name'),
  ]);
  if (globalExercisesError || customExercisesError) {
    return responseError(res, 500, 'The exercise catalog could not be read. Please try again shortly.', used);
  }
  const catalog = [...(globalExercises || []), ...(customExercises || [])] as CatalogExercise[];
  if (catalog.length === 0) return responseError(res, 500, 'The exercise catalog is unavailable.', used);

  const prompt = [
    'You are a professional personal trainer. Create a safe, realistic weekly gym routine using only the supplied exercise catalog.',
    'Return JSON only with this exact shape: {"title":"string","description":"string","days":[{"day":"string","exercises":[{"exerciseName":"exact catalog name","sets":3,"repMin":8,"repMax":12}]}]}.',
    'Do not invent exercises. Respect the user limitations. Keep recovery balanced and use the requested training days when available.',
    `User profile: ${JSON.stringify(profileSnapshot)}`,
    `Exercise catalog: ${JSON.stringify(catalog.map((exercise) => exercise.name))}`,
  ].join('\n');
  const apiKey = getGeminiKey();
  if (!apiKey) return responseError(res, 500, 'Gemini API key is not configured.', used);

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3, maxOutputTokens: 4000 },
        }),
      },
    );
    const geminiData = await geminiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (!geminiResponse.ok) return responseError(res, geminiResponse.status, geminiData.error?.message || 'Gemini request failed.', used);

    const text = geminiData.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim() || '';
    const generated = extractJson(text);
    const { program, error } = buildProgram(generated, catalog, userId);
    if (error) return responseError(res, 422, error, used);

    await supabase.from('ai_routine_generation_cache').upsert({
      user_id: userId,
      request_hash: requestHash,
      profile_snapshot: profileSnapshot,
      program_data: program,
      model,
      prompt_version: PROMPT_VERSION,
    }, { onConflict: 'user_id,request_hash' });

    return res.status(200).json({ source: 'generated', program, quota: { used, limit: 'unlimited' } });
  } catch (error) {
    return responseError(res, 502, error instanceof Error ? error.message : 'Could not generate a routine.', used);
  }
}
