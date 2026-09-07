import React, { useMemo } from 'react';
import { Flame, Calendar, Award } from 'lucide-react';

export interface ConsistencySessionItem {
  id?: string;
  completedAt?: Date | string | null;
  startedAt?: Date | string | null;
  status?: string;
}

interface WeeklyConsistencyStreakProps {
  sessions: ConsistencySessionItem[];
  referenceDate?: Date;
  className?: string;
}

export interface DayPillData {
  dayLabel: string;
  dayNumber: number;
  dateStr: string;
  isToday: boolean;
  isFuture: boolean;
  hasWorkout: boolean;
  workoutCount: number;
}

export interface WeeklyStreakResult {
  streakWeeks: number;
  workoutsThisWeek: number;
  days: DayPillData[];
}

/**
 * Formats a Date object to YYYY-MM-DD in local time
 */
export function formatLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the current Monday-to-Sunday week breakdown and consecutive weekly streak
 */
export function calculateWeeklyConsistency(
  sessions: ConsistencySessionItem[],
  referenceDate = new Date()
): WeeklyStreakResult {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const todayStr = formatLocalISODate(ref);

  // Determine Monday of the current week (ISO week: Monday = 1, Sunday = 0)
  const currentDayOfWeek = ref.getDay();
  const diffToMonday = (currentDayOfWeek + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Map of completed workout dates -> count
  const completedDateMap = new Map<string, number>();
  sessions.forEach((s) => {
    if (s.status === 'in_progress') return;
    const rawDate = s.completedAt || s.startedAt;
    if (!rawDate) return;
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return;
    const key = formatLocalISODate(d);
    completedDateMap.set(key, (completedDateMap.get(key) || 0) + 1);
  });

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const days: DayPillData[] = [];
  let workoutsThisWeek = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateStr = formatLocalISODate(dayDate);
    const isToday = dateStr === todayStr;
    const isFuture = dayDate.getTime() > ref.getTime();
    const count = completedDateMap.get(dateStr) || 0;
    const hasWorkout = count > 0;

    if (hasWorkout) {
      workoutsThisWeek += count;
    }

    days.push({
      dayLabel: dayLabels[i],
      dayNumber: dayDate.getDate(),
      dateStr,
      isToday,
      isFuture,
      hasWorkout,
      workoutCount: count,
    });
  }

  // Calculate consecutive weekly streak
  // A week has completed a workout if any day in that week has a logged workout
  const hasWorkoutInWeek = (weekMonday: Date): boolean => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekMonday);
      d.setDate(weekMonday.getDate() + i);
      const k = formatLocalISODate(d);
      if ((completedDateMap.get(k) || 0) > 0) {
        return true;
      }
    }
    return false;
  };

  let streakWeeks = 0;
  const currentWeekHasWorkout = hasWorkoutInWeek(monday);

  if (currentWeekHasWorkout) {
    // Current week is active and counts towards streak
    streakWeeks = 1;
    let checkMonday = new Date(monday);
    while (true) {
      checkMonday.setDate(checkMonday.getDate() - 7);
      if (hasWorkoutInWeek(checkMonday)) {
        streakWeeks++;
      } else {
        break;
      }
    }
  } else {
    // Current week has no workout yet; check if last week had one (grace window)
    const lastWeekMonday = new Date(monday);
    lastWeekMonday.setDate(monday.getDate() - 7);
    if (hasWorkoutInWeek(lastWeekMonday)) {
      streakWeeks = 1;
      let checkMonday = new Date(lastWeekMonday);
      while (true) {
        checkMonday.setDate(checkMonday.getDate() - 7);
        if (hasWorkoutInWeek(checkMonday)) {
          streakWeeks++;
        } else {
          break;
        }
      }
    } else {
      streakWeeks = 0;
    }
  }

  return {
    streakWeeks,
    workoutsThisWeek,
    days,
  };
}

export const WeeklyConsistencyStreak: React.FC<WeeklyConsistencyStreakProps> = ({
  sessions,
  referenceDate,
  className = '',
}) => {
  const { streakWeeks, workoutsThisWeek, days } = useMemo(
    () => calculateWeeklyConsistency(sessions, referenceDate),
    [sessions, referenceDate]
  );

  return (
    <div
      className={`bg-[#111111] border border-[#222] rounded-[24px] p-4 sm:p-5 shadow-xl relative overflow-hidden ${className}`}
      role="region"
      aria-label="Weekly Consistency & Activity Streak"
    >
      {/* Subtle ambient glow when on an active streak */}
      {streakWeeks > 0 && (
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Header Row: Streak Counter & Status */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${
              streakWeeks > 0
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-[#181818] border-[#2c2c2c] text-gray-500'
            }`}
          >
            <Flame className={`w-4 h-4 ${streakWeeks > 0 ? 'fill-amber-400 text-amber-400' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-sm sm:text-base tracking-tight uppercase italic text-white">
                {streakWeeks > 0 ? (
                  <>
                    <span className="text-amber-400 font-mono not-italic">{streakWeeks}-Week</span> Streak
                  </>
                ) : (
                  'Start Your Streak'
                )}
              </span>

              {streakWeeks >= 4 && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30 uppercase tracking-wider">
                  <Award className="w-2.5 h-2.5" /> On Fire
                </span>
              )}
            </div>

            <p className="text-[10px] sm:text-[11px] font-sans text-gray-400 font-semibold tracking-wide">
              {workoutsThisWeek > 0
                ? `${workoutsThisWeek} workout${workoutsThisWeek === 1 ? '' : 's'} logged this week`
                : 'No workouts logged yet this week'}
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-[#161616] border border-[#222] px-2.5 py-1 rounded-xl">
          <Calendar className="w-3 h-3 text-[#C0FF00]" />
          <span>7-Day Cycle</span>
        </div>
      </div>

      {/* 7-Day Pill Bar */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 mt-3.5" role="list">
        {days.map((day) => {
          return (
            <div
              key={day.dateStr}
              role="listitem"
              aria-label={`${day.dayLabel} (${day.dateStr}): ${day.hasWorkout ? 'Completed' : 'Rest day'}`}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl sm:rounded-2xl border transition-all text-center select-none ${
                day.hasWorkout
                  ? 'bg-[#C0FF00] border-[#C0FF00] text-black font-black shadow-[0_0_15px_rgba(192,255,0,0.25)] scale-[1.02]'
                  : day.isToday
                  ? 'bg-[#181818] border-[#C0FF00]/50 text-white ring-1 ring-[#C0FF00]/30'
                  : day.isFuture
                  ? 'bg-[#0d0d0d] border-[#1a1a1a] text-gray-600 opacity-60'
                  : 'bg-[#141414] border-[#222] text-gray-400'
              }`}
            >
              <span
                className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider ${
                  day.hasWorkout ? 'text-black/80' : day.isToday ? 'text-[#C0FF00]' : 'text-gray-500'
                }`}
              >
                {day.dayLabel}
              </span>

              <span
                className={`font-mono text-xs sm:text-sm font-black my-0.5 ${
                  day.hasWorkout ? 'text-black' : day.isToday ? 'text-white' : 'text-gray-300'
                }`}
              >
                {day.dayNumber}
              </span>

              <div className="h-1.5 w-1.5 rounded-full mt-0.5 flex items-center justify-center">
                {day.hasWorkout ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                ) : day.isToday ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C0FF00] animate-pulse shrink-0" />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
