import React, { useState, useEffect, useRef } from 'react';
import { Workout, Exercise, UserProfile } from '../models.ts';
import { Play, Check, SkipForward, Timer, Dumbbell, Zap, Eye, RotateCcw, X, AlertCircle, Sparkles } from 'lucide-react';
import { WgerExerciseInfo } from './WgerExerciseInfo.tsx';
import { playThreeSecondVibrateAlarm, playCountdownBeep } from '../utils/sound.ts';

export interface SetTimingRecord {
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  restSeconds?: number;
}

interface AssistedTimedTrackerProps {
  workout: Workout & { exercises: Exercise[] };
  userProfile: UserProfile | null;
  inputs: Record<string, { weight: string; reps: string; durationSeconds?: string; difficulty?: string }>;
  onUpdateInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', step: number) => void;
  onSetTextInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', value: string) => void;
  onFinishAllSets: (sessionTiming?: { startedAt?: Date; completedAt?: Date; setTimings?: Record<string, SetTimingRecord> }) => void;
  onExitAssistedMode?: () => void;
  restDurationSeconds?: number;
}

export const AssistedTimedTracker: React.FC<AssistedTimedTrackerProps> = ({
  workout,
  userProfile,
  inputs,
  onUpdateInput,
  onSetTextInput,
  onFinishAllSets,
  onExitAssistedMode,
  restDurationSeconds = 5,
}) => {
  const exercises = workout.exercises || [];
  const totalExercises = exercises.length;
  const assistedStateKey = workout.id ? `assisted_tracker_state_${workout.id}` : '';

  // Initialize state with localStorage persisted snapshot if available
  const getSavedAssistedState = () => {
    if (!assistedStateKey) return null;
    try {
      const saved = localStorage.getItem(assistedStateKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          // If the previous state was resting and the rest timer has elapsed while app was closed,
          // advance the initial state directly to the next set in 'ready' phase!
          const now = Date.now();
          if (parsed.phase === 'resting' && parsed.restTargetEndTime && parsed.restTargetEndTime <= now) {
            const exIdx = parsed.exerciseIndex || 0;
            const sNum = parsed.setNumber || 1;
            const curEx = exercises[exIdx];
            const targetSets = curEx?.targetSets || 1;

            // Calculate recorded rest duration
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

  // Track active position in routine
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
  }); // 1-based
  const [phase, setPhase] = useState<'ready' | 'in_progress' | 'resting' | 'completed_all'>(() => {
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

  // Exact Gym Session Timing
  const sessionStartTimeRef = useRef<Date | null>(
    initialSavedState?.sessionStartTime ? new Date(initialSavedState.sessionStartTime) : null
  );
  const restStartTimeRef = useRef<number | null>(initialSavedState?.restStartTime ?? null);
  const restTargetEndTimeRef = useRef<number | null>(initialSavedState?.restTargetEndTime ?? null);
  const setTimingsRef = useRef<Record<string, SetTimingRecord>>(initialSavedState?.setTimings ?? {});

  const timerRef = useRef<any>(null);

  // Synchronize state changes to localStorage
  const persistState = (overrides?: Partial<{
    exerciseIndex: number;
    setNumber: number;
    phase: 'ready' | 'in_progress' | 'resting' | 'completed_all';
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
  };

  const clearPersistedState = () => {
    if (!assistedStateKey) return;
    try {
      localStorage.removeItem(assistedStateKey);
    } catch (e) {
      console.warn('Could not clear assisted tracker state', e);
    }
  };

  const currentExercise = exercises[exerciseIndex];
  const currentSetKey = currentExercise ? `${currentExercise.id}-${setNumber}` : '';
  const currentValues = currentSetKey ? (inputs[currentSetKey] || { weight: '20', reps: '10', durationSeconds: '30', difficulty: '7' }) : null;

  // Handle rest countdown
  useEffect(() => {
    if (phase === 'resting') {
      const now = Date.now();
      let targetEndTime = restTargetEndTimeRef.current;
      
      // If we don't have an active target end time or it was not set
      if (!targetEndTime) {
        restStartTimeRef.current = now;
        const durationMs = restDurationSeconds * 1000;
        targetEndTime = now + durationMs;
        restTargetEndTimeRef.current = targetEndTime;
        persistState({ restStartTime: now, restTargetEndTime: targetEndTime });
      }

      // If already expired while in background/reloading
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

      // Run once immediately on mount/update
      updateRemaining();

      // Interval for continuous display update
      timerRef.current = setInterval(updateRemaining, 50);

      // Handle visibility changes when phone screen locks / unlocks or user switches apps
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
  }, [phase, exerciseIndex, setNumber, restDurationSeconds]);

  // Start current set (silent background timing)
  const handleStartSet = () => {
    const now = new Date();
    // Record gym entry timestamp on the very first set of the first exercise
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

  // Complete active set
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

      // If it's a timed exercise, populate durationSeconds
      if (currentExercise?.type === 'timed') {
        onSetTextInput(currentSetKey, 'durationSeconds', duration.toString());
      }
    }

    setSetStartTime(null);

    // Check if this was the very last set of the last exercise
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
      // Enter rest countdown phase
      const now = Date.now();
      const targetEndTime = now + (restDurationSeconds * 1000);
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

  // Helper when rest completes or is skipped
  const finishRestInterval = () => {
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
  };

  // Skip set (fills in 0 for weight & reps)
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

  // Advance helper
  const advanceToNextStep = () => {
    if (!currentExercise) return;

    if (setNumber < currentExercise.targetSets) {
      // Next set of same exercise
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
      // Next exercise
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
  };

  // Skip rest timer immediately
  const handleSkipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    finishRestInterval();
  };

  // Reset entire assisted progression
  const handleRestart = () => {
    clearPersistedState();
    setExerciseIndex(0);
    setSetNumber(1);
    setPhase('ready');
    setSetStartTime(null);
    sessionStartTimeRef.current = null;
    restStartTimeRef.current = null;
    restTargetEndTimeRef.current = null;
    setTimingsRef.current = {};
  };

  if (totalExercises === 0) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center text-gray-500 font-mono text-xs">
        No exercises found in this routine.
      </div>
    );
  }

  // Next up helper
  const getNextUpPreview = () => {
    if (!currentExercise) return null;
    if (setNumber < currentExercise.targetSets) {
      return {
        title: currentExercise.name,
        set: setNumber + 1,
        totalSets: currentExercise.targetSets,
      };
    } else if (exerciseIndex < totalExercises - 1) {
      const nextEx = exercises[exerciseIndex + 1];
      return {
        title: nextEx.name,
        set: 1,
        totalSets: nextEx.targetSets,
      };
    }
    return null;
  };

  const nextUp = getNextUpPreview();
  const cachedEx = currentExercise ? userProfile?.lastSetSummaryPerExercise?.[currentExercise.id] : null;

  const totalRestSeconds = restDurationSeconds || 5;
  const progressFraction = Math.max(0, Math.min(1, restTimeLeft / totalRestSeconds));
  // Circumference for r=70: 2 * PI * 70 = 439.8229715...
  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference * (1 - progressFraction);

  return (
    <div className="space-y-4 max-w-lg mx-auto w-full">
      {/* REST COUNTDOWN OVERLAY - Circular Timer Only */}
      {phase === 'resting' && (
        <div className="bg-[#0c0c0c] border border-[#222] rounded-3xl sm:rounded-[32px] p-6 sm:p-10 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 min-h-[360px] sm:min-h-[420px]">
          {/* Circular Countdown Gauge */}
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                fill="none"
                stroke="#1c1c1c"
                strokeWidth="10"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={circleRadius}
                fill="none"
                stroke="#C0FF00"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-100 ease-linear"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(192, 255, 0, 0.45))'
                }}
              />
            </svg>

            {/* Time in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-black text-4xl sm:text-5xl text-[#C0FF00] tracking-tight italic font-mono drop-shadow-[0_0_15px_rgba(192,255,0,0.4)]">
                {restTimeLeft}s
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-1 font-bold">
                Resting
              </span>
            </div>
          </div>

          {/* Skip Rest Button */}
          <div className="pt-2 w-full max-w-xs">
            <button
              type="button"
              onClick={handleSkipRest}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#181818] hover:bg-[#242424] border border-[#333] hover:border-[#C0FF00]/50 rounded-2xl text-xs font-mono font-bold text-white uppercase tracking-wider transition-all cursor-pointer shadow-lg"
            >
              <SkipForward className="w-4 h-4 text-[#C0FF00]" /> Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE FOCUSED SET CARD */}
      {(phase === 'ready' || phase === 'in_progress') && currentExercise && currentValues && (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl sm:rounded-[28px] p-4 sm:p-7 space-y-4 sm:space-y-6 shadow-2xl relative overflow-hidden">
          
          {/* Top exercise title & target */}
          <div className="flex items-start justify-between gap-3 border-b border-[#222] pb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#C0FF00] text-black font-display font-black text-xs flex items-center justify-center shrink-0">
                  {exerciseIndex + 1}
                </span>
                <h3 className="font-display font-black italic text-lg sm:text-2xl text-white uppercase tracking-tight truncate">
                  {currentExercise.name}
                </h3>
              </div>
              <div className="text-[11px] font-mono text-gray-400 mt-1.5 flex items-center gap-2 flex-wrap">
                <span>Target: <strong className="text-[#C0FF00]">{currentExercise.targetRepMin}-{currentExercise.targetRepMax} {currentExercise.type === 'timed' ? 'seconds' : 'reps'}</strong></span>
                <span>•</span>
                <span className="uppercase text-gray-500 font-bold">{currentExercise.type}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowWgerInfo(!showWgerInfo)}
              className="px-2.5 py-1.5 bg-[#181818] hover:bg-[#222] border border-[#333] rounded-xl text-[10px] sm:text-[11px] font-mono text-gray-300 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Eye className="w-3.5 h-3.5 text-[#C0FF00]" />
              <span className="hidden xs:inline">{showWgerInfo ? 'Hide Guide' : 'Exercise Guide'}</span>
              <span className="xs:hidden">{showWgerInfo ? 'Hide' : 'Guide'}</span>
            </button>
          </div>

          {/* Guide Dropdown */}
          {showWgerInfo && (
            <div className="p-3.5 sm:p-4 bg-[#161616] border border-[#262626] rounded-2xl">
              <WgerExerciseInfo exerciseName={currentExercise.name} />
            </div>
          )}

          {/* Active Set Box */}
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between border-b border-[#242424] pb-3">
              <span className="font-display font-black italic text-sm sm:text-base text-[#C0FF00] uppercase tracking-wider">
                SET {setNumber} OF {currentExercise.targetSets}
              </span>
              {phase === 'in_progress' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] sm:text-[10px] font-mono font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> In Progress...
                </span>
              )}
            </div>

            {/* Inputs based on strength vs timed */}
            {currentExercise.type === 'timed' ? (
              <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                    Duration (Seconds)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'durationSeconds', -5)}
                      className="px-3.5 py-2.5 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl text-white font-mono text-xs font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
                    >
                      -5
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={currentValues.durationSeconds || ''}
                      onChange={(e) => onSetTextInput(currentSetKey, 'durationSeconds', e.target.value)}
                      className="w-full min-w-0 bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl py-2.5 text-center font-mono font-black text-white text-base sm:text-lg focus:outline-none"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'durationSeconds', 5)}
                      className="px-3.5 py-2.5 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl text-[#C0FF00] font-mono text-xs font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                    Difficulty (1-10)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'difficulty', -1)}
                      className="px-3.5 py-2.5 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl text-white font-mono text-xs font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
                    >
                      -1
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={currentValues.difficulty || ''}
                      onChange={(e) => onSetTextInput(currentSetKey, 'difficulty', e.target.value)}
                      className="w-full min-w-0 bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl py-2.5 text-center font-mono font-black text-[#C0FF00] text-base sm:text-lg focus:outline-none"
                      placeholder="1-10"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'difficulty', 1)}
                      className="px-3.5 py-2.5 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl text-[#C0FF00] font-mono text-xs font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                    Weight (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'weight', -2.5)}
                      className="px-3.5 py-2.5 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl text-white font-mono text-xs font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
                    >
                      -2.5
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={currentValues.weight || ''}
                      onChange={(e) => onSetTextInput(currentSetKey, 'weight', e.target.value)}
                      className="w-full min-w-0 bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl py-2.5 text-center font-mono font-black text-white text-base sm:text-lg focus:outline-none"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'weight', 2.5)}
                      className="px-3.5 py-2.5 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl text-[#C0FF00] font-mono text-xs font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
                    >
                      +2.5
                    </button>
                  </div>
                </div>

                {/* Reps */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block font-bold">
                    Reps (Count)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'reps', -1)}
                      className="px-3.5 py-2.5 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl text-white font-mono text-xs font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
                    >
                      -1
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={currentValues.reps || ''}
                      onChange={(e) => onSetTextInput(currentSetKey, 'reps', e.target.value)}
                      className="w-full min-w-0 bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl py-2.5 text-center font-mono font-black text-[#C0FF00] text-base sm:text-lg focus:outline-none"
                      placeholder="0"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'reps', 1)}
                      className="px-3.5 py-2.5 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl text-[#C0FF00] font-mono text-xs font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Action Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleSkipSet}
              className="px-3.5 sm:px-5 py-3.5 bg-[#181818] hover:bg-[#202020] border border-[#333] rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              Skip (0)
            </button>

            {phase === 'ready' ? (
              <button
                type="button"
                onClick={handleStartSet}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black italic uppercase tracking-wider text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all shadow-[0_0_20px_rgba(192,255,0,0.25)] cursor-pointer active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" /> Start Set
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSet}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-display font-black italic uppercase tracking-wider text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.35)] cursor-pointer active:scale-[0.98]"
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> Finish Set & Rest
              </button>
            )}
          </div>

        </div>
      )}

      {/* ALL COMPLETED CONGRATS BANNER */}
      {phase === 'completed_all' && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-5 text-center space-y-2 animate-in zoom-in-95">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
          <h4 className="font-display font-black uppercase italic text-sm text-white">
            All Sets Completed!
          </h4>
          <p className="text-xs font-mono text-emerald-400/80">
            Review your workout sheet below and click "Complete & Log Workout" to record your progress.
          </p>
        </div>
      )}
    </div>
  );
};
