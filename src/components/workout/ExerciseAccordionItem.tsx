import React from 'react';
import { Exercise } from '../../models.ts';
import { Eye, EyeOff, Zap } from 'lucide-react';
import { WgerExerciseInfo } from '../WgerExerciseInfo.tsx';

interface ExerciseAccordionItemProps {
  exercise: Exercise;
  exerciseIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  advice: { action: string; details: string };
  inputs: Record<string, { weight: string; reps: string; durationSeconds?: string; difficulty?: string }>;
  onUpdateInputValue: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', delta: number) => void;
  onTextChange: (key: string, field: 'weight' | 'reps' | 'durationSeconds' | 'difficulty', value: string) => void;
}

export const ExerciseAccordionItem: React.FC<ExerciseAccordionItemProps> = ({
  exercise: ex,
  exerciseIndex: exIndex,
  isExpanded,
  onToggleExpand,
  advice,
  inputs,
  onUpdateInputValue,
  onTextChange,
}) => {
  return (
    <div className="bg-[#141414] border border-[#242424] rounded-2xl overflow-hidden transition-all duration-200">
      {/* Header */}
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#1a1a1a] select-none"
      >
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-lg bg-[#222] border border-[#333] text-[10px] font-mono font-black text-gray-300 flex items-center justify-center">
            {exIndex + 1}
          </span>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">
              {ex.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-gray-400">
                {ex.targetSets} Sets ×{' '}
                {ex.type === 'timed'
                  ? `${ex.targetRepMin}-${ex.targetRepMax}s`
                  : `${ex.targetRepMin}-${ex.targetRepMax} Reps`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isExpanded ? (
            <EyeOff className="w-4 h-4 text-gray-500" />
          ) : (
            <Eye className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-[#1f1f1f] space-y-4">
          <WgerExerciseInfo exerciseName={ex.name} />

          {/* Progression Banner */}
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 ${
              advice.action === 'increase'
                ? 'bg-[#C0FF00]/10 border-[#C0FF00]/30 text-[#C0FF00]'
                : 'bg-[#1c1c1c] border-[#2c2c2c] text-gray-300'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0 text-[#C0FF00]" />
            <span>{advice.details}</span>
          </div>

          {/* Sets Inputs */}
          <div className="space-y-2.5">
            {Array.from({ length: ex.targetSets }).map((_, setIdx) => {
              const setNumber = setIdx + 1;
              const inputKey = `${ex.id}-${setNumber}`;
              const values = inputs[inputKey] || {
                weight: '20',
                reps: '10',
                durationSeconds: '30',
                difficulty: '7',
              };

              return (
                <div
                  key={setNumber}
                  className="grid grid-cols-12 items-center gap-2 bg-[#181818] p-2.5 rounded-xl border border-[#262626]"
                >
                  <span className="col-span-3 text-[11px] font-mono font-bold text-gray-400 uppercase">
                    Set {setNumber}
                  </span>

                  {ex.type === 'timed' ? (
                    <>
                      {/* Duration */}
                      <div className="col-span-5 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'durationSeconds', -5)}
                          className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs font-mono cursor-pointer select-none"
                        >
                          -5s
                        </button>
                        <input
                          type="text"
                          value={values.durationSeconds || ''}
                          onChange={(e) => onTextChange(inputKey, 'durationSeconds', e.target.value)}
                          className="w-16 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'durationSeconds', 5)}
                          className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs font-mono cursor-pointer select-none"
                        >
                          +5s
                        </button>
                      </div>

                      {/* Difficulty */}
                      <div className="col-span-4 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'difficulty', -1)}
                          className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                        >
                          -1
                        </button>
                        <input
                          type="text"
                          value={values.difficulty || ''}
                          onChange={(e) => onTextChange(inputKey, 'difficulty', e.target.value)}
                          className="w-12 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'difficulty', 1)}
                          className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                        >
                          +1
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Weight */}
                      <div className="col-span-5 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'weight', -2.5)}
                          className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                        >
                          -2.5
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'weight', -0.5)}
                          className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                        >
                          -0.5
                        </button>

                        <input
                          type="text"
                          value={values.weight || ''}
                          onChange={(e) => onTextChange(inputKey, 'weight', e.target.value)}
                          className="w-18 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                        />

                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'weight', 0.5)}
                          className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                        >
                          +0.5
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'weight', 2.5)}
                          className="p-1 px-1.5 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-[10px] font-mono cursor-pointer select-none"
                        >
                          +2.5
                        </button>
                      </div>

                      {/* Reps */}
                      <div className="col-span-4 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'reps', -1)}
                          className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                        >
                          -1
                        </button>
                        <input
                          type="text"
                          value={values.reps || ''}
                          onChange={(e) => onTextChange(inputKey, 'reps', e.target.value)}
                          className="w-14 px-1 py-1 bg-[#111] border border-[#333] rounded-lg text-center text-xs font-mono font-black text-[#C0FF00] focus:outline-none focus:ring-1 focus:ring-[#C0FF00]"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateInputValue(inputKey, 'reps', 1)}
                          className="p-1 px-2 border border-[#333] bg-[#222] rounded-lg hover:border-[#C0FF00]/40 text-gray-300 text-xs cursor-pointer select-none"
                        >
                          +1
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
