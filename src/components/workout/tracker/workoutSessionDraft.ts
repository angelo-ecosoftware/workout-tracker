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
  return userId ? `workout_selected_${userId}` : null;
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
) {
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

export function parseWorkoutDraft(raw: string): WorkoutDraftPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isRecord(parsed.inputs)) return null;
    const version = parsed.version === undefined ? WORKOUT_DRAFT_VERSION : parsed.version;
    if (version !== WORKOUT_DRAFT_VERSION) return null;
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
