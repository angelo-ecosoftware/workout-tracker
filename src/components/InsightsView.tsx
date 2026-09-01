import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { fetchWorkoutHistory, fetchAllSetsForUser, fetchWorkoutsData } from '../lib/supabaseData.ts';
import { calculateInsights, InsightsMetrics } from '../lib/insightsEngine.ts';
import { Session, WorkoutSet, Exercise } from '../models.ts';
import {
  TrendingUp,
  Dumbbell,
  Timer,
  Calendar,
  Flame,
  Award,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Loader2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<InsightsMetrics | null>(null);
  const [hoveredDay, setHoveredDay] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg(null);

        const [historySessions, allSets, workoutsData] = await Promise.all([
          fetchWorkoutHistory(user.uid),
          fetchAllSetsForUser(user.uid),
          fetchWorkoutsData(user.uid),
        ]);

        const workoutMap = new Map(
          workoutsData.combinedWorkouts.map((w) => [w.id, w.name])
        );

        const calculated = calculateInsights(
          historySessions,
          allSets,
          workoutsData.exercisesList,
          workoutMap
        );

        setMetrics(calculated);
      } catch (err: any) {
        console.error('Failed to load insights metrics:', err);
        setErrorMsg(err.message || 'Failed to aggregate insights.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, authLoading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C0FF00]" />
        <span className="font-mono text-xs text-gray-400 uppercase tracking-widest font-semibold">
          Aggregating 90-Day Progression...
        </span>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-4 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded-xl font-mono">
        <span className="font-bold uppercase tracking-widest text-red-400">ERROR:</span> {errorMsg}
      </div>
    );
  }

  if (!metrics || metrics.totalCompletedSessions === 0) {
    return (
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-8 text-center shadow-xl space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
          <Activity className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">
            No Insights Yet
          </h3>
          <p className="text-gray-400 text-xs font-sans max-w-sm mx-auto mt-1">
            Log your first workouts to uncover your 90-day volume tonnage, consistency heatmap, and time under tension.
          </p>
        </div>
      </div>
    );
  }

  const formatTonnage = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)} t`;
    }
    return `${kg.toLocaleString()} kg`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m ${seconds % 60}s`;
  };

  // Find maximum volume in weekly tonnage for bar chart scaling
  const maxWeeklyVol = Math.max(1, ...metrics.weeklyTonnage.map((w) => w.volumeKg));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C0FF00]" />
            90-Day Training Insights
          </h2>
          <p className="text-gray-400 font-sans text-xs mt-0.5">
            Making the invisible visible: effort, consistency, and volume trajectory.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-[11px] font-mono text-gray-300 self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-[#C0FF00]" />
          Last 90 Days
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Tonnage Moved */}
        <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-[20px] p-4.5 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              90-Day Tonnage
            </span>
            <div className="p-1.5 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00]">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-[#C0FF00] tracking-tight">
              {formatTonnage(metrics.totalVolume90DaysKg)}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 mt-1">
              <span>Lifetime: {formatTonnage(metrics.totalVolumeKg)}</span>
            </div>
          </div>
        </div>

        {/* Total Reps Completed */}
        <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-[20px] p-4.5 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Total Reps
            </span>
            <div className="p-1.5 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white tracking-tight">
              {metrics.totalReps.toLocaleString()}
            </div>
            <div className="text-[10px] font-mono text-gray-400 mt-1">
              Across {metrics.totalCompletedSessions} workouts
            </div>
          </div>
        </div>

        {/* Timed Holds / Tension */}
        <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-[20px] p-4.5 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Timed Tension
            </span>
            <div className="p-1.5 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00]">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white tracking-tight">
              {formatDuration(metrics.totalTimedHoldSeconds)}
            </div>
            <div className="text-[10px] font-mono text-gray-400 mt-1">
              Isometric & timed holds
            </div>
          </div>
        </div>

        {/* Active Work vs Rest */}
        <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-[20px] p-4.5 space-y-2 transition-all">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Active Effort
            </span>
            <div className="p-1.5 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00]">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-display font-black text-white tracking-tight">
              {formatDuration(metrics.totalWorkSeconds)}
            </div>
            <div className="text-[10px] font-mono text-gray-400 mt-1">
              Pure lifting/hold duration
            </div>
          </div>
        </div>
      </div>

      {/* 90-Day Consistency Heatmap Grid */}
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-3">
          <div>
            <h3 className="font-display font-black text-base text-white uppercase tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#C0FF00]" />
              90-Day Activity & Consistency Heatmap
            </h3>
            <p className="text-[11px] font-sans text-gray-400 mt-0.5">
              {metrics.sessionsLast90Days} sessions completed in the last 90 days.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 self-start sm:self-auto">
            <span>Rest</span>
            <div className="w-3 h-3 rounded-sm bg-[#1a1a1a] border border-[#333]"></div>
            <div className="w-3 h-3 rounded-sm bg-[#C0FF00]/30"></div>
            <div className="w-3 h-3 rounded-sm bg-[#C0FF00]/70"></div>
            <div className="w-3 h-3 rounded-sm bg-[#C0FF00]"></div>
            <span>Active</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[620px]">
            <div className="grid grid-flow-col grid-rows-7 gap-1.5 pt-2">
              {metrics.heatmapDays.map((day) => {
                let bgClass = 'bg-[#181818] border border-[#282828]';
                if (day.sessionsCount > 0) {
                  if (day.totalVolumeKg > 5000) {
                    bgClass = 'bg-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.3)]';
                  } else if (day.totalVolumeKg > 2000) {
                    bgClass = 'bg-[#a3db00]';
                  } else {
                    bgClass = 'bg-[#C0FF00]/60';
                  }
                }

                return (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-4.5 h-4.5 rounded-sm transition-all cursor-pointer ${bgClass} ${
                      day.isToday ? 'ring-1 ring-white ring-offset-1 ring-offset-black' : ''
                    } hover:scale-125`}
                  />
                );
              })}
            </div>

            {/* Hover details pill */}
            <div className="h-6 mt-3">
              {hoveredDay ? (
                <div className="text-[11px] font-mono text-gray-300 flex items-center gap-2 bg-[#1a1a1a] px-3 py-1 rounded-lg border border-[#333] inline-flex">
                  <span className="text-[#C0FF00] font-bold">{hoveredDay.date}:</span>
                  {hoveredDay.sessionsCount > 0 ? (
                    <span>
                      {hoveredDay.sessionsCount} session(s) •{' '}
                      {hoveredDay.workoutNames.join(', ')} •{' '}
                      <strong className="text-white">{hoveredDay.totalVolumeKg.toLocaleString()} kg moved</strong>
                    </span>
                  ) : (
                    <span className="text-gray-500">Rest / Recovery Day</span>
                  )}
                </div>
              ) : (
                <span className="text-[10px] font-mono text-gray-500">
                  Hover over any tile to view session volume & workout split.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Tonnage Trajectory Chart (Last 8 Weeks) */}
      <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <div>
            <h3 className="font-display font-black text-base text-white uppercase tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#C0FF00]" />
              Weekly Volume Trend (Tonnage)
            </h3>
            <p className="text-[11px] font-sans text-gray-400 mt-0.5">
              Cumulative weekly kilogram volume moved over the last 8 weeks.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-8 gap-2 items-end h-40 pt-4">
          {metrics.weeklyTonnage.map((w, idx) => {
            const heightPercent = maxWeeklyVol > 0 ? Math.max(8, (w.volumeKg / maxWeeklyVol) * 100) : 8;
            const isLatest = idx === metrics.weeklyTonnage.length - 1;

            return (
              <div key={w.weekLabel} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[9px] font-mono text-gray-400 group-hover:text-white transition-colors">
                  {w.volumeKg > 0 ? `${(w.volumeKg / 1000).toFixed(1)}t` : '0t'}
                </span>
                <div className="w-full max-w-[36px] bg-[#1a1a1a] rounded-t-lg overflow-hidden flex flex-col justify-end h-full p-0.5 border border-[#282828]">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isLatest
                        ? 'bg-[#C0FF00] shadow-[0_0_15px_rgba(192,255,0,0.3)]'
                        : 'bg-[#C0FF00]/50 group-hover:bg-[#C0FF00]/80'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-mono font-bold ${isLatest ? 'text-[#C0FF00]' : 'text-gray-500'}`}>
                  {w.weekLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
