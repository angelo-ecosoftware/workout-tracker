import { WorkoutSessionInputs } from './workoutSessionCalculations.ts';

export const WORKOUT_DRAFT_VERSION = 1;

export interface WorkoutDraftPayload {
  version: number;
  workoutId?: string;
  inputs: WorkoutSessionInputs;
  sessionDate?: string;
  sleepHours?: number;
  energyScore?: number;
  notes?: string;
  bodyWeightKg?: string;
  skippedExerciseIds?: string[];
  savedAt?: string;
}

export function getWorkoutDraftKey(
  userId: string | undefined,
  workoutId?: string,
  activeWorkoutId?: string
): string | null {
  if (!userId) return null;
  return `workout_draft_${userId}_${workoutId || activeWorkoutId || 'default'}`;
}

export function getSelectedWorkoutKey(userId: string | undefined): string | null {
  if (!userId) return null;
  return `workout_selected_${userId}`;
}

export function getWorkoutSessionTimerKey(
  userId: string | undefined,
  workoutId: string,
  kind: 'active' | 'start_time'
): string | null {
  if (!userId) return null;
  return `workout_session_${kind}_${userId}_${workoutId}`;
}

export function createWorkoutDraftPayload(
  workoutId: string | undefined,
  activeWorkoutId: string | undefined,
  inputs: WorkoutSessionInputs,
  sessionDate: string,
  sleepHours: number,
  energyScore: number,
  sessionNotes: string,
  bodyWeightKg: string,
  skippedExerciseIds: string[]
): WorkoutDraftPayload {
  return {
    version: WORKOUT_DRAFT_VERSION,
    workoutId: workoutId || activeWorkoutId,
    inputs,
    sessionDate,
    sleepHours,
    energyScore,
    notes: sessionNotes,
    bodyWeightKg,
    skippedExerciseIds,
    savedAt: new Date().toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidDraftShape(value: Record<string, unknown>): boolean {
  if (!isRecord(value.inputs)) return false;
  return Object.values(value.inputs).every((input) => isRecord(input));
}

/**
 * Parses the current versioned draft and safely accepts the previously
 * persisted unversioned shape when it is structurally compatible.
 */
export function parseWorkoutDraft(raw: string): WorkoutDraftPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isValidDraftShape(parsed)) return null;

    const version = parsed.version === undefined ? WORKOUT_DRAFT_VERSION : parsed.version;
    if (version !== WORKOUT_DRAFT_VERSION || typeof parsed.inputs !== 'object') {
      return null;
    }

    return {
      version: WORKOUT_DRAFT_VERSION,
      workoutId: typeof parsed.workoutId === 'string' ? parsed.workoutId : undefined,
      inputs: parsed.inputs as WorkoutSessionInputs,
      sessionDate: typeof parsed.sessionDate === 'string' ? parsed.sessionDate : undefined,
      sleepHours: typeof parsed.sleepHours === 'number' ? parsed.sleepHours : undefined,
      energyScore: typeof parsed.energyScore === 'number' ? parsed.energyScore : undefined,
      notes: typeof parsed.notes === 'string' ? parsed.notes : undefined,
      bodyWeightKg:
        typeof parsed.bodyWeightKg === 'string' || typeof parsed.bodyWeightKg === 'number'
          ? String(parsed.bodyWeightKg)
          : undefined,
      skippedExerciseIds: Array.isArray(parsed.skippedExerciseIds)
        ? parsed.skippedExerciseIds.filter((id): id is string => typeof id === 'string')
        : undefined,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : undefined,
    };
  } catch {
    return null;
  }
}
