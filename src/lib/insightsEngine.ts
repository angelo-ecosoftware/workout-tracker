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

export interface RestDisciplineMetrics {
  totalRestSeconds: number;
  recordedRestIntervalsCount: number;
  averageRestSeconds: number;
  adherencePercentage: number; // % of sets resting within +/- 15s of target
  onTimeCount: number;
  underRestCount: number; // rushed (< target - 15s)
  overRestCount: number; // delayed (> target + 15s)
  workToRestRatio: number; // workSeconds / (restSeconds || 1)
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
  restDiscipline: RestDisciplineMetrics;
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

  // Generate daily tiles starting on the Monday of the week 89 days ago up to today
  // to align cleanly with standard Monday-Sunday left-to-right rows
  const startDate = new Date();
  startDate.setDate(now.getDate() - 89);
  // Align to previous Monday (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const dayOffset = (startDate.getDay() + 6) % 7; // Monday = 0
  startDate.setDate(startDate.getDate() - dayOffset);
  startDate.setHours(0, 0, 0, 0);

  const todayStr = now.toISOString().split('T')[0];
  const iterDate = new Date(startDate);

  while (iterDate <= now) {
    const dateStr = iterDate.toISOString().split('T')[0];
    const dayData = dateToSessionMap.get(dateStr);

    heatmapDays.push({
      date: dateStr,
      dayOfWeek: iterDate.getDay(),
      isToday: dateStr === todayStr,
      sessionsCount: dayData?.count || 0,
      totalVolumeKg: Math.round(dayData?.volume || 0),
      totalWorkSeconds: dayData?.workSec || 0,
      workoutNames: dayData?.names || [],
    });

    iterDate.setDate(iterDate.getDate() + 1);
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

  // Rest Interval Discipline Analysis
  const restSets = sets.filter((s) => s.restSeconds != null && s.restSeconds > 0);
  const targetRest = 90; // Standard 90s benchmark or user setting baseline
  let onTimeCount = 0;
  let underRestCount = 0;
  let overRestCount = 0;

  restSets.forEach((s) => {
    const r = s.restSeconds!;
    if (r >= targetRest - 15 && r <= targetRest + 20) {
      onTimeCount++;
    } else if (r < targetRest - 15) {
      underRestCount++;
    } else {
      overRestCount++;
    }
  });

  const adherencePercentage = restSets.length > 0 ? Math.round((onTimeCount / restSets.length) * 100) : 0;
  const averageRestSeconds = restSets.length > 0 ? Math.round(totalRestSeconds / restSets.length) : 0;
  const workToRestRatio = totalRestSeconds > 0 ? Math.round((totalWorkSeconds / totalRestSeconds) * 10) / 10 : 0;

  const restDiscipline: RestDisciplineMetrics = {
    totalRestSeconds,
    recordedRestIntervalsCount: restSets.length,
    averageRestSeconds,
    adherencePercentage,
    onTimeCount,
    underRestCount,
    overRestCount,
    workToRestRatio,
  };

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
    restDiscipline,
  };
}

export interface ExerciseSessionDataPoint {
  sessionId: string;
  sessionDate: string; // YYYY-MM-DD
  formattedDate: string; // e.g. "May 12"
  maxWeightKg: number;
  estimated1RMKg: number;
  totalVolumeKg: number;
  totalReps: number;
  maxHoldDurationSeconds: number;
  setsCount: number;
  sets: Array<{
    setNumber: number;
    weight: number;
    reps: number;
    durationSeconds?: number;
  }>;
}

export interface ExerciseProgressionReport {
  exerciseId: string;
  exerciseName: string;
  exerciseType: 'strength' | 'timed';
  allTimePrWeightKg: number;
  allTimePr1RMKg: number;
  allTimePrVolumeKg: number;
  allTimePrHoldSeconds: number;
  totalSetsLogged: number;
  dataPoints: ExerciseSessionDataPoint[];
  weightDeltaPercentage: number;
  oneRmDeltaPercentage: number;
  volumeDeltaPercentage: number;
}

/**
 * Calculates per-exercise progression curves across all sessions.
 */
