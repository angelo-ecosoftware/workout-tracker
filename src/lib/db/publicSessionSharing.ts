import { supabase } from '../supabase.ts';
import { createSharedPhotoUrl } from '../storage.ts';
import { Exercise, Session, WorkoutSet } from '../../models.ts';

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createOpaqueShareToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function hashShareToken(token: string): Promise<string> {
  if (!crypto.subtle) {
    throw new Error('Secure public sharing is unavailable in this browser.');
  }

  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return bytesToHex(new Uint8Array(digest));
}

export async function createPublicSessionShare(
  sessionId: string,
  photos: string[] | null | undefined,
  sharePhotos: boolean
): Promise<string> {
  const token = createOpaqueShareToken();
  const tokenHash = await hashShareToken(token);
  const photoUrls = sharePhotos
    ? (await Promise.all((photos || []).map((photo) => createSharedPhotoUrl(photo)))).filter(
        (photo): photo is string => Boolean(photo)
      )
    : [];

  const { error } = await supabase.from('public_session_shares').insert({
    session_id: sessionId,
    owner_id: (await supabase.auth.getUser()).data.user?.id || '',
    token_hash: tokenHash,
    share_photos: sharePhotos,
    photo_urls: photoUrls,
  });

  if (error) {
    throw new Error(error.message);
  }

  return token;
}

interface PublicSessionPayload {
  session: {
    id: string;
    status: string;
    startedAt?: string | null;
    completedAt?: string | null;
    sleepHours?: number | null;
    energyScore?: number | null;
  };
  workout: {
    id: string;
    name: string;
  };
  exercises: Array<{
    id: string;
    name: string;
    type?: string;
  }>;
  sets: Array<{
    id: string;
    exerciseId: string;
    setNumber: number;
    weight?: number | null;
    reps?: number | null;
    durationSeconds?: number | null;
  }>;
  photos: string[];
}

export async function fetchPublicWorkoutSession(shareToken: string): Promise<{
  session: Session;
  workoutName: string;
  bodyWeightKg?: null;
  calculatedBmi?: null;
  sets: (WorkoutSet & { exerciseName: string; type: 'strength' | 'timed' })[];
} | null> {
  const tokenHash = await hashShareToken(shareToken);
  const { data, error } = await supabase.rpc('get_public_session_by_token', {
    p_token_hash: tokenHash,
  });

  if (error || !data) {
    return null;
  }

  const payload = data as PublicSessionPayload;
  const exerciseMap = new Map(payload.exercises.map((exercise) => [exercise.id, exercise]));

  return {
    session: {
      id: payload.session.id,
      userId: '',
      workoutId: payload.workout.id,
      status: payload.session.status === 'completed' ? 'completed' : 'in_progress',
      startedAt: payload.session.startedAt ? new Date(payload.session.startedAt) : new Date(),
      completedAt: payload.session.completedAt ? new Date(payload.session.completedAt) : null,
      sleepHours: payload.session.sleepHours ?? null,
      energyScore: payload.session.energyScore ?? null,
      notes: null,
      coachNotes: null,
      coachName: null,
      reviewedAt: null,
      reviewedByCoachId: null,
      reviewedByCoachName: null,
      photos: payload.photos || [],
    },
    workoutName: payload.workout.name,
    bodyWeightKg: null,
    calculatedBmi: null,
    sets: payload.sets.map((set) => {
      const exercise = exerciseMap.get(set.exerciseId);
      return {
        id: set.id,
        sessionId: payload.session.id,
        userId: '',
        exerciseId: set.exerciseId,
        setNumber: set.setNumber,
        weight: set.weight ?? null,
        reps: set.reps ?? null,
        durationSeconds: set.durationSeconds ?? null,
        startedAt: null,
        completedAt: null,
        restSeconds: null,
        loggedAt: new Date(),
        exerciseName: exercise?.name || 'Exercise',
        type: exercise?.type === 'timed' ? 'timed' : 'strength',
      };
    }),
  };
}
