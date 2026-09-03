import React from 'react';
import { Workout } from '../../models.ts';

interface RoutineSelectorGridProps {
  workouts: (Workout & { exercises?: any[] })[];
  activeWorkout: Workout | null;
  suggestedDay: number;
  onSelectWorkout: (workout: Workout & { exercises: any[] }) => void;
}

export const RoutineSelectorGrid: React.FC<RoutineSelectorGridProps> = ({
  workouts,
  activeWorkout,
  suggestedDay,
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
              onClick={() => onSelectWorkout(w as any)}
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
    </div>
  );
};
