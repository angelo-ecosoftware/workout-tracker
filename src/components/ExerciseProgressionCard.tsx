import React, { useState } from 'react';
import { ExerciseProgressionReport, ExerciseSessionDataPoint } from '../lib/insightsEngine.ts';
import {
  TrendingUp,
  Dumbbell,
  Award,
  Zap,
  Calendar,
  Layers,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  X,
  Flame,
} from 'lucide-react';

interface ExerciseProgressionCardProps {
  report: ExerciseProgressionReport;
}

export const ExerciseProgressionCard: React.FC<ExerciseProgressionCardProps> = ({ report }) => {
  const isTimed = report.exerciseType === 'timed';
  const isBodyweight = report.isBodyweight;

  const [selectedMetric, setSelectedMetric] = useState<'weight' | '1rm' | 'volume' | 'reps'>(
    isBodyweight ? 'reps' : 'weight'
  );
  const [hoveredPoint, setHoveredPoint] = useState<ExerciseSessionDataPoint | null>(null);

  const data = report.dataPoints;

  if (data.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 text-center text-gray-500 font-mono text-xs">
        No recorded sets for {report.exerciseName} yet.
      </div>
    );
  }

  // Calculate chart bounds based on active metric
  const getPointValue = (p: ExerciseSessionDataPoint) => {
    if (isTimed) return p.maxHoldDurationSeconds;
    if (isBodyweight || selectedMetric === 'reps') return p.totalReps;
    if (selectedMetric === 'weight') return p.maxWeightKg;
    if (selectedMetric === '1rm') return p.estimated1RMKg;
    return p.totalVolumeKg;
  };

  const values = data.map(getPointValue);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

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

      {/* Trajectory Sparkline / Bar Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400">
          <span>Session Trajectory ({data.length} points)</span>
          <span className="text-gray-500">
            {isTimed
              ? 'Isometric hold duration (seconds)'
              : isBodyweight || selectedMetric === 'reps'
              ? 'Total reps completed per workout'
              : selectedMetric === 'weight'
              ? 'Max weight (kg) per workout'
              : selectedMetric === '1rm'
              ? 'Epley Est. 1RM (kg)'
              : 'Cumulative volume (kg)'}
          </span>
        </div>

        {/* SVG Curve & Bar Chart */}
        <div className="bg-[#0c0c0c] border border-[#1e1e1e] rounded-xl p-3 sm:p-4">
          <div className="flex items-end justify-between gap-1.5 h-32 pt-2">
            {data.map((point, idx) => {
              const val = getPointValue(point);
              const heightPercent = maxVal > 0 ? Math.max(12, Math.round((val / maxVal) * 100)) : 12;
              const isLatest = idx === data.length - 1;
              const isHovered = hoveredPoint?.sessionId === point.sessionId;

              return (
                <div
                  key={point.sessionId}
                  onMouseEnter={() => setHoveredPoint(point)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => setHoveredPoint(hoveredPoint?.sessionId === point.sessionId ? null : point)}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                >
                  {/* Floating tooltip on hover/tap */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 z-20 bg-[#1f1f1f] border border-[#333] shadow-2xl rounded-lg px-2.5 py-1.5 text-center pointer-events-none min-w-[100px] animate-in fade-in zoom-in-95 duration-150">
                      <div className="text-[9px] font-mono font-bold text-gray-400">{point.formattedDate}</div>
                      <div className="text-xs font-display font-black text-[#C0FF00]">
                        {isTimed
                          ? `${val}s hold`
                          : isBodyweight || selectedMetric === 'reps'
                          ? `${val} total reps`
                          : selectedMetric === 'volume'
                          ? `${val.toLocaleString()} kg`
                          : `${val} kg`}
                      </div>
                      <div className="text-[8px] font-mono text-gray-400 mt-0.5">
                        {point.sets.map((s) => (s.weight ? `${s.weight}k×${s.reps}` : `${s.reps}r`)).join(' | ')}
                      </div>
                    </div>
                  )}

                  {/* Value label above bar */}
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono mb-1 transition-colors ${
                      isHovered ? 'text-[#C0FF00] font-bold' : isLatest ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    {isTimed ? `${val}s` : isBodyweight || selectedMetric === 'reps' ? `${val}r` : `${val}`}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[28px] bg-[#161616] rounded-t-md overflow-hidden flex flex-col justify-end h-full p-0.5 border border-[#262626]">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isHovered || isLatest
                          ? 'bg-[#C0FF00] shadow-[0_0_10px_rgba(192,255,0,0.35)]'
                          : 'bg-[#C0FF00]/50 group-hover:bg-[#C0FF00]/80'
                      }`}
                    />
                  </div>

                  {/* Date label under bar */}
                  <span
                    className={`text-[8px] font-mono mt-1.5 truncate max-w-full ${
                      isLatest ? 'text-[#C0FF00] font-bold' : 'text-gray-500'
                    }`}
                  >
                    {point.formattedDate}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detailed Set Breakdown for selected/hovered session */}
          {hoveredPoint && (
            <div className="mt-3 pt-2.5 border-t border-[#1e1e1e] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-[#C0FF00] font-bold">{hoveredPoint.formattedDate}:</span>
                <span>
                  Sets: {hoveredPoint.sets.map((s) => `Set ${s.setNumber}: ${s.weight ? `${s.weight}kg × ` : ''}${s.reps} reps`).join(', ')}
                </span>
              </div>
              <div className="text-gray-400">
                {isBodyweight ? (
                  <>
                    Total Reps: <strong className="text-white">{hoveredPoint.totalReps}</strong> • Best Set:{' '}
                    <strong className="text-white">
                      {Math.max(...hoveredPoint.sets.map((s) => s.reps))} reps
                    </strong>
                  </>
                ) : (
                  <>
                    Est 1RM: <strong className="text-white">{hoveredPoint.estimated1RMKg}kg</strong> • Vol:{' '}
                    <strong className="text-white">{hoveredPoint.totalVolumeKg.toLocaleString()}kg</strong>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
