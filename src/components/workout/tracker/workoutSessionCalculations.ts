import { Exercise, UserProfile, Workout } from '../../../models.ts';
import { ProgressionEngine } from '../../../engine.ts';
import { SetLogPayload } from '../../../types/api.ts';
import type { ExercisePR, WorkoutSummaryCelebration } from './WorkoutCompletionModal.tsx';

type ActiveWorkout = Workout & { exercises: Exercise[] };

export type WorkoutSessionInput = {
  weight: string;
  reps: string;
  durationSeconds?: string;
  difficulty?: string;
  completed?: boolean;
  completedAt?: string;
  startedAt?: string;
  restSeconds?: number;
};

export type WorkoutSessionInputs = Record<string, WorkoutSessionInput>;

export function sanitizeWorkoutInputValue(
  field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
  value: string
): string {
  let sanitized = value;
  if (field === 'weight') {
    sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('');
    }
  } else if (field === 'difficulty') {
    sanitized = value.replace(/[^0-9]/g, '');
    if (sanitized !== '') {
      const num = parseInt(sanitized, 10);
      if (num > 10) sanitized = '10';
      else if (num < 1 && sanitized !== '0') sanitized = '1';
    }
  } else {
    sanitized = value.replace(/[^0-9]/g, '');
  }
  return sanitized;
}

export function buildWorkoutSetPayload(
  activeWorkout: ActiveWorkout,
  skippedExerciseIds: Set<string>,
  inputs: WorkoutSessionInputs,
  userProfile: UserProfile | null,
  isSequentialSetMode: boolean,
): { finalSetsPayload: SetLogPayload[]; warnings: string[] } {
  const finalSetsPayload: SetLogPayload[] = [];
  const warnings: string[] = [];

  for (const ex of activeWorkout.exercises) {
    if (skippedExerciseIds.has(ex.id)) continue;

    const cachedEx = userProfile
      ? ProgressionEngine.evaluateProgression(ex.id, userProfile.lastSetSummaryPerExercise)
      : null;

    for (let i = 1; i <= ex.targetSets; i++) {
      const key = `${ex.id}-${i}`;
      const isTimed = ex.type === 'timed';
      const defaultInput: WorkoutSessionInput = isTimed
        ? {
            weight: '',
            reps: '',
            durationSeconds: ex.targetRepMin?.toString() || '30',
            difficulty: '7',
          }
        : { weight: '20', reps: '10', durationSeconds: '', difficulty: '' };

      const rawInputValues = inputs[key] || defaultInput;
      const isSetChecked = Boolean(rawInputValues.completed);
      const inputValues = isSequentialSetMode && !isSetChecked
        ? {
            ...rawInputValues,
            weight: '0',
            reps: '0',
            durationSeconds: '0',
          }
        : rawInputValues;

      if (isTimed) {
        let secNum = parseInt(inputValues.durationSeconds || '', 10);
        let diffNum: number | null = parseInt(inputValues.difficulty || '', 10);
        if (isNaN(diffNum)) {
          diffNum = null;
        } else {
          if (diffNum < 1) diffNum = 1;
          if (diffNum > 10) diffNum = 10;
        }

        if (isNaN(secNum)) {
          secNum = 0;
          warnings.push(`${ex.name} (Set ${i}): Duration is empty or non-numeric (will record as 0s).`);
        } else if (secNum > 3600) {
          warnings.push(`${ex.name} (Set ${i}): Duration (${secNum}s) exceeds 1 hour.`);
        } else if (secNum <= 0) {
          warnings.push(`${ex.name} (Set ${i}): Duration is 0s.`);
        }

        finalSetsPayload.push({
          exerciseId: ex.id,
          setNumber: i,
          weight: null,
          reps: null,
          durationSeconds: secNum,
          difficulty: diffNum,
          startedAt: inputValues.startedAt ? new Date(inputValues.startedAt) : null,
          completedAt: inputValues.completedAt ? new Date(inputValues.completedAt) : null,
        });
      } else {
        let weightNum = parseFloat(inputValues.weight || '');
        let repsNum = parseInt(inputValues.reps || '', 10);

        if (isNaN(weightNum)) {
          weightNum = 0;
          warnings.push(`${ex.name} (Set ${i}): Weight is empty or non-numeric (will record as 0 kg).`);
        } else if (weightNum > 350) {
          warnings.push(`${ex.name} (Set ${i}): Weight (${weightNum} kg) is unusually high (>350 kg).`);
        } else if (weightNum < 0) {
          warnings.push(`${ex.name} (Set ${i}): Weight (${weightNum} kg) is negative.`);
        }

        if (isNaN(repsNum)) {
          repsNum = 0;
          warnings.push(`${ex.name} (Set ${i}): Rep count is empty or non-numeric (will record as 0 reps).`);
        } else if (repsNum > 100) {
          warnings.push(`${ex.name} (Set ${i}): Rep count (${repsNum} reps) is unusually high (>100 reps).`);
        } else if (repsNum <= 0 && isSetChecked) {
          warnings.push(`${ex.name} (Set ${i}): Rep count is 0.`);
        }

        if (cachedEx?.lastWeight && cachedEx.lastWeight >= 20 && weightNum >= cachedEx.lastWeight * 3) {
          warnings.push(
            `${ex.name} (Set ${i}): Weight (${weightNum} kg) is more than 3x your previous benchmark (${cachedEx.lastWeight} kg).`
          );
        }

        finalSetsPayload.push({
          exerciseId: ex.id,
          setNumber: i,
          weight: weightNum,
          reps: repsNum,
          durationSeconds: null,
          difficulty: null,
          startedAt: inputValues.startedAt ? new Date(inputValues.startedAt) : null,
          completedAt: inputValues.completedAt ? new Date(inputValues.completedAt) : null,
        });
      }
    }
  }

  return { finalSetsPayload, warnings };
}

