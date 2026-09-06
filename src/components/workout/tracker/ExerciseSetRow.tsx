import React from 'react';
import { Exercise } from '../../../models.ts';
import { Dumbbell, Hash, Clock, Flame, Check } from 'lucide-react';

interface ExerciseSetRowProps {
  exercise: Exercise;
  setNum: number;
  inputKey: string;
  values: {
    weight?: string;
    reps?: string;
    durationSeconds?: string;
    difficulty?: string;
    completed?: boolean;
    completedAt?: string;
  };
  isCurrent?: boolean;
  onUpdateInput: (
    key: string,
    field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
    delta: number
  ) => void;
  onTextInput: (
    key: string,
    field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty',
    value: string
  ) => void;
  onToggleCompleted?: (key: string) => void;
}

export const ExerciseSetRow: React.FC<ExerciseSetRowProps> = ({
  exercise,
  setNum,
  inputKey,
  values,
  isCurrent = false,
  onUpdateInput,
  onTextInput,
  onToggleCompleted,
}) => {
  const isCompleted = Boolean(values.completed);

  return (
    <div
      className={`flex flex-col sm:grid sm:grid-cols-12 gap-3 items-stretch sm:items-center p-3 sm:p-2.5 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-[#141414]/90 border-emerald-500/30 opacity-80'
          : isCurrent
          ? 'bg-[#1e1e1e] border-[#C0FF00]/50 shadow-[0_0_15px_rgba(192,255,0,0.08)]'
          : 'bg-[#1a1a1a] border-[#222] hover:border-[#333]'
      }`}
    >
      {/* Label set number + 1-tap checkmark button */}
      <div className="col-span-3 flex items-center justify-between sm:justify-start gap-2 font-mono text-xs font-bold text-gray-300 border-b border-[#2d2d2d] sm:border-0 pb-2 sm:pb-0 mb-1 sm:mb-0">
        <div className="flex items-center gap-2">
          {/* 1-Tap Completion Toggle Circle */}
          <button
            type="button"
            onClick={() => onToggleCompleted && onToggleCompleted(inputKey)}
            title={isCompleted ? `Completed at ${values.completedAt || 'earlier'} - click to uncheck` : 'Click to mark set completed'}
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
              isCompleted
                ? 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.3)]'
                : 'bg-[#222] border-[#383838] hover:border-[#C0FF00]/60 text-transparent hover:text-gray-400'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <span
            className={`uppercase tracking-wider transition-colors ${
              isCompleted ? 'text-gray-400 line-through' : isCurrent ? 'text-[#C0FF00]' : 'text-gray-200'
            }`}
          >
            SET {setNum}
          </span>
        </div>

        {/* Micro-status badge (Done timestamp or active current indicator) */}
        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {isCompleted && values.completedAt && (
            <span className="text-[9px] font-mono text-emerald-400 font-normal bg-emerald-950/40 border border-emerald-500/20 px-1.5 py-0.2 rounded">
              {values.completedAt}
            </span>
          )}
          {!isCompleted && isCurrent && (
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#C0FF00] bg-[#C0FF00]/10 px-1.5 py-0.2 rounded border border-[#C0FF00]/30 animate-pulse">
              NEXT
            </span>
          )}
        </div>

        <span className="sm:hidden font-sans font-semibold text-[10px] text-gray-500 ml-auto">
          Target: {exercise.targetRepMin}-{exercise.targetRepMax}{' '}
          {exercise.type === 'timed' ? 'sec' : 'reps'}
        </span>
      </div>

      {exercise.type === 'timed' ? (
        <>
          {/* Duration seconds quick adjust with icon & label */}
          <div className="col-span-5 flex flex-col sm:flex-row items-center justify-center gap-1.5">
            <div className="sm:hidden flex items-center gap-1 text-[10px] font-mono text-gray-400 self-start mb-0.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>DURATION (SECONDS)</span>
            </div>
            <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'durationSeconds', -10)}
                className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
              >
                -10s
              </button>
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'durationSeconds', -5)}
                className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
              >
                -5s
              </button>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={values.durationSeconds || ''}
                  onChange={(e) => onTextInput(inputKey, 'durationSeconds', e.target.value)}
                  className="w-20 px-2 py-1.5 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00] pr-6"
                  placeholder="0"
                />
                <span className="absolute right-2 text-[10px] font-mono text-gray-500 pointer-events-none">s</span>
              </div>

              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'durationSeconds', 5)}
                className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
              >
                +5s
              </button>
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'durationSeconds', 10)}
                className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
              >
                +10s
              </button>
            </div>
          </div>

          {/* Difficulty Rating with Flame icon */}
          <div className="col-span-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 mt-2 sm:mt-0">
            <div className="sm:hidden flex items-center gap-1 text-[10px] font-mono text-gray-400 self-start mb-0.5">
              <Flame className="w-3 h-3 text-orange-400" />
              <span>DIFFICULTY (1-10)</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'difficulty', -1)}
                className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
              >
                -1
              </button>
              <input
                type="text"
                value={values.difficulty || ''}
                onChange={(e) => onTextInput(inputKey, 'difficulty', e.target.value)}
                className="w-14 px-1 py-1.5 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                placeholder="1-10"
              />
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'difficulty', 1)}
                className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
              >
                +1
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Weight input with Dumbbell icon and KG badge */}
          <div className="col-span-5 flex flex-col sm:flex-row items-center justify-center gap-1.5">
            <div className="sm:hidden flex items-center gap-1 text-[10px] font-mono text-gray-400 self-start mb-0.5">
              <Dumbbell className="w-3 h-3 text-[#C0FF00]" />
              <span>WEIGHT (KG)</span>
            </div>
            <div className="flex items-center justify-center gap-1 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'weight', -2.5)}
                className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
              >
                -2.5
              </button>
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'weight', -0.5)}
                className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
              >
                -0.5
              </button>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={values.weight || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onTextInput(inputKey, 'weight', e.target.value)}
                  className="w-20 px-2 py-1.5 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00] pr-7"
                  placeholder="0"
                />
                <span className="absolute right-2 text-[10px] font-mono font-bold text-gray-500 pointer-events-none">
                  kg
                </span>
              </div>

              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'weight', 0.5)}
                className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
              >
                +0.5
              </button>
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'weight', 2.5)}
                className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
              >
                +2.5
              </button>
            </div>
          </div>

          {/* Reps selector with Hash/Rep icon */}
          <div className="col-span-4 flex flex-col sm:flex-row items-center justify-center gap-1.5 mt-2 sm:mt-0">
            <div className="sm:hidden flex items-center gap-1 text-[10px] font-mono text-gray-400 self-start mb-0.5">
              <Hash className="w-3 h-3 text-cyan-400" />
              <span>REPS (COUNT)</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'reps', -1)}
                className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
              >
                -1
              </button>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={values.reps || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => onTextInput(inputKey, 'reps', e.target.value)}
                  className="w-16 px-2 py-1.5 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00] pr-6"
                  placeholder="0"
                />
                <span className="absolute right-1.5 text-[9px] font-mono font-bold text-gray-500 pointer-events-none">
                  reps
                </span>
              </div>
              <button
                type="button"
                onClick={() => onUpdateInput(inputKey, 'reps', 1)}
                className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
              >
                +1
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
