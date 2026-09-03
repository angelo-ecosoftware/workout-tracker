import React from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';

interface HistoryHeaderActionsProps {
  sessionCount: number;
  isDeleteMode: boolean;
  selectedCount: number;
  onToggleDeleteMode: () => void;
  onSelectAll: () => void;
  onOpenConfirmDelete: () => void;
}

export const HistoryHeaderActions: React.FC<HistoryHeaderActionsProps> = ({
  sessionCount,
  isDeleteMode,
  selectedCount,
  onToggleDeleteMode,
  onSelectAll,
  onOpenConfirmDelete,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-black font-display text-white tracking-tight uppercase">
          Workout History
        </h2>
        <p className="text-gray-400 text-xs mt-0.5">
          {sessionCount} Completed Session{sessionCount === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isDeleteMode ? (
          <>
            <button
              type="button"
              onClick={onSelectAll}
              className="px-3 py-1.5 rounded-xl border border-[#333] hover:border-[#444] bg-[#1a1a1a] text-gray-300 text-xs font-mono transition-colors cursor-pointer"
            >
              {selectedCount === sessionCount ? 'Deselect All' : 'Select All'}
            </button>
            <button
              type="button"
              onClick={onOpenConfirmDelete}
              disabled={selectedCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedCount})</span>
            </button>
            <button
              type="button"
              onClick={onToggleDeleteMode}
              className="px-3 py-1.5 rounded-xl border border-[#333] hover:border-gray-500 bg-[#141414] text-gray-400 hover:text-white text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onToggleDeleteMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#333] hover:border-red-500/40 bg-[#161616] text-gray-400 hover:text-red-400 text-xs font-mono transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Manage Logs</span>
          </button>
        )}
      </div>
    </div>
  );
};
