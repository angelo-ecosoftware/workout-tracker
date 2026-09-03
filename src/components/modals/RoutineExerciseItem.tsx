import React from 'react';
import { Exercise, ExerciseType } from '../../models.ts';
import { ChevronUp, ChevronDown, Edit3, Trash2 } from 'lucide-react';

interface RoutineExerciseItemProps {
  exercise: Exercise;
  index: number;
  isEditing: boolean;
  totalExercises: number;
  onToggleEdit: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onUpdate: (updates: Partial<Exercise>) => void;
  onDelete: () => void;
}

export const RoutineExerciseItem: React.FC<RoutineExerciseItemProps> = ({
  exercise,
  index,
  isEditing,
  totalExercises,
  onToggleEdit,
  onMove,
  onUpdate,
  onDelete,
}) => {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-xl p-3 space-y-2.5 transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-5 h-5 rounded bg-[#1a1a1a] text-[10px] font-mono font-bold text-gray-400 flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          {isEditing ? (
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full bg-[#181818] border border-[#383838] focus:border-[#C0FF00] rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none"
            />
          ) : (
            <div className="truncate font-display font-bold text-xs text-white">
              {exercise.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove('up')}
            className="p-1 hover:bg-[#222] text-gray-400 hover:text-white disabled:opacity-30 rounded cursor-pointer"
            title="Move up"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={index === totalExercises - 1}
            onClick={() => onMove('down')}
            className="p-1 hover:bg-[#222] text-gray-400 hover:text-white disabled:opacity-30 rounded cursor-pointer"
            title="Move down"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleEdit}
            className="p-1 hover:bg-[#222] text-gray-400 hover:text-[#C0FF00] rounded cursor-pointer"
            title="Edit specs"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1 hover:bg-red-500/10 text-gray-500 hover:text-red-400 rounded cursor-pointer"
            title="Delete exercise"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Exercise Specs (Sets, Reps, Type) */}
      {isEditing && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1e1e1e] text-[10px] font-mono">
          <div>
            <label className="text-gray-500 block mb-0.5">Type</label>
            <select
              value={exercise.type}
              onChange={(e) => onUpdate({ type: e.target.value as ExerciseType })}
              className="w-full bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-[#C0FF00]"
            >
              <option value="strength">Strength (Weight/Reps)</option>
              <option value="timed">Timed (Seconds)</option>
            </select>
          </div>
          <div>
            <label className="text-gray-500 block mb-0.5">Target Sets</label>
            <input
              type="number"
              min="1"
              max="10"
              value={exercise.targetSets}
              onChange={(e) => onUpdate({ targetSets: parseInt(e.target.value, 10) || 1 })}
              className="w-full bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-[#C0FF00]"
            />
          </div>
          <div>
            <label className="text-gray-500 block mb-0.5">
              {exercise.type === 'timed' ? 'Target Sec (Min)' : 'Rep Min'}
            </label>
            <input
              type="number"
              min="1"
              max="300"
              value={exercise.targetRepMin}
              onChange={(e) => onUpdate({ targetRepMin: parseInt(e.target.value, 10) || 1 })}
              className="w-full bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-[#C0FF00]"
            />
          </div>
          <div>
            <label className="text-gray-500 block mb-0.5">
              {exercise.type === 'timed' ? 'Target Sec (Max)' : 'Rep Max'}
            </label>
            <input
              type="number"
              min="1"
              max="300"
              value={exercise.targetRepMax}
              onChange={(e) => onUpdate({ targetRepMax: parseInt(e.target.value, 10) || 1 })}
              className="w-full bg-[#181818] border border-[#333] rounded-lg px-2 py-1 text-gray-200 focus:outline-none focus:border-[#C0FF00]"
            />
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="flex items-center gap-3 text-[10px] font-mono text-gray-400">
          <span className="bg-[#181818] px-2 py-0.5 rounded border border-[#222]">
            {exercise.targetSets} sets
          </span>
          <span className="bg-[#181818] px-2 py-0.5 rounded border border-[#222]">
            {exercise.type === 'timed'
              ? `${exercise.targetRepMin}-${exercise.targetRepMax} sec`
              : `${exercise.targetRepMin}-${exercise.targetRepMax} reps`}
          </span>
          <span className="text-gray-500 uppercase">{exercise.type}</span>
        </div>
      )}
    </div>
  );
};
