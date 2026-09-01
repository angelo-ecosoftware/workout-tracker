import React, { useState, useEffect, useRef } from 'react';
import { Workout, Exercise, UserProfile } from '../models.ts';
import { Play, Check, SkipForward, Timer, Dumbbell, Zap, Eye, RotateCcw, X, AlertCircle, Sparkles } from 'lucide-react';
import { WgerExerciseInfo } from './WgerExerciseInfo.tsx';

interface AssistedTimedTrackerProps {
  workout: Workout & { exercises: Exercise[] };
  userProfile: UserProfile | null;
  inputs: Record<string, { weight: string; reps: string; durationSeconds?: string; difficulty?: string }>;
  onUpdateInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', step: number) => void;
  onSetTextInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', value: string) => void;
  onFinishAllSets: () => void;
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

  // Track active position in routine
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setNumber, setSetNumber] = useState(1); // 1-based
  const [phase, setPhase] = useState<'ready' | 'in_progress' | 'resting' | 'completed_all'>('ready');
  const [setStartTime, setSetStartTime] = useState<number | null>(null);
  const [restTimeLeft, setRestTimeLeft] = useState<number>(restDurationSeconds);
  const [recordedDurations, setRecordedDurations] = useState<Record<string, number>>({});
  const [showWgerInfo, setShowWgerInfo] = useState(false);

  const timerRef = useRef<any>(null);

  const currentExercise = exercises[exerciseIndex];
  const totalExercises = exercises.length;
  const currentSetKey = currentExercise ? `${currentExercise.id}-${setNumber}` : '';
  const currentValues = currentSetKey ? (inputs[currentSetKey] || { weight: '20', reps: '10', durationSeconds: '30', difficulty: '7' }) : null;

  // Handle rest countdown
  useEffect(() => {
    if (phase === 'resting') {
      setRestTimeLeft(restDurationSeconds);
      timerRef.current = setInterval(() => {
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            advanceToNextStep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, exerciseIndex, setNumber, restDurationSeconds]);

  // Start current set (silent background timing)
  const handleStartSet = () => {
    setSetStartTime(Date.now());
    setPhase('in_progress');
  };

  // Complete active set
  const handleFinishSet = () => {
    const finishTime = Date.now();
    const duration = setStartTime ? Math.max(1, Math.round((finishTime - setStartTime) / 1000)) : 0;

    if (currentSetKey) {
      setRecordedDurations((prev) => ({ ...prev, [currentSetKey]: duration }));
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
      onFinishAllSets();
    } else {
      // Enter rest countdown phase
      setPhase('resting');
    }
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
      onFinishAllSets();
    } else {
      advanceToNextStep();
    }
  };

  // Advance helper
  const advanceToNextStep = () => {
    if (!currentExercise) return;

    if (setNumber < currentExercise.targetSets) {
      // Next set of same exercise
      setSetNumber((prev) => prev + 1);
      setPhase('ready');
    } else {
      // Next exercise
      if (exerciseIndex < totalExercises - 1) {
        setExerciseIndex((prev) => prev + 1);
        setSetNumber(1);
        setPhase('ready');
      } else {
        setPhase('completed_all');
        onFinishAllSets();
      }
    }
  };

  // Skip rest timer immediately
  const handleSkipRest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    advanceToNextStep();
  };

  // Reset entire assisted progression
  const handleRestart = () => {
    setExerciseIndex(0);
    setSetNumber(1);
    setPhase('ready');
    setSetStartTime(null);
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
  // Circumference for r=70: 2 * PI * 70 = 439.82
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
                className="transition-all duration-1000 ease-linear"
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
