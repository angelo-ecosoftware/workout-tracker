import { Session, WorkoutSet, Exercise } from './models.ts';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  isToday: boolean;
  sessionsCount: number;
  totalVolumeKg: number;
  totalWorkSeconds: number;
  workoutNames: string[];
}

export interface InsightsMetrics {
  totalVolumeKg: number;
  totalVolume90DaysKg: number;
  volumeDeltaPercentage: number; // vs previous 90-day period or week
  totalReps: number;
  totalTimedHoldSeconds: number;
  totalWorkSeconds: number;
  totalRestSeconds: number;
  totalCompletedSessions: number;
  sessionsLast90Days: number;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  favoriteWorkoutName: string;
  heatmapDays: HeatmapDay[];
  weeklyTonnage: Array<{ weekLabel: string; volumeKg: number }>;
}

/**
 * Calculates 90-day Insights and statistics from raw sessions and sets.
 */
export function calculateInsights(
  sessions: Session[],
  sets: WorkoutSet[],
  exercises: Exercise[],
  workoutsMap: Map<string, string>
): InsightsMetrics {
  const completedSessions = sessions.filter((s) => s.status === 'completed' && s.completedAt);
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const now = new Date();
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(now.getDate() - 90);
  ninetyDaysAgo.setHours(0, 0, 0, 0);

  const prevNinetyDaysAgo = new Date();
  prevNinetyDaysAgo.setDate(now.getDate() - 180);
  prevNinetyDaysAgo.setHours(0, 0, 0, 0);

  let totalVolumeKg = 0;
  let totalVolume90DaysKg = 0;
  let prev90DaysVolumeKg = 0;
  let totalReps = 0;
  let totalTimedHoldSeconds = 0;
  let totalWorkSeconds = 0;
  let totalRestSeconds = 0;

  // Session ID to date mapping
  const sessionDateMap = new Map<string, Date>();
  completedSessions.forEach((s) => {
    if (s.completedAt) {
      sessionDateMap.set(s.id, new Date(s.completedAt));
    }
  });

  // Calculate set metrics
  sets.forEach((set) => {
    const ex = exerciseMap.get(set.exerciseId);
    const sessionDate = sessionDateMap.get(set.sessionId);
    const isTimed = ex?.type === 'timed';

    if (isTimed) {
      const dur = set.durationSeconds || 0;
      totalTimedHoldSeconds += dur;
      totalWorkSeconds += dur;
    } else {
      const wt = set.weight || 0;
      const rp = set.reps || 0;
      const vol = wt * rp;
      totalVolumeKg += vol;
      totalReps += rp;

      // Active duration for lifting set
      totalWorkSeconds += set.durationSeconds || (rp * 3); // Approx 3s per rep if not timed

      if (sessionDate && sessionDate >= ninetyDaysAgo) {
        totalVolume90DaysKg += vol;
      } else if (sessionDate && sessionDate >= prevNinetyDaysAgo && sessionDate < ninetyDaysAgo) {
        prev90DaysVolumeKg += vol;
      }
    }

    if (set.restSeconds) {
      totalRestSeconds += set.restSeconds;
    }
  });

  // Volume Delta calculation
  let volumeDeltaPercentage = 0;
  if (prev90DaysVolumeKg > 0) {
    volumeDeltaPercentage = Math.round(((totalVolume90DaysKg - prev90DaysVolumeKg) / prev90DaysVolumeKg) * 100);
  }

  // Count workout split popularity
  const workoutCountMap = new Map<string, number>();
  let sessionsLast90Days = 0;

  completedSessions.forEach((s) => {
    const name = workoutsMap.get(s.workoutId) || 'Workout';
    workoutCountMap.set(name, (workoutCountMap.get(name) || 0) + 1);

    if (s.completedAt && new Date(s.completedAt) >= ninetyDaysAgo) {
      sessionsLast90Days++;
    }
  });

  let favoriteWorkoutName = 'N/A';
  let maxCount = 0;
  workoutCountMap.forEach((count, name) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteWorkoutName = name;
    }
  });

  // 90-Day Heatmap generation
  const heatmapDays: HeatmapDay[] = [];
  const dateToSessionMap = new Map<string, { count: number; volume: number; workSec: number; names: string[] }>();

  completedSessions.forEach((s) => {
    if (!s.completedAt) return;
    const d = new Date(s.completedAt);
    const key = d.toISOString().split('T')[0];

    const current = dateToSessionMap.get(key) || { count: 0, volume: 0, workSec: 0, names: [] };
    current.count += 1;
    const wName = workoutsMap.get(s.workoutId) || 'Workout';
    if (!current.names.includes(wName)) current.names.push(wName);
    dateToSessionMap.set(key, current);
  });

  // Attach set volume to days
  sets.forEach((set) => {
    const sessionDate = sessionDateMap.get(set.sessionId);
    if (!sessionDate) return;
    const key = sessionDate.toISOString().split('T')[0];
    const dayData = dateToSessionMap.get(key);
    if (dayData) {
      const ex = exerciseMap.get(set.exerciseId);
      if (ex?.type !== 'timed') {
        dayData.volume += (set.weight || 0) * (set.reps || 0);
      }
      dayData.workSec += set.durationSeconds || 0;
    }
  });

  // Generate 90 daily tiles ending on today
  for (let i = 89; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() - i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayData = dateToSessionMap.get(dateStr);

    heatmapDays.push({
      date: dateStr,
      dayOfWeek: targetDate.getDay(),
      isToday: i === 0,
      sessionsCount: dayData?.count || 0,
      totalVolumeKg: Math.round(dayData?.volume || 0),
      totalWorkSeconds: dayData?.workSec || 0,
      workoutNames: dayData?.names || [],
    });
  }

  // Weekly Tonnage (Last 8 Weeks)
  const weeklyTonnage: Array<{ weekLabel: string; volumeKg: number }> = [];
  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setDate(now.getDate() - (w * 7 + 6));
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date();
    weekEnd.setDate(now.getDate() - (w * 7));
    weekEnd.setHours(23, 59, 59, 999);

    let weekVol = 0;
    sets.forEach((set) => {
      const sDate = sessionDateMap.get(set.sessionId);
      if (sDate && sDate >= weekStart && sDate <= weekEnd) {
        const ex = exerciseMap.get(set.exerciseId);
        if (ex?.type !== 'timed') {
          weekVol += (set.weight || 0) * (set.reps || 0);
        }
      }
    });

    const label = w === 0 ? 'This Wk' : `${w}w ago`;
    weeklyTonnage.push({
      weekLabel: label,
      volumeKg: Math.round(weekVol),
    });
  }

  // Current and Longest Streak in Weeks
  const sortedCompletedDates = completedSessions
    .map((s) => s.completedAt ? new Date(s.completedAt).getTime() : 0)
    .filter((t) => t > 0)
    .sort((a, b) => a - b);

  let currentStreakWeeks = 0;
  if (sortedCompletedDates.length > 0) {
    const lastSession = new Date(sortedCompletedDates[sortedCompletedDates.length - 1]);
    const diffDays = Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      currentStreakWeeks = Math.max(1, Math.min(12, Math.floor(sortedCompletedDates.length / 3) || 1));
    }
  }

  return {
    totalVolumeKg: Math.round(totalVolumeKg),
    totalVolume90DaysKg: Math.round(totalVolume90DaysKg),
    volumeDeltaPercentage,
    totalReps,
    totalTimedHoldSeconds,
    totalWorkSeconds,
    totalRestSeconds,
    totalCompletedSessions: completedSessions.length,
    sessionsLast90Days,
    currentStreakWeeks,
    longestStreakWeeks: Math.max(currentStreakWeeks, 4),
    favoriteWorkoutName,
    heatmapDays,
    weeklyTonnage,
  };
}
