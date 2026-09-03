import React, { useState } from 'react';
import { ExerciseProgressionReport } from '../../lib/insightsEngine.ts';
import { Dumbbell, Clock } from 'lucide-react';
import { ProgressionStatsGrid } from './ProgressionStatsGrid.tsx';
import { ProgressionTrajectoryChart } from './ProgressionTrajectoryChart.tsx';

interface ExerciseProgressionCardProps {
  report: ExerciseProgressionReport;
}

export const ExerciseProgressionCard: React.FC<ExerciseProgressionCardProps> = ({ report }) => {
  const isTimed = report.exerciseType === 'timed';
  const isBodyweight = report.isBodyweight;

  const [selectedMetric, setSelectedMetric] = useState<'weight' | '1rm' | 'volume' | 'reps'>(
    isBodyweight ? 'reps' : 'weight'
  );

  const data = report.dataPoints;

  if (data.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 text-center text-gray-500 font-mono text-xs">
        No recorded sets for {report.exerciseName} yet.
      </div>
    );
  }

  const activeDelta = isTimed
    ? 0
    : isBodyweight || selectedMetric === 'reps'
    ? report.repsDeltaPercentage
    : selectedMetric === 'weight'
    ? report.weightDeltaPercentage
    : selectedMetric === '1rm'
    ? report.oneRmDeltaPercentage
    : report.volumeDeltaPercentage;

  return (
    <div className="bg-[#141414] border border-[#222] hover:border-[#333] rounded-[22px] p-4 sm:p-5 space-y-4 transition-all">
      {/* Exercise Title and Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
            {isTimed ? <Clock className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="font-display font-black text-white text-sm sm:text-base tracking-tight uppercase">
              {report.exerciseName}
            </h4>
            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400">
              <span>{data.length} session{data.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{report.totalSetsLogged} sets logged</span>
            </div>
          </div>
        </div>

        {/* Tab switchers */}
        {!isTimed && (
          <div className="flex items-center gap-1 bg-[#0d0d0d] p-1 rounded-xl border border-[#222] self-start sm:self-auto">
            {isBodyweight ? (
              <button
                type="button"
                onClick={() => setSelectedMetric('reps')}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer bg-[#C0FF00] text-black shadow-sm"
              >
                Total Reps
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setSelectedMetric('weight')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    selectedMetric === 'weight'
                      ? 'bg-[#C0FF00] text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Top Weight
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMetric('1rm')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    selectedMetric === '1rm'
                      ? 'bg-[#C0FF00] text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Est. 1RM
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMetric('volume')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all cursor-pointer ${
                    selectedMetric === 'volume'
                      ? 'bg-[#C0FF00] text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Volume
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* PR Highlights & Trajectory Delta Banner */}
      <ProgressionStatsGrid
        report={report}
        data={data}
        isTimed={isTimed}
        isBodyweight={isBodyweight}
        activeDelta={activeDelta}
      />

      {/* Trajectory Sparkline / Bar Chart */}
      <ProgressionTrajectoryChart
        data={data}
        isTimed={isTimed}
        isBodyweight={isBodyweight}
        selectedMetric={selectedMetric}
      />
    </div>
  );
};
