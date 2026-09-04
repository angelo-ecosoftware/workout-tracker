import React from 'react';
import { Exercise } from '../../../models.ts';

interface ExerciseSetRowProps {
  exercise: Exercise;
  setNum: number;
  inputKey: string;
  values: {
    weight?: string;
    reps?: string;
    durationSeconds?: string;
    difficulty?: string;
  };
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
}

export const ExerciseSetRow: React.FC<ExerciseSetRowProps> = ({
  exercise,
  setNum,
  inputKey,
  values,
  onUpdateInput,
  onTextInput,
}) => {
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-stretch sm:items-center bg-[#1a1a1a] border border-[#222] p-4 sm:p-2 rounded-xl hover:border-[#333] transition-colors">
      {/* Label set number */}
      <div className="col-span-3 flex items-center justify-between sm:justify-start gap-1 font-mono text-xs font-bold text-gray-300 border-b border-[#2d2d2d] sm:border-0 pb-1.5 sm:pb-0 mb-1.5 sm:mb-0">
        <span className="uppercase tracking-wider text-[#C0FF00]">SET {setNum}</span>
        <span className="sm:hidden font-sans font-semibold text-[10px] text-gray-500">
          TARGET: {exercise.targetRepMin}-{exercise.targetRepMax}{' '}
          {exercise.type === 'timed' ? 's' : 'reps'}
        </span>
      </div>

      {exercise.type === 'timed' ? (
        <>
          {/* Duration seconds quick adjust */}
          <div className="col-span-5 flex items-center justify-center gap-1">
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

            <input
              type="text"
              value={values.durationSeconds || ''}
              onChange={(e) => onTextInput(inputKey, 'durationSeconds', e.target.value)}
              className="w-18 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
              placeholder="Secs"
            />

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

          {/* Difficulty Rating */}
          <div className="col-span-4 flex items-center justify-center gap-1.5 mt-2 sm:mt-0">
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
              className="w-14 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
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
        </>
      ) : (
        <>
          {/* Weight inputs Quick Adjust */}
          <div className="col-span-5 flex items-center justify-center gap-1">
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

            <input
              type="text"
              value={values.weight || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'weight', e.target.value)}
              className="w-18 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
            />

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

          {/* Reps selector */}
          <div className="col-span-4 flex items-center justify-center gap-1.5 mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'reps', -1)}
              className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
            >
              -1
            </button>
            <input
              type="text"
              value={values.reps || ''}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onTextInput(inputKey, 'reps', e.target.value)}
              className="w-14 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
            />
            <button
              type="button"
              onClick={() => onUpdateInput(inputKey, 'reps', 1)}
              className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
            >
              +1
            </button>
          </div>
        </>
      )}
    </div>
  );
};
