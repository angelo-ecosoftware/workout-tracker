import React from 'react';
import { Exercise } from '../../../models.ts';
import { Dumbbell, Hash, Clock, Flame } from 'lucide-react';

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
    <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 items-stretch sm:items-center bg-[#1a1a1a] border border-[#222] p-4 sm:p-2.5 rounded-xl hover:border-[#333] transition-colors">
      {/* Label set number with icon & pill */}
      <div className="col-span-3 flex items-center justify-between sm:justify-start gap-2 font-mono text-xs font-bold text-gray-300 border-b border-[#2d2d2d] sm:border-0 pb-2 sm:pb-0 mb-1 sm:mb-0">
        <span className="inline-flex items-center gap-1.5 uppercase tracking-wider text-[#C0FF00] bg-[#C0FF00]/10 px-2 py-0.5 rounded-lg border border-[#C0FF00]/20">
          <Hash className="w-3.5 h-3.5 text-[#C0FF00]" />
          <span>SET {setNum}</span>
        </span>
        <span className="sm:hidden font-sans font-semibold text-[10px] text-gray-400">
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
