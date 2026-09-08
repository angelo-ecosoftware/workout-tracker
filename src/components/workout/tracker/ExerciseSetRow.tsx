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
      className={`grid grid-cols-12 gap-1 sm:gap-2 items-center px-1.5 sm:px-2.5 py-1.5 sm:py-2 rounded-xl border transition-all ${
        isCompleted
          ? 'bg-[#121212] border-emerald-500/20 opacity-70'
          : isCurrent
          ? 'bg-[#181818] border-[#C0FF00]/40 shadow-[0_0_12px_rgba(192,255,0,0.06)]'
          : 'bg-[#141414] border-[#202020] hover:border-[#2a2a2a]'
      }`}
    >
      {/* Col 1-2: Set Number & 1-Tap Check */}
      <div className="col-span-2 flex items-center gap-1.5 min-w-0">
        <button
          type="button"
          role="checkbox"
          aria-checked={isCompleted}
          onClick={() => onToggleCompleted && onToggleCompleted(inputKey)}
          aria-label={isCompleted ? `Mark set ${setNum} incomplete` : `Mark set ${setNum} complete`}
          title={isCompleted ? `Done at ${values.completedAt || ''}` : 'Mark complete'}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
            isCompleted
              ? 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-sm opacity-100'
              : isCurrent
              ? 'bg-[#181818] border-[#C0FF00]/60 text-zinc-400 opacity-60 hover:opacity-100 hover:text-[#C0FF00]'
              : 'bg-[#121212] border-[#222222] hover:border-gray-600 text-zinc-600 opacity-25 hover:opacity-70'
          }`}
        >
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
        </button>

        <span
          className={`font-mono text-[10px] sm:text-xs font-bold uppercase whitespace-nowrap ${
            isCompleted ? 'text-gray-500 line-through' : isCurrent ? 'text-[#C0FF00]' : 'text-gray-400'
          }`}
        >
          <span className="hidden sm:inline">SET {setNum}</span>
          <span className="sm:hidden">{setNum}</span>
        </span>
      </div>

      {exercise.type === 'timed' ? (
        <>
          {/* Col 3-7: Duration Stepper (Flex container with integrated +/- buttons) */}
          <div className="col-span-5 flex items-stretch h-9 sm:h-10 bg-[#0d0d0d] border border-[#282828] focus-within:border-[#C0FF00] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'durationSeconds', -5)}
              aria-label={`Decrease duration for set ${setNum} by 5 seconds`}
              className="w-8 sm:w-9 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#333] text-gray-300 flex items-center justify-center font-mono font-bold cursor-pointer shrink-0 transition-colors"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <input
              type="text"
              inputMode="numeric"
              value={values.durationSeconds || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'durationSeconds', e.target.value)}
              aria-label={`Duration in seconds for set ${setNum}`}
              className="w-full min-w-0 bg-transparent py-1 px-0.5 text-center font-mono font-bold text-white text-xs sm:text-sm focus:outline-none"
              placeholder="0"
            />

            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'durationSeconds', 5)}
              aria-label={`Increase duration for set ${setNum} by 5 seconds`}
              className="w-8 sm:w-9 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#333] text-gray-300 flex items-center justify-center font-mono font-bold cursor-pointer shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Col 8-12: Difficulty Stepper */}
          <div className="col-span-5 flex items-stretch h-9 sm:h-10 bg-[#0d0d0d] border border-[#282828] focus-within:border-amber-400 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'difficulty', -1)}
              aria-label={`Decrease difficulty for set ${setNum}`}
              className="w-8 sm:w-9 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#333] text-gray-300 flex items-center justify-center font-mono font-bold cursor-pointer shrink-0 transition-colors"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <input
              type="text"
              inputMode="numeric"
              value={values.difficulty || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'difficulty', e.target.value)}
              aria-label={`Difficulty out of 10 for set ${setNum}`}
              className="w-full min-w-0 bg-transparent py-1 px-0.5 text-center font-mono font-bold text-amber-400 text-xs sm:text-sm focus:outline-none"
              placeholder="7"
            />

            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'difficulty', 1)}
              aria-label={`Increase difficulty for set ${setNum}`}
              className="w-8 sm:w-9 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#333] text-gray-300 flex items-center justify-center font-mono font-bold cursor-pointer shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Col 3-7: Weight Stepper (Integrated segment with +/- and center input) */}
          <div className="col-span-5 flex items-stretch h-9 sm:h-10 bg-[#0d0d0d] border border-[#282828] focus-within:border-[#C0FF00] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'weight', -2.5)}
              aria-label={`Decrease weight for set ${setNum} by 2.5 kilograms`}
              className="w-8 sm:w-9 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#333] text-gray-300 hover:text-white flex items-center justify-center font-mono font-bold cursor-pointer shrink-0 transition-colors"
              title="-2.5 kg"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <input
              type="text"
              inputMode="decimal"
              value={values.weight || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'weight', e.target.value)}
              aria-label={`Weight in kilograms for set ${setNum}`}
              className="w-full min-w-0 bg-transparent py-1 px-0.5 text-center font-mono font-black text-white text-xs sm:text-sm focus:outline-none"
              placeholder="0"
            />

            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'weight', 2.5)}
              aria-label={`Increase weight for set ${setNum} by 2.5 kilograms`}
              className="w-8 sm:w-9 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#333] text-gray-300 hover:text-[#C0FF00] flex items-center justify-center font-mono font-bold cursor-pointer shrink-0 transition-colors"
              title="+2.5 kg"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Col 8-12: Reps Stepper */}
          <div className="col-span-5 flex items-stretch h-9 sm:h-10 bg-[#0d0d0d] border border-[#282828] focus-within:border-[#C0FF00] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'reps', -1)}
              aria-label={`Decrease reps for set ${setNum}`}
              className="w-8 sm:w-9 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#333] text-gray-300 hover:text-white flex items-center justify-center font-mono font-bold cursor-pointer shrink-0 transition-colors"
              title="-1 rep"
            >
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <input
              type="text"
              inputMode="numeric"
              value={values.reps || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'reps', e.target.value)}
              aria-label={`Reps for set ${setNum}`}
              className="w-full min-w-0 bg-transparent py-1 px-0.5 text-center font-mono font-black text-[#C0FF00] text-xs sm:text-sm focus:outline-none"
              placeholder="0"
            />

            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'reps', 1)}
              aria-label={`Increase reps for set ${setNum}`}
              className="w-8 sm:w-9 bg-[#1a1a1a] hover:bg-[#252525] active:bg-[#333] text-gray-300 hover:text-[#C0FF00] flex items-center justify-center font-mono font-bold cursor-pointer shrink-0 transition-colors"
              title="+1 rep"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};
