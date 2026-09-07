import React, { useMemo } from 'react';
import { Workout, Exercise } from '../../../models.ts';
import { Flame } from 'lucide-react';
import { SessionEngine } from '../../../engine.ts';

interface RoutineSplitSelectorProps {
  workouts: (Workout & { exercises: Exercise[] })[];
  activeWorkout: (Workout & { exercises: Exercise[] }) | null;
  suggestedDay: number;
  lastSessionDay: number | null;
  sessions?: Array<{ completedAt?: Date | string | null; startedAt?: Date | string | null; status?: string }>;
  onSelectWorkout: (workout: Workout & { exercises: Exercise[] }) => void;
}

export const RoutineSplitSelector: React.FC<RoutineSplitSelectorProps> = ({
  workouts,
  activeWorkout,
  suggestedDay,
  lastSessionDay,
  sessions,
  onSelectWorkout,
}) => {
  const streakStatus = useMemo(
    () => SessionEngine.calculateRoutineStreak(sessions),
    [sessions]
  );

  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h2 id="routine-selector-label" className="text-[10px] font-bold text-[#C0FF00] uppercase tracking-widest font-mono">
          Select Routine
        </h2>

        {/* Small number with fire icon in red zone */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#181818] border border-[#262626] shadow-sm select-none"
          title={
            streakStatus.streakCount > 0
              ? `${streakStatus.streakCount} consecutive routines completed. ${
                  streakStatus.recoveryState === 'recovering'
                    ? `${streakStatus.recoveryHoursRemaining}h remaining in 48h recovery window.`
                    : `${streakStatus.hoursUntilStreakBreak}h remaining before 96h streak cutoff.`
                }`
              : 'Complete a workout routine to begin your streak (breaks after 96h).'
          }
        >
          <Flame
            className={`w-3.5 h-3.5 ${
              streakStatus.streakCount > 0 ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
            }`}
          />
          <span
            className={`font-mono font-black text-xs ${
              streakStatus.streakCount > 0 ? 'text-white' : 'text-gray-500'
            }`}
          >
            {streakStatus.streakCount}
          </span>

          {streakStatus.recoveryState === 'recovering' && (
            <span className="text-[9px] font-mono text-emerald-400 border-l border-[#333] pl-1.5 ml-0.5 font-bold">
              {streakStatus.recoveryHoursRemaining}h rest
            </span>
          )}

          {streakStatus.recoveryState === 'streak_at_risk' && (
            <span className="text-[9px] font-mono text-amber-400 border-l border-[#333] pl-1.5 ml-0.5 font-bold animate-pulse">
              {streakStatus.hoursUntilStreakBreak}h left
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="group" aria-labelledby="routine-selector-label">
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

      {lastSessionDay && workouts.some((w) => w.order === lastSessionDay) ? (
        <div className="mt-4 text-[10px] text-gray-500 font-sans flex items-center justify-between border-t border-[#222] pt-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 font-mono flex-wrap">
            <span>
              LAST COMPLETED ROUTINE:{' '}
              <strong className="text-gray-200">
                {workouts.find((w) => w.order === lastSessionDay)?.name || `Day ${lastSessionDay}`}
              </strong>
            </span>
            {streakStatus.recoveryState === 'recovering' && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                48h RECOVERY ({streakStatus.recoveryHoursRemaining}h remaining)
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-[#C0FF00] font-bold font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C0FF00] inline-block animate-pulse"></span>
            SUGGESTED:{' '}
            {workouts.find((w) => w.order === suggestedDay)?.name.split(' (')[0] || `Day ${suggestedDay}`}
          </span>
        </div>
      ) : (
        <div className="mt-4 text-[10px] text-gray-500 font-sans flex items-center justify-between border-t border-[#222] pt-3">
          <span className="font-mono text-gray-400">
            CURRENT SPLIT PROGRESSION
          </span>
          <span className="flex items-center gap-1.5 text-[#C0FF00] font-bold font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C0FF00] inline-block animate-pulse"></span>
            SUGGESTED:{' '}
            {workouts.find((w) => w.order === suggestedDay)?.name.split(' (')[0] || `Day ${suggestedDay}`}
          </span>
        </div>
      )}
    </div>
  );
};
