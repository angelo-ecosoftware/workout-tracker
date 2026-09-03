import React from 'react';
import { Exercise } from '../../models.ts';
import { Play, Check, Eye } from 'lucide-react';
import { WgerExerciseInfo } from '../WgerExerciseInfo.tsx';

interface AssistedSetCardProps {
  exerciseIndex: number;
  currentExercise: Exercise;
  setNumber: number;
  phase: 'ready' | 'in_progress' | 'resting' | 'completed_all';
  currentSetKey: string;
  currentValues: { weight: string; reps: string; durationSeconds?: string; difficulty?: string };
  showWgerInfo: boolean;
  setShowWgerInfo: (val: boolean) => void;
  onUpdateInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', step: number) => void;
  onSetTextInput: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', value: string) => void;
  onSkipSet: () => void;
  onStartSet: () => void;
  onFinishSet: () => void;
}

export const AssistedSetCard: React.FC<AssistedSetCardProps> = ({
  exerciseIndex,
  currentExercise,
  setNumber,
  phase,
  currentSetKey,
  currentValues,
  showWgerInfo,
  setShowWgerInfo,
  onUpdateInput,
  onSetTextInput,
  onSkipSet,
  onStartSet,
  onFinishSet,
}) => {
  return (
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
          onClick={onSkipSet}
          className="px-3.5 sm:px-5 py-3.5 bg-[#181818] hover:bg-[#202020] border border-[#333] rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          Skip (0)
        </button>

        {phase === 'ready' ? (
          <button
            type="button"
            onClick={onStartSet}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black italic uppercase tracking-wider text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all shadow-[0_0_20px_rgba(192,255,0,0.25)] cursor-pointer active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-black" /> Start Set
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinishSet}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black font-display font-black italic uppercase tracking-wider text-xs sm:text-sm rounded-xl sm:rounded-2xl transition-all shadow-[0_0_20px_rgba(52,211,153,0.35)] cursor-pointer active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> Finish Set & Rest
          </button>
        )}
      </div>

    </div>
  );
};
