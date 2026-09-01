import React, { useState, useEffect, useRef } from 'react';
import { Workout, Exercise, UserProfile } from '../models.ts';
import { Play, Check, SkipForward, Timer, Dumbbell, Zap, Eye, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { WgerExerciseInfo } from './WgerExerciseInfo.tsx';

interface AssistedTimedTrackerProps {
  workout: Workout & { exercises: Exercise[] };
  userProfile: UserProfile | null;
  inputs: Record<string, { weight: string; reps: string; durationSeconds?: string; difficulty?: string }>;
  onUpdateInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', step: number) => void;
  onSetTextInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', value: string) => void;
  onFinishAllSets: () => void;
  restDurationSeconds?: number;
}

export const AssistedTimedTracker: React.FC<AssistedTimedTrackerProps> = ({
  workout,
  userProfile,
  inputs,
  onUpdateInput,
  onSetTextInput,
  onFinishAllSets,
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

  return (
    <div className="space-y-4">
      {/* Progress Bar & Header */}
      <div className="bg-[#141414] border border-[#262626] rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/30 flex items-center justify-center text-[#C0FF00]">
            <Timer className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xs uppercase tracking-wider text-white">
                Assisted Set Tracker
              </span>
              <span className="text-[9px] font-mono bg-[#222] text-[#C0FF00] px-2 py-0.5 rounded-full font-bold">
                Ex {exerciseIndex + 1}/{totalExercises} • Set {setNumber}/{currentExercise?.targetSets || 1}
              </span>
            </div>
            <p className="text-[10px] font-mono text-gray-400">
              Silent background timing • 1 set focus
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          title="Restart guided workout"
          className="p-2 hover:bg-[#222] rounded-xl text-gray-500 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* REST COUNTDOWN OVERLAY */}
      {phase === 'resting' && (
        <div className="bg-[#111111] border-2 border-[#C0FF00]/40 rounded-[24px] p-6 sm:p-8 text-center space-y-5 shadow-[0_0_30px_rgba(192,255,0,0.15)] animate-in zoom-in-95 duration-200">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#C0FF00]">
              REST & RECOVER
            </span>
            <div className="text-5xl sm:text-6xl font-display font-black italic text-white font-mono tracking-tighter">
              00:{restTimeLeft < 10 ? `0${restTimeLeft}` : restTimeLeft}
            </div>
          </div>

          {/* Next Up Banner */}
          {nextUp && (
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3.5 max-w-sm mx-auto text-left flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase text-gray-500 block">Next Up</span>
                <span className="font-display font-bold text-xs text-white uppercase truncate block">
                  {nextUp.title}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#C0FF00] bg-[#111] px-2 py-1 rounded-lg border border-[#222]">
                Set {nextUp.set}/{nextUp.totalSets}
              </span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSkipRest}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1f1f1f] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#C0FF00]/50 rounded-xl text-xs font-mono font-bold text-white uppercase tracking-wider transition-all cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 text-[#C0FF00]" /> Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE FOCUSED SET CARD */}
      {(phase === 'ready' || phase === 'in_progress') && currentExercise && currentValues && (
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-[24px] p-5 sm:p-6 space-y-5 shadow-2xl relative overflow-hidden">
          
          {/* Top exercise title & target */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#C0FF00] text-black font-display font-black text-xs flex items-center justify-center shrink-0">
                  {exerciseIndex + 1}
                </span>
                <h3 className="font-display font-black italic text-lg text-white uppercase tracking-tight">
                  {currentExercise.name}
                </h3>
              </div>
              <div className="text-[10px] font-mono text-gray-400 mt-1 flex items-center gap-2">
                <span>Target: <strong className="text-[#C0FF00]">{currentExercise.targetRepMin}-{currentExercise.targetRepMax} {currentExercise.type === 'timed' ? 'seconds' : 'reps'}</strong></span>
                <span>•</span>
                <span className="uppercase text-gray-500">{currentExercise.type}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setShowWgerInfo(!showWgerInfo)}
                className="px-2.5 py-1 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-lg text-[10px] font-mono text-gray-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3 h-3 text-[#C0FF00]" />
                {showWgerInfo ? 'Hide Guide' : 'Exercise Guide'}
              </button>
            </div>
          </div>

          {/* Guide Dropdown */}
          {showWgerInfo && (
            <div className="p-3 bg-[#161616] border border-[#262626] rounded-xl">
              <WgerExerciseInfo exerciseName={currentExercise.name} />
            </div>
          )}

          {/* Last log benchmark */}
          {cachedEx && (
            <div className="bg-[#161616] border border-[#222] rounded-xl p-3 flex items-center justify-between text-[11px] font-mono">
              <span className="text-gray-500 uppercase tracking-wider text-[9px] font-bold">Previous Benchmark</span>
              <span className="text-gray-200 font-bold">
                {currentExercise.type === 'timed'
                  ? `${cachedEx.lastDurationSeconds}s`
                  : `${cachedEx.lastWeight}kg × ${cachedEx.lastReps} reps`}
              </span>
            </div>
          )}

          {/* Active Set Box */}
          <div className="bg-[#181818] border border-[#333] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <span className="font-display font-black italic text-sm text-[#C0FF00] uppercase tracking-wider">
                SET {setNumber} of {currentExercise.targetSets}
              </span>
              {phase === 'in_progress' && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Set In Progress...
                </span>
              )}
            </div>

            {/* Inputs based on strength vs timed */}
            {currentExercise.type === 'timed' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Duration (Seconds)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'durationSeconds', -5)}
                      className="px-2.5 py-2 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-lg text-white font-mono text-xs cursor-pointer"
                    >
                      -5s
                    </button>
                    <input
                      type="text"
                      value={currentValues.durationSeconds || ''}
                      onChange={(e) => onSetTextInput(currentSetKey, 'durationSeconds', e.target.value)}
                      className="flex-1 bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg py-2 text-center font-mono font-black text-white text-sm focus:outline-none"
                      placeholder="Sec"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'durationSeconds', 5)}
                      className="px-2.5 py-2 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-lg text-white font-mono text-xs cursor-pointer"
                    >
                      +5s
                    </button>
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Difficulty (1-10)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'difficulty', -1)}
                      className="px-2.5 py-2 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-lg text-white font-mono text-xs cursor-pointer"
                    >
                      -1
                    </button>
                    <input
                      type="text"
                      value={currentValues.difficulty || ''}
                      onChange={(e) => onSetTextInput(currentSetKey, 'difficulty', e.target.value)}
                      className="flex-1 bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg py-2 text-center font-mono font-black text-[#C0FF00] text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'difficulty', 1)}
                      className="px-2.5 py-2 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-lg text-white font-mono text-xs cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Weight */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Weight (kg)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'weight', -2.5)}
                      className="px-2.5 py-2 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-lg text-white font-mono text-xs cursor-pointer"
                    >
                      -2.5
                    </button>
                    <input
                      type="text"
                      value={currentValues.weight || ''}
                      onChange={(e) => onSetTextInput(currentSetKey, 'weight', e.target.value)}
                      className="flex-1 bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg py-2 text-center font-mono font-black text-white text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'weight', 2.5)}
                      className="px-2.5 py-2 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-lg text-white font-mono text-xs cursor-pointer"
                    >
                      +2.5
                    </button>
                  </div>
                </div>

                {/* Reps */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                    Reps
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'reps', -1)}
                      className="px-2.5 py-2 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-lg text-white font-mono text-xs cursor-pointer"
                    >
                      -1
                    </button>
                    <input
                      type="text"
                      value={currentValues.reps || ''}
                      onChange={(e) => onSetTextInput(currentSetKey, 'reps', e.target.value)}
                      className="flex-1 bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-lg py-2 text-center font-mono font-black text-[#C0FF00] text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateInput(currentSetKey, 'reps', 1)}
                      className="px-2.5 py-2 bg-[#222] border border-[#333] hover:border-[#C0FF00]/40 rounded-lg text-white font-mono text-xs cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleSkipSet}
              className="px-4 py-3 bg-[#181818] hover:bg-[#202020] border border-[#333] rounded-xl text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              Skip Set (0)
            </button>

            {phase === 'ready' ? (
              <button
                type="button"
                onClick={handleStartSet}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black italic uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-black" /> Start Set
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSet}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-display font-black italic uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.3)] cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Finish Set & Rest
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
