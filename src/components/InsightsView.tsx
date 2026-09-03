import React from 'react';
import { useInsightsData } from '../hooks/useInsightsData.ts';
import { InsightsSummaryCards } from './insights/InsightsSummaryCards.tsx';
import { InsightsHeatmapCard } from './insights/InsightsHeatmapCard.tsx';
import { VolumeProgressionChart } from './insights/VolumeProgressionChart.tsx';
import { RestDisciplineCard } from './insights/RestDisciplineCard.tsx';
import { BodyMetricsCard } from './insights/BodyMetricsCard.tsx';
import { ExerciseProgressionCard } from './ExerciseProgressionCard.tsx';
import { Sparkles, Activity, Loader2, Dumbbell, ChevronDown } from 'lucide-react';

export const InsightsView: React.FC = () => {
  const {
    loading,
    errorMsg,
    metrics,
    userMetrics,
    bodyLogs,
    exercisesList,
    selectedExerciseId,
    exerciseReport,
    handleSelectExercise,
  } = useInsightsData();

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

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header */}
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
        {metrics.favoriteWorkoutName && (
          <div className="text-xs font-mono text-gray-400 bg-[#161616] px-3 py-1.5 rounded-xl border border-[#222]">
            Top Split:{' '}
            <span className="text-[#C0FF00] font-bold">{metrics.favoriteWorkoutName}</span>
          </div>
        )}
      </div>

      {/* 2. Top Summary KPI Cards */}
      <InsightsSummaryCards
        stats={{
          totalWorkouts: metrics.totalCompletedSessions,
          totalVolumeKg: metrics.totalVolumeKg,
          totalSets: metrics.totalReps,
          totalReps: metrics.totalReps,
        }}
        streakCount={metrics.currentStreakWeeks}
      />

      {/* 3. Consistency Heatmap */}
      <InsightsHeatmapCard heatmapDays={metrics.heatmapDays} />

      {/* 4. Weekly Tonnage & Volume Progression */}
      <VolumeProgressionChart
        weeklyTonnage={metrics.weeklyTonnage}
        totalVolumeKg={metrics.totalVolume90DaysKg}
      />

      {/* 5. Rest Interval Discipline & Body Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RestDisciplineCard
          restDiscipline={metrics.restDiscipline}
          totalWorkSeconds={metrics.totalWorkSeconds}
        />
        <BodyMetricsCard userMetrics={userMetrics} bodyLogs={bodyLogs} />
      </div>

      {/* 6. Per-Exercise Progression Deep-Dive */}
      <div className="bg-[#111111] border border-[#222222] rounded-[24px] p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-[#C0FF00]" />
            <h3 className="font-display font-black text-sm uppercase text-white tracking-wide">
              Exercise Progression Deep Dive
            </h3>
          </div>

          {/* Exercise Selector */}
          <div className="relative">
            <select
              value={selectedExerciseId || ''}
              onChange={(e) => handleSelectExercise(e.target.value)}
              className="appearance-none bg-[#181818] border border-[#333] hover:border-[#C0FF00]/40 rounded-xl px-4 py-2 pr-9 text-xs font-mono text-white focus:outline-none focus:border-[#C0FF00] cursor-pointer"
            >
              {exercisesList.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {exerciseReport ? (
          <ExerciseProgressionCard report={exerciseReport} />
        ) : (
          <div className="text-xs text-gray-500 font-mono py-8 text-center">
            Select an exercise with recorded sessions to inspect load progression.
          </div>
        )}
      </div>
    </div>
  );
};
