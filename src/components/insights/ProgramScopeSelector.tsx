import React from 'react';
import { Filter, Layers, Check } from 'lucide-react';
import { SavedRoutineProgram } from '../../models.ts';

interface ProgramScopeSelectorProps {
  programs: SavedRoutineProgram[];
  selectedProgramId: string; // 'all' or program.id
  onSelectProgram: (programId: string) => void;
}

export const ProgramScopeSelector: React.FC<ProgramScopeSelectorProps> = ({
  programs,
  selectedProgramId,
  onSelectProgram,
}) => {
  return (
    <div className="flex items-center gap-2 bg-[#141414] border border-[#282828] p-1.5 rounded-2xl">
      <div className="flex items-center gap-1.5 px-2 text-gray-400">
        <Filter className="w-3.5 h-3.5 text-[#C0FF00]" />
        <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
          Scope:
        </span>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto flex-1">
        <button
          type="button"
          onClick={() => onSelectProgram('all')}
          className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedProgramId === 'all'
              ? 'bg-[#C0FF00] text-black shadow-sm'
              : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]'
          }`}
        >
          All Programs (Global)
        </button>

        {programs.map((prog) => (
          <button
            key={prog.id}
            type="button"
            onClick={() => onSelectProgram(prog.id)}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedProgramId === prog.id
                ? 'bg-[#C0FF00] text-black shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]'
            }`}
          >
            {prog.title}
          </button>
        ))}
      </div>
    </div>
  );
};
