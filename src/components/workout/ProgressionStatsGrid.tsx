import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ExerciseProgressionReport, ExerciseSessionDataPoint } from '../../lib/insightsEngine.ts';

interface ProgressionStatsGridProps {
  report: ExerciseProgressionReport;
  data: ExerciseSessionDataPoint[];
  isTimed: boolean;
  isBodyweight: boolean;
  activeDelta: number;
}

export const ProgressionStatsGrid: React.FC<ProgressionStatsGridProps> = ({
  report,
  data,
  isTimed,
  isBodyweight,
  activeDelta,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {/* All-time Top Weight or Max Reps in a Single Session */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-2.5">
        <div className="text-[9px] font-mono uppercase font-bold text-gray-400">
          {isTimed ? 'All-Time PR' : isBodyweight ? 'Session PR' : 'All-Time PR'}
        </div>
        <div className="text-base font-display font-black text-[#C0FF00] mt-0.5">
          {isTimed
            ? `${report.allTimePrHoldSeconds}s`
            : isBodyweight
            ? `${report.allTimePrTotalReps} reps`
            : `${report.allTimePrWeightKg} kg`}
        </div>
        <div className="text-[9px] font-mono text-gray-500">
          {isTimed ? 'Max hold' : isBodyweight ? 'Most reps/session' : 'Heaviest lift'}
        </div>
      </div>

      {/* All-Time 1RM (or Total Reps if timed/bodyweight) */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-2.5">
        <div className="text-[9px] font-mono uppercase font-bold text-gray-400">
          {isTimed ? 'Hold Sets' : isBodyweight ? 'Total Volume' : 'Estimated 1RM'}
        </div>
        <div className="text-base font-display font-black text-white mt-0.5">
          {isTimed
            ? `${report.totalSetsLogged}`
            : isBodyweight
            ? `${data.reduce((acc, d) => acc + d.totalReps, 0)} reps`
            : `${report.allTimePr1RMKg} kg`}
        </div>
        <div className="text-[9px] font-mono text-gray-500">
          {isTimed ? 'Logged' : isBodyweight ? 'Lifetime reps' : 'Theoretical max'}
        </div>
      </div>

      {/* All-Time Session Volume or Best Single Set */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-2.5">
        <div className="text-[9px] font-mono uppercase font-bold text-gray-400">
          {isBodyweight ? 'Best Set' : 'Max Session Vol'}
        </div>
        <div className="text-base font-display font-black text-white mt-0.5">
          {isTimed
            ? `${report.allTimePrHoldSeconds}s`
            : isBodyweight
            ? `${Math.max(...data.flatMap((d) => d.sets.map((s) => s.reps)), 0)} reps`
            : `${report.allTimePrVolumeKg.toLocaleString()} kg`}
        </div>
        <div className="text-[9px] font-mono text-gray-500">
          {isBodyweight ? 'Single set max' : 'Single workout'}
        </div>
      </div>

      {/* Trajectory Growth Delta */}
      <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-2.5 flex flex-col justify-between">
        <div className="text-[9px] font-mono uppercase font-bold text-gray-400">Progression</div>
        <div className="flex items-center gap-1 mt-0.5">
          {activeDelta > 0 ? (
            <span className="text-emerald-400 font-display font-black text-sm flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{activeDelta}%
            </span>
          ) : activeDelta < 0 ? (
            <span className="text-amber-400 font-display font-black text-sm flex items-center gap-0.5">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {activeDelta}%
            </span>
          ) : (
            <span className="text-gray-400 font-display font-black text-sm">Baseline</span>
          )}
        </div>
        <div className="text-[9px] font-mono text-gray-500">Since 1st workout</div>
      </div>
    </div>
  );
};
