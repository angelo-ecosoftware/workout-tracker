import React from 'react';
import { Workout, Exercise } from '../../../models.ts';

interface RoutineSplitSelectorProps {
  workouts: (Workout & { exercises: Exercise[] })[];
  activeWorkout: (Workout & { exercises: Exercise[] }) | null;
  suggestedDay: number;
  lastSessionDay: number | null;
  onSelectWorkout: (workout: Workout & { exercises: Exercise[] }) => void;
}

export const RoutineSplitSelector: React.FC<RoutineSplitSelectorProps> = ({
  workouts,
  activeWorkout,
  suggestedDay,
  lastSessionDay,
  onSelectWorkout,
}) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl relative overflow-hidden">
      <label className="block text-[10px] font-bold text-[#C0FF00] uppercase tracking-widest mb-3 font-mono">
        Select Routine
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {workouts.map((w) => {
          const isSuggested = suggestedDay === w.order;
          const isActive = activeWorkout?.id === w.id;

          return (
            <button
              key={w.id}
              onClick={() => onSelectWorkout(w)}
              className={`py-3 px-3 rounded-xl text-left transition-all border relative cursor-pointer ${
                isActive
                  ? 'border-none bg-[#C0FF00] text-black font-black shadow-[0_0_25px_rgba(192,255,0,0.25)]'
                  : 'border-[#222] bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 hover:text-white'
              }`}
            >
              <div className="font-display font-black text-[11px] tracking-tight uppercase">
                {w.name.split(' (')[0]}
              </div>
              <div
                className={`text-[9px] truncate font-sans font-semibold mt-0.5 uppercase tracking-wide ${
                  isActive ? 'text-black/70' : 'text-gray-500'
                }`}
              >
                {w.name.includes('(') ? `(${w.name.split('(')[1]}` : ''}
              </div>

              {isSuggested && !isActive && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C0FF00] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C0FF00]"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {lastSessionDay && (
        <div className="mt-4 text-[10px] text-gray-500 font-sans flex items-center justify-between border-t border-[#222] pt-3">
          <span className="font-mono">
            LAST COMPLETED ROUTINE:{' '}
            <strong className="text-gray-200">
              {workouts.find((w) => w.order === lastSessionDay)?.name || lastSessionDay}
            </strong>
          </span>
          <span className="flex items-center gap-1.5 text-[#C0FF00] font-bold font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C0FF00] inline-block animate-pulse"></span>
            SUGGESTED:{' '}
            {workouts.find((w) => w.order === suggestedDay)?.name.split(' (')[0] || suggestedDay}
          </span>
        </div>
      )}
    </div>
  );
};
