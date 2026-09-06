import React from 'react';
import { Exercise } from '../../../models.ts';
import { Check, Minus, Plus } from 'lucide-react';

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
      className={`grid grid-cols-12 gap-1.5 sm:gap-2 items-center px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-[#121212] border-emerald-500/20 opacity-70'
          : isCurrent
          ? 'bg-[#181818] border-[#C0FF00]/40 shadow-[0_0_12px_rgba(192,255,0,0.06)]'
          : 'bg-[#141414] border-[#202020] hover:border-[#2a2a2a]'
      }`}
    >
      {/* Col 1-3: Set Number & 1-Tap Check */}
      <div className="col-span-3 flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          onClick={() => onToggleCompleted && onToggleCompleted(inputKey)}
          title={isCompleted ? `Done at ${values.completedAt || ''}` : 'Mark complete'}
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
            isCompleted
              ? 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-sm'
              : isCurrent
              ? 'bg-[#1a1a1a] border-[#C0FF00]/50 text-transparent hover:text-gray-400'
              : 'bg-[#1a1a1a] border-[#2d2d2d] hover:border-gray-500 text-transparent hover:text-gray-400'
          }`}
        >
          <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <span
            className={`font-mono text-[11px] sm:text-xs font-bold uppercase whitespace-nowrap ${
              isCompleted ? 'text-gray-500 line-through' : isCurrent ? 'text-[#C0FF00]' : 'text-gray-300'
            }`}
          >
            SET {setNum}
          </span>

          {isCompleted && values.completedAt && (
            <span className="text-[8px] font-mono text-emerald-400 hidden sm:inline">
              {values.completedAt}
            </span>
          )}

          {!isCompleted && isCurrent && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#C0FF00] animate-pulse shrink-0 hidden sm:inline" />
          )}
        </div>
      </div>

      {exercise.type === 'timed' ? (
        <>
          {/* Col 4-8: Duration Stepper */}
          <div className="col-span-5 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'durationSeconds', -5)}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-gray-300 flex items-center justify-center text-xs font-mono font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
            >
              <Minus className="w-3 h-3" />
            </button>

            <input
              type="text"
              value={values.durationSeconds || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'durationSeconds', e.target.value)}
              className="w-full min-w-0 bg-[#0d0d0d] border border-[#282828] focus:border-[#C0FF00] rounded-lg py-1 px-0.5 text-center font-mono font-bold text-white text-xs sm:text-sm focus:outline-none"
              placeholder="0"
            />

            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'durationSeconds', 5)}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-gray-300 flex items-center justify-center text-xs font-mono font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Col 9-12: Difficulty Stepper */}
          <div className="col-span-4 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'difficulty', -1)}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-gray-300 flex items-center justify-center text-xs font-mono font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
            >
              <Minus className="w-3 h-3" />
            </button>

            <input
              type="text"
              value={values.difficulty || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'difficulty', e.target.value)}
              className="w-full min-w-0 bg-[#0d0d0d] border border-[#282828] focus:border-amber-400 rounded-lg py-1 px-0.5 text-center font-mono font-bold text-amber-400 text-xs sm:text-sm focus:outline-none"
              placeholder="7"
            />

            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'difficulty', 1)}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-gray-300 flex items-center justify-center text-xs font-mono font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Col 4-8: Weight Stepper */}
          <div className="col-span-5 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'weight', -2.5)}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-gray-300 hover:text-white flex items-center justify-center text-xs font-mono font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
              title="-2.5 kg"
            >
              <Minus className="w-3 h-3" />
            </button>

            <input
              type="text"
              value={values.weight || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'weight', e.target.value)}
              className="w-full min-w-0 bg-[#0d0d0d] border border-[#282828] focus:border-[#C0FF00] rounded-lg py-1 px-0.5 text-center font-mono font-black text-white text-xs sm:text-sm focus:outline-none"
              placeholder="0"
            />

            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'weight', 2.5)}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-gray-300 hover:text-[#C0FF00] flex items-center justify-center text-xs font-mono font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
              title="+2.5 kg"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Col 9-12: Reps Stepper */}
          <div className="col-span-4 flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'reps', -1)}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-gray-300 hover:text-white flex items-center justify-center text-xs font-mono font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
              title="-1 rep"
            >
              <Minus className="w-3 h-3" />
            </button>

            <input
              type="text"
              value={values.reps || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'reps', e.target.value)}
              className="w-full min-w-0 bg-[#0d0d0d] border border-[#282828] focus:border-[#C0FF00] rounded-lg py-1 px-0.5 text-center font-mono font-black text-[#C0FF00] text-xs sm:text-sm focus:outline-none"
              placeholder="0"
            />

            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'reps', 1)}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] rounded-lg text-gray-300 hover:text-[#C0FF00] flex items-center justify-center text-xs font-mono font-bold cursor-pointer shrink-0 active:scale-95 transition-transform"
              title="+1 rep"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
