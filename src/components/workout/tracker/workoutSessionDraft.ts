import { WorkoutSessionInputs } from './workoutSessionCalculations.ts';

export function getWorkoutDraftKey(
  userId: string | undefined,
  workoutId?: string,
  activeWorkoutId?: string
): string | null {
  if (!userId) return null;
  return `workout_draft_${userId}_${workoutId || activeWorkoutId || 'default'}`;
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
