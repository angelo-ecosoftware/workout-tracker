import React from 'react';
import { Plus } from 'lucide-react';
import { Workout, Exercise } from '../../models.ts';

interface RoutineDaySelectorProps {
  workouts: (Workout & { exercises: Exercise[] })[];
  selectedWorkoutIndex: number;
  onSelectIndex: (index: number) => void;
  onAddWorkoutDay: () => void;
}

export const RoutineDaySelector: React.FC<RoutineDaySelectorProps> = ({
  workouts,
  selectedWorkoutIndex,
  onSelectIndex,
  onAddWorkoutDay,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-[#C0FF00] uppercase tracking-widest font-mono">
          Routine Days ({workouts.length})
        </label>
        <button
          type="button"
          onClick={onAddWorkoutDay}
          className="flex items-center gap-1 text-[10px] font-mono font-bold text-black bg-[#C0FF00] hover:bg-[#a6dc00] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Add Routine Day
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {workouts.map((w, idx) => {
          const isActive = selectedWorkoutIndex === idx;
          return (
            <button
              key={w.id || idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-bold font-mono shrink-0 transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#C0FF00] text-black border-[#C0FF00] shadow-[0_0_15px_rgba(192,255,0,0.2)]'
                  : 'bg-[#181818] text-gray-300 border-[#262626] hover:border-[#383838]'
              }`}
            >
              Day {w.order || idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
