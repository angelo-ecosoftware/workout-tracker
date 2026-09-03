import React from 'react';
import { Play, RotateCcw, CheckCircle2 } from 'lucide-react';

interface ActiveRestTimerBarProps {
  restTimeRemaining: number;
  totalRestTime: number;
  activeTimerExerciseName?: string;
  onAddTenSeconds: () => void;
  onSkipTimer: () => void;
}

export const ActiveRestTimerBar: React.FC<ActiveRestTimerBarProps> = ({
  restTimeRemaining,
  totalRestTime,
  activeTimerExerciseName,
  onAddTenSeconds,
  onSkipTimer,
}) => {
  if (restTimeRemaining <= 0) return null;

  const progressPercent = Math.max(
    0,
    Math.min(100, ((totalRestTime - restTimeRemaining) / (totalRestTime || 1)) * 100)
  );

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40 animate-slideUp">
      <div className="bg-[#141414]/95 border border-[#C0FF00]/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C0FF00] animate-pulse" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Resting
              {activeTimerExerciseName ? ` • ${activeTimerExerciseName}` : ''}
            </span>
          </div>
          <div className="text-xl font-black font-display text-[#C0FF00] font-mono">
            {restTimeRemaining}s
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#C0FF00] h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onAddTenSeconds}
            className="px-3 py-1 bg-[#222] hover:bg-[#2c2c2c] text-gray-300 hover:text-white rounded-lg text-xs font-mono transition-colors"
          >
            +10s
          </button>
          <button
            type="button"
            onClick={onSkipTimer}
            className="px-3 py-1 bg-[#C0FF00] hover:bg-[#aee600] text-black font-bold rounded-lg text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Next Set
          </button>
        </div>
      </div>
    </div>
  );
};