export function getWorkoutProgressionAdvice(
  ex: Exercise,
  userProfile: UserProfile | null,
): { action: 'increase' | 'keep' | 'deload'; details: string } {
  if (!userProfile) return { action: 'keep', details: 'Checking history...' };

  const cachedEx = ProgressionEngine.evaluateProgression(
    ex.id,
    userProfile.lastSetSummaryPerExercise
  );

  if (!cachedEx) return { action: 'keep', details: 'First log. Start focused.' };

  if (ex.type === 'timed') {
    const hitMaxDuration = (cachedEx.lastDurationSeconds || 0) >= ex.targetRepMax;
    if (hitMaxDuration) {
      return {
        action: 'increase',
        details: 'Time Target Cleared! Increase time (+5s) or add lever difficulty.',
      };
    }
    const lastDuration = cachedEx.lastDurationSeconds || 30;
    return {
      action: 'keep',
      details: `Hold clean form. Target ${ex.targetRepMax}s (last: ${lastDuration}s).`,
    };
  }

  const hitMaxReps = (cachedEx.lastReps || 0) >= ex.targetRepMax;
  if (hitMaxReps) {
    const lastAvgWeight = Number(cachedEx.lastWeight || 0);
    const proposedNewWeight = lastAvgWeight + 2.5;
    return {
      action: 'increase',
      details: `Progression Hit! Try ${proposedNewWeight.toFixed(1)}kg (+2.5kg)`,
    };
  }
  return {
    action: 'keep',
    details: `Keep weight at current ${Number(cachedEx.lastWeight || 20)}kg to master reps.`,
  };
}

export function calculateWorkoutCelebrationSummary(
  activeWorkout: ActiveWorkout,
  finalSetsPayload: SetLogPayload[],
  skippedExerciseIds: Set<string>,
  userProfile: UserProfile | null,
): WorkoutSummaryCelebration {
  let totalVolume = 0;
  let totalRepsCount = 0;
  const prsAchieved: ExercisePR[] = [];

  for (const ex of activeWorkout.exercises) {
    if (skippedExerciseIds.has(ex.id)) continue;
    const exSets = finalSetsPayload.filter((s) => s.exerciseId === ex.id);
    const cachedEx = userProfile?.lastSetSummaryPerExercise?.[ex.id];
    const previous1RM = cachedEx
      ? ProgressionEngine.calculate1RM(cachedEx.lastWeight, cachedEx.lastReps)
      : undefined;

    let bestSet1RM = 0;
    let bestWeight = 0;
    let bestReps = 0;

    for (const s of exSets) {
      const w = s.weight || 0;
      const r = s.reps || 0;
      totalVolume += w * r;
      totalRepsCount += r;

      if (w > 0 && r > 0) {
        const set1RM = ProgressionEngine.calculate1RM(w, r);
        if (set1RM > bestSet1RM) {
          bestSet1RM = set1RM;
          bestWeight = w;
          bestReps = r;
        }
      }
    }

    if (bestSet1RM > 0 && (!previous1RM || bestSet1RM > previous1RM)) {
      prsAchieved.push({
        exerciseName: ex.name,
        weight: bestWeight,
        reps: bestReps,
        estimated1RM: bestSet1RM,
        previous1RM,
        improvementKg: previous1RM ? Math.round((bestSet1RM - previous1RM) * 10) / 10 : undefined,
        isNew1RMRecord: true,
      });
    }
  }

  return {
    workoutName: activeWorkout.name,
    totalVolumeKg: Math.round(totalVolume),
    totalReps: totalRepsCount,
    completedSetsCount: finalSetsPayload.length,
    prsAchieved,
  };
}