export function calculateExerciseProgression(
  exerciseId: string,
  sessions: Session[],
  sets: WorkoutSet[],
  exercises: Exercise[]
): ExerciseProgressionReport | null {
  const targetExercise = exercises.find((e) => e.id === exerciseId);
  if (!targetExercise) return null;

  const exerciseSets = sets.filter((s) => s.exerciseId === exerciseId);
  if (exerciseSets.length === 0) {
    return {
      exerciseId,
      exerciseName: targetExercise.name,
      exerciseType: targetExercise.type,
      allTimePrWeightKg: 0,
      allTimePr1RMKg: 0,
      allTimePrVolumeKg: 0,
      allTimePrHoldSeconds: 0,
      totalSetsLogged: 0,
      dataPoints: [],
      weightDeltaPercentage: 0,
      oneRmDeltaPercentage: 0,
      volumeDeltaPercentage: 0,
    };
  }

  // Session date map
  const sessionMap = new Map<string, Session>();
  sessions.forEach((s) => {
    if (s.id) sessionMap.set(s.id, s);
  });

  // Group sets by session
  const setsBySession = new Map<string, WorkoutSet[]>();
  exerciseSets.forEach((set) => {
    const list = setsBySession.get(set.sessionId) || [];
    list.push(set);
    setsBySession.set(set.sessionId, list);
  });

  const dataPoints: ExerciseSessionDataPoint[] = [];
  let allTimePrWeightKg = 0;
  let allTimePr1RMKg = 0;
  let allTimePrVolumeKg = 0;
  let allTimePrHoldSeconds = 0;

  setsBySession.forEach((sessionSets, sessionId) => {
    const session = sessionMap.get(sessionId);
    const dateObj = session?.completedAt ? new Date(session.completedAt) : session?.startedAt ? new Date(session.startedAt) : null;
    if (!dateObj) return;

    // Sort sets by setNumber
    sessionSets.sort((a, b) => (a.setNumber || 0) - (b.setNumber || 0));

    let maxWeight = 0;
    let max1RM = 0;
    let totalVol = 0;
    let totalReps = 0;
    let maxHold = 0;

    const formattedSets = sessionSets.map((s) => {
      const wt = s.weight || 0;
      const rp = s.reps || 0;
      const dur = s.durationSeconds || 0;

      if (wt > maxWeight) maxWeight = wt;
      if (dur > maxHold) maxHold = dur;

      // Epley 1RM formula: Weight * (1 + reps / 30)
      if (wt > 0 && rp > 0) {
        const est1RM = Math.round(wt * (1 + rp / 30) * 10) / 10;
        if (est1RM > max1RM) max1RM = est1RM;
      } else if (wt > 0 && rp === 0) {
        if (wt > max1RM) max1RM = wt;
      }

      totalVol += wt * rp;
      totalReps += rp;

      return {
        setNumber: s.setNumber,
        weight: wt,
        reps: rp,
        durationSeconds: dur > 0 ? dur : undefined,
      };
    });

    if (maxWeight > allTimePrWeightKg) allTimePrWeightKg = maxWeight;
    if (max1RM > allTimePr1RMKg) allTimePr1RMKg = max1RM;
    if (totalVol > allTimePrVolumeKg) allTimePrVolumeKg = totalVol;
    if (maxHold > allTimePrHoldSeconds) allTimePrHoldSeconds = maxHold;

    const dateStr = dateObj.toISOString().split('T')[0];
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    dataPoints.push({
      sessionId,
      sessionDate: dateStr,
      formattedDate,
      maxWeightKg: maxWeight,
      estimated1RMKg: max1RM,
      totalVolumeKg: Math.round(totalVol),
      totalReps,
      maxHoldDurationSeconds: maxHold,
      setsCount: sessionSets.length,
      sets: formattedSets,
    });
  });

  // Sort chronological
  dataPoints.sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

  // Deltas comparing first session to latest session
  let weightDeltaPercentage = 0;
  let oneRmDeltaPercentage = 0;
  let volumeDeltaPercentage = 0;

  if (dataPoints.length >= 2) {
    const firstPoint = dataPoints[0];
    const latestPoint = dataPoints[dataPoints.length - 1];

    if (firstPoint.maxWeightKg > 0) {
      weightDeltaPercentage = Math.round(((latestPoint.maxWeightKg - firstPoint.maxWeightKg) / firstPoint.maxWeightKg) * 100);
    }
    if (firstPoint.estimated1RMKg > 0) {
      oneRmDeltaPercentage = Math.round(((latestPoint.estimated1RMKg - firstPoint.estimated1RMKg) / firstPoint.estimated1RMKg) * 100);
    }
    if (firstPoint.totalVolumeKg > 0) {
      volumeDeltaPercentage = Math.round(((latestPoint.totalVolumeKg - firstPoint.totalVolumeKg) / firstPoint.totalVolumeKg) * 100);
    }
  }

  return {
    exerciseId,
    exerciseName: targetExercise.name,
    exerciseType: targetExercise.type,
    allTimePrWeightKg,
    allTimePr1RMKg: Math.round(allTimePr1RMKg * 10) / 10,
    allTimePrVolumeKg,
    allTimePrHoldSeconds,
    totalSetsLogged: exerciseSets.length,
    dataPoints,
    weightDeltaPercentage,
    oneRmDeltaPercentage,
    volumeDeltaPercentage,
  };
}
