import React from 'react';
import { Play, CheckCircle2, Clock, Dumbbell, Flame, RotateCcw } from 'lucide-react';

interface ActiveWorkoutHeaderBarProps {
  workoutName: string;
  workoutOrder: number;
  exerciseCount: number;
  totalSets: number;
  completedSetsCount: number;
  isSessionActive: boolean;
  elapsedSeconds: number;
  onStartWorkout: () => void;
  onFinishWorkout: () => void;
  onCancelSession?: () => void;
}

function formatTimer(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hrs > 0) {
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const ActiveWorkoutHeaderBar: React.FC<ActiveWorkoutHeaderBarProps> = ({
  workoutName,
  workoutOrder,
  exerciseCount,
  totalSets,
  completedSetsCount,
  isSessionActive,
  elapsedSeconds,
  onStartWorkout,
  onFinishWorkout,
  onCancelSession,
}) => {
  const progressPercent = totalSets > 0 ? Math.min(100, Math.round((completedSetsCount / totalSets) * 100)) : 0;

  if (!isSessionActive) {
    return (
      <div className="bg-gradient-to-r from-[#141414] via-[#111] to-[#141414] border border-[#262626] rounded-[24px] p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/25">
              Day {workoutOrder}
            </span>
            <span className="text-gray-500 text-xs">•</span>
            <span className="text-gray-400 text-xs font-mono">Ready to Train</span>
          </div>

          <h3 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-tight truncate">
            {workoutName}
          </h3>

          <div className="flex items-center gap-3 text-[11px] font-mono text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5 text-gray-500" />
              {exerciseCount} Exercises
            </span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#C0FF00]" />
              {totalSets} Total Sets
            </span>
            <span className="text-gray-600">•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              ~{Math.max(20, totalSets * 3)} min
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartWorkout}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#C0FF00] hover:bg-[#b0f000] text-black font-display font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(192,255,0,0.25)] hover:shadow-[0_0_30px_rgba(192,255,0,0.4)] cursor-pointer active:scale-98 shrink-0"
        >
          <Play className="w-4 h-4 fill-black text-black" />
          <span>Start Workout</span>
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-2 z-30 bg-[#121212]/95 backdrop-blur-xl border border-[#C0FF00]/30 rounded-[24px] p-3.5 sm:p-4 shadow-[0_10px_35px_rgba(0,0,0,0.8)] space-y-2.5 animate-in slide-in-from-top duration-200">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Active session pulsating indicator */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C0FF00] opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C0FF00]" />
          </span>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-black tracking-widest text-[#C0FF00]">
                Active Session
              </span>
              <span className="text-gray-600 text-[10px] hidden sm:inline">•</span>
              <span className="text-xs font-display font-bold text-gray-300 truncate hidden sm:inline">
                {workoutName}
              </span>
            </div>

            {/* Live Monospace Elapsed Stopwatch */}
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
                {formatTimer(elapsedSeconds)}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {completedSetsCount} / {totalSets} sets ({progressPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onCancelSession && (
            <button
              type="button"
              onClick={onCancelSession}
              title="Reset workout timer"
              aria-label="Reset workout timer"
              className="p-2 sm:p-2.5 text-gray-400 hover:text-red-400 bg-[#1c1c1c] hover:bg-red-950/30 border border-[#2a2a2a] rounded-xl transition-colors cursor-pointer flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onFinishWorkout}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white hover:bg-gray-100 text-black font-display font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer active:scale-98"
          >
            <CheckCircle2 className="w-4 h-4 text-black" />
            <span>Finish Workout</span>
          </button>
        </div>
      </div>

      {/* Mini Progress Bar */}
      <div className="w-full bg-[#202020] h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-[#C0FF00] h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(192,255,0,0.6)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
