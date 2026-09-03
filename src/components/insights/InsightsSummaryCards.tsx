import React from 'react';
import { Flame, Dumbbell, Award, Activity } from 'lucide-react';
import { OverallSummaryStats } from '../../lib/insightsEngine.ts';

interface InsightsSummaryCardsProps {
  stats: OverallSummaryStats;
  streakCount: number;
}

export const InsightsSummaryCards: React.FC<InsightsSummaryCardsProps> = ({
  stats,
  streakCount,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Completed Workouts */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#C0FF00]/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Completed</span>
          <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 flex items-center justify-center text-[#C0FF00]">
            <Dumbbell className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            {stats.totalWorkouts}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">sessions finished</div>
        </div>
      </div>

      {/* 2. Total Cumulative Tonnage */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Total Volume</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            {stats.totalVolumeKg >= 1000
              ? `${(stats.totalVolumeKg / 1000).toFixed(1)}k`
              : stats.totalVolumeKg.toLocaleString()}
            <span className="text-xs text-gray-400 font-normal ml-1">kg</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">iron moved</div>
        </div>
      </div>

      {/* 3. Consistency Streak */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Streak</span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            {streakCount}
            <span className="text-xs text-gray-400 font-normal ml-1">days</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">current momentum</div>
        </div>
      </div>

      {/* 4. Total Sets Recorded */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Total Sets</span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
            {stats.totalSets}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">work sets logged</div>
        </div>
      </div>
    </div>
  );
};
