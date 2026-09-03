import React from 'react';
import { Workout } from '../../models.ts';
import { Settings } from 'lucide-react';

interface WorkoutHeaderProps {
  workout: Workout & { exercises: any[] };
  onOpenRoutineEditor: () => void;
}

export const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({
  workout,
  onOpenRoutineEditor,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222] pb-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/20">
            DAY {workout.order}
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight uppercase">
            {workout.name}
          </h2>
        </div>
        <p className="text-gray-400 text-xs mt-1">
          {workout.exercises.length} Exercises Scheduled
        </p>
      </div>

      <button
        type="button"
        onClick={onOpenRoutineEditor}
        className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#333] hover:border-[#C0FF00]/50 bg-[#161616] text-gray-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
      >
        <Settings className="w-3.5 h-3.5 text-[#C0FF00]" />
        <span>Customize Routine</span>
      </button>
    </div>
  );
};
