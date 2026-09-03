import { useState, useEffect, useRef, useCallback } from 'react';
import { Workout, Exercise } from '../models.ts';
import { playThreeSecondVibrateAlarm } from '../utils/sound.ts';

export interface SetTimingRecord {
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  restSeconds?: number;
}

export type AssistedPhase = 'ready' | 'in_progress' | 'resting' | 'completed_all';

interface UseAssistedTrackerProps {
  workout: Workout & { exercises: Exercise[] };
  inputs: Record<string, { weight: string; reps: string; durationSeconds?: string; difficulty?: string }>;
  onSetTextInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', value: string) => void;
  onFinishAllSets: (sessionTiming?: { startedAt?: Date; completedAt?: Date; setTimings?: Record<string, SetTimingRecord> }) => void;
  restDurationSeconds?: number;
}

export function useAssistedTracker({
  workout,
  inputs,
  onSetTextInput,
  onFinishAllSets,
  restDurationSeconds = 5,
}: UseAssistedTrackerProps) {
  const exercises = workout.exercises || [];
  const totalExercises = exercises.length;
  const assistedStateKey = workout.id ? `assisted_tracker_state_${workout.id}` : '';

  const getSavedAssistedState = () => {
    if (!assistedStateKey) return null;
    try {
      const saved = localStorage.getItem(assistedStateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const now = Date.now();
          if (parsed.phase === 'resting' && parsed.restTargetEndTime && parsed.restTargetEndTime <= now) {
            const exIdx = parsed.exerciseIndex || 0;
            const sNum = parsed.setNumber || 1;
            const curEx = exercises[exIdx];
            const targetSets = curEx?.targetSets || 1;

            const curKey = curEx ? `${curEx.id}-${sNum}` : '';
            const updatedTimings = { ...(parsed.setTimings || {}) };
            if (curKey && parsed.restStartTime) {
              const restSec = Math.max(1, Math.round((now - parsed.restStartTime) / 1000));
              updatedTimings[curKey] = {
                ...(updatedTimings[curKey] || {}),
                restSeconds: restSec,
              };
            }

            if (sNum < targetSets) {
              parsed.setNumber = sNum + 1;
              parsed.phase = 'ready';
              parsed.restStartTime = null;
              parsed.restTargetEndTime = null;
              parsed.setTimings = updatedTimings;
            } else if (exIdx < exercises.length - 1) {
              parsed.exerciseIndex = exIdx + 1;
              parsed.setNumber = 1;
              parsed.phase = 'ready';
              parsed.restStartTime = null;
              parsed.restTargetEndTime = null;
              parsed.setTimings = updatedTimings;
            } else {
              parsed.phase = 'completed_all';
              parsed.restStartTime = null;
              parsed.restTargetEndTime = null;
              parsed.setTimings = updatedTimings;
            }

            try {
              localStorage.setItem(assistedStateKey, JSON.stringify(parsed));
            } catch (e) {
              console.warn('Could not update assisted state', e);
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read assisted tracker state from localStorage', e);
    }
    return null;
  };

  const initialSavedState = getSavedAssistedState();

  const [exerciseIndex, setExerciseIndex] = useState<number>(() => {
    if (initialSavedState && typeof initialSavedState.exerciseIndex === 'number') {
      return Math.min(initialSavedState.exerciseIndex, Math.max(0, exercises.length - 1));
    }
    return 0;
  });
  const [setNumber, setSetNumber] = useState<number>(() => {
    if (initialSavedState && typeof initialSavedState.setNumber === 'number') {
      return initialSavedState.setNumber;
    }
    return 1;
  });
  const [phase, setPhase] = useState<AssistedPhase>(() => {
    if (initialSavedState && initialSavedState.phase) {
      return initialSavedState.phase;
    }
    return 'ready';
  });
  const [setStartTime, setSetStartTime] = useState<number | null>(() => {
    return initialSavedState?.setStartTime ?? null;
  });
  const [restTimeLeft, setRestTimeLeft] = useState<number>(() => {
    if (initialSavedState?.phase === 'resting' && initialSavedState?.restTargetEndTime) {
      const diffSec = Math.ceil((initialSavedState.restTargetEndTime - Date.now()) / 1000);
      return Math.max(0, diffSec);
    }
    return restDurationSeconds;
  });
  const [recordedDurations, setRecordedDurations] = useState<Record<string, number>>(() => {
    return initialSavedState?.recordedDurations ?? {};
  });
  const [showWgerInfo, setShowWgerInfo] = useState(false);

  const sessionStartTimeRef = useRef<Date | null>(
    initialSavedState?.sessionStartTime ? new Date(initialSavedState.sessionStartTime) : null
  );
  const restStartTimeRef = useRef<number | null>(initialSavedState?.restStartTime ?? null);
  const restTargetEndTimeRef = useRef<number | null>(initialSavedState?.restTargetEndTime ?? null);
  const setTimingsRef = useRef<Record<string, SetTimingRecord>>(initialSavedState?.setTimings ?? {});
  const timerRef = useRef<any>(null);

  const persistState = useCallback((overrides?: Partial<{
    exerciseIndex: number;
    setNumber: number;
    phase: AssistedPhase;
    setStartTime: number | null;
    restStartTime: number | null;
    restTargetEndTime: number | null;
    recordedDurations: Record<string, number>;
  }>) => {
    if (!assistedStateKey) return;
    try {
      const stateToSave = {
        exerciseIndex: overrides?.exerciseIndex ?? exerciseIndex,
        setNumber: overrides?.setNumber ?? setNumber,
        phase: overrides?.phase ?? phase,
        setStartTime: overrides?.setStartTime !== undefined ? overrides.setStartTime : setStartTime,
        restStartTime: overrides?.restStartTime !== undefined ? overrides.restStartTime : restStartTimeRef.current,
        restTargetEndTime: overrides?.restTargetEndTime !== undefined ? overrides.restTargetEndTime : restTargetEndTimeRef.current,
        recordedDurations: overrides?.recordedDurations ?? recordedDurations,
        sessionStartTime: sessionStartTimeRef.current ? sessionStartTimeRef.current.toISOString() : null,
        setTimings: setTimingsRef.current,
        updatedAt: Date.now(),
      };
      localStorage.setItem(assistedStateKey, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not persist assisted tracker state', e);
    }
  }, [assistedStateKey, exerciseIndex, setNumber, phase, setStartTime, recordedDurations]);

  const clearPersistedState = useCallback(() => {
    if (!assistedStateKey) return;
    try {
      localStorage.removeItem(assistedStateKey);
    } catch (e) {
      console.warn('Could not clear assisted tracker state', e);
    }
  }, [assistedStateKey]);

  const currentExercise = exercises[exerciseIndex];
  const currentSetKey = currentExercise ? `${currentExercise.id}-${setNumber}` : '';
  const currentValues = currentSetKey ? (inputs[currentSetKey] || { weight: '20', reps: '10', durationSeconds: '30', difficulty: '7' }) : null;

  const advanceToNextStep = useCallback(() => {
    if (!currentExercise) return;

    if (setNumber < currentExercise.targetSets) {
      const nextSet = setNumber + 1;
      setSetNumber(nextSet);
      setPhase('ready');
      restTargetEndTimeRef.current = null;
      persistState({
        setNumber: nextSet,
        phase: 'ready',
        setStartTime: null,
        restStartTime: null,
        restTargetEndTime: null,
      });
    } else {
      if (exerciseIndex < totalExercises - 1) {
        const nextIdx = exerciseIndex + 1;
        setExerciseIndex(nextIdx);
        setSetNumber(1);
        setPhase('ready');
        restTargetEndTimeRef.current = null;
        persistState({
          exerciseIndex: nextIdx,
          setNumber: 1,
          phase: 'ready',
          setStartTime: null,
          restStartTime: null,
          restTargetEndTime: null,
        });
      } else {
        setPhase('completed_all');
        clearPersistedState();
        onFinishAllSets({
          startedAt: sessionStartTimeRef.current || undefined,
          completedAt: new Date(),
          setTimings: { ...setTimingsRef.current },
        });
      }
    }
  }, [currentExercise, setNumber, exerciseIndex, totalExercises, persistState, clearPersistedState, onFinishAllSets]);

  const finishRestInterval = useCallback(() => {
    if (restStartTimeRef.current && currentSetKey) {
      const restDuration = Math.max(1, Math.round((Date.now() - restStartTimeRef.current) / 1000));
      setTimingsRef.current[currentSetKey] = {
        ...setTimingsRef.current[currentSetKey],
        restSeconds: restDuration,
      };
      restStartTimeRef.current = null;
      restTargetEndTimeRef.current = null;
    }
    advanceToNextStep();
  }, [currentSetKey, advanceToNextStep]);

  useEffect(() => {
    if (phase === 'resting') {
      const now = Date.now();
      let targetEndTime = restTargetEndTimeRef.current;

      if (!targetEndTime) {
        restStartTimeRef.current = now;
        const durationMs = restDurationSeconds * 1000;
        targetEndTime = now + durationMs;
        restTargetEndTimeRef.current = targetEndTime;
        persistState({ restStartTime: now, restTargetEndTime: targetEndTime });
      }

      if (targetEndTime <= now) {
        setRestTimeLeft(0);
        restTargetEndTimeRef.current = null;
        finishRestInterval();
        return;
      }

      const updateRemaining = () => {
        const currentTime = Date.now();
        const activeTarget = restTargetEndTimeRef.current || targetEndTime!;
        const remainingMs = Math.max(0, activeTarget - currentTime);
        const remainingSec = Math.ceil(remainingMs / 1000);

        setRestTimeLeft(remainingSec);

        if (remainingMs <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          restTargetEndTimeRef.current = null;
          playThreeSecondVibrateAlarm();
          finishRestInterval();
        }
      };

      updateRemaining();
      timerRef.current = setInterval(updateRemaining, 50);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          updateRemaining();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, exerciseIndex, setNumber, restDurationSeconds, finishRestInterval, persistState]);

  const handleStartSet = () => {
    const now = new Date();
    if (!sessionStartTimeRef.current && exerciseIndex === 0 && setNumber === 1) {
      sessionStartTimeRef.current = now;
    }

    const startTimestamp = Date.now();
    setSetStartTime(startTimestamp);
    if (currentSetKey) {
      setTimingsRef.current[currentSetKey] = {
        ...setTimingsRef.current[currentSetKey],
        startedAt: now,
      };
    }

    setPhase('in_progress');
    persistState({
      phase: 'in_progress',
      setStartTime: startTimestamp,
      restStartTime: null,
      restTargetEndTime: null,
    });
  };

  const handleFinishSet = () => {
    const finishDate = new Date();
    const finishTime = finishDate.getTime();
    const duration = setStartTime ? Math.max(1, Math.round((finishTime - setStartTime) / 1000)) : 0;

    let updatedDurations = recordedDurations;
    if (currentSetKey) {
      updatedDurations = { ...recordedDurations, [currentSetKey]: duration };
      setRecordedDurations(updatedDurations);
      setTimingsRef.current[currentSetKey] = {
        ...setTimingsRef.current[currentSetKey],
        completedAt: finishDate,
        durationSeconds: duration,
      };

      if (currentExercise?.type === 'timed') {
        onSetTextInput(currentSetKey, 'durationSeconds', duration.toString());
      }
    }

    setSetStartTime(null);

    const isLastSetOfCurrentExercise = setNumber >= (currentExercise?.targetSets || 1);
    const isLastExercise = exerciseIndex >= totalExercises - 1;

    if (isLastSetOfCurrentExercise && isLastExercise) {
      setPhase('completed_all');
      clearPersistedState();
      onFinishAllSets({
        startedAt: sessionStartTimeRef.current || undefined,
        completedAt: finishDate,
        setTimings: { ...setTimingsRef.current },
      });
    } else {
      const now = Date.now();
      const targetEndTime = now + restDurationSeconds * 1000;
      restStartTimeRef.current = now;
      restTargetEndTimeRef.current = targetEndTime;

      setPhase('resting');
      persistState({
        phase: 'resting',
        setStartTime: null,
        restStartTime: now,
        restTargetEndTime: targetEndTime,
        recordedDurations: updatedDurations,
      });
    }
  };

  const handleSkipSet = () => {
    if (currentSetKey) {
      if (currentExercise?.type === 'timed') {
        onSetTextInput(currentSetKey, 'durationSeconds', '0');
        onSetTextInput(currentSetKey, 'difficulty', '0');
      } else {
        onSetTextInput(currentSetKey, 'weight', '0');
        onSetTextInput(currentSetKey, 'reps', '0');
      }
    }

    setSetStartTime(null);
    const isLastSetOfCurrentExercise = setNumber >= (currentExercise?.targetSets || 1);
    const isLastExercise = exerciseIndex >= totalExercises - 1;

    if (isLastSetOfCurrentExercise && isLastExercise) {
      setPhase('completed_all');
      clearPersistedState();
      onFinishAllSets({
        startedAt: sessionStartTimeRef.current || undefined,
        completedAt: new Date(),
        setTimings: { ...setTimingsRef.current },
      });
    } else {
      advanceToNextStep();
    }
  };

  const handleSkipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    finishRestInterval();
  };

  return {
    exercises,
    totalExercises,
    exerciseIndex,
    setNumber,
    phase,
    restTimeLeft,
    showWgerInfo,
    setShowWgerInfo,
    currentExercise,
    currentSetKey,
    currentValues,
    handleStartSet,
    handleFinishSet,
    handleSkipSet,
    handleSkipRest,
  };
}
