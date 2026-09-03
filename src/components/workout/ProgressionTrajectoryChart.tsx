import React, { useState } from 'react';
import { ExerciseSessionDataPoint } from '../../lib/insightsEngine.ts';

interface ProgressionTrajectoryChartProps {
  data: ExerciseSessionDataPoint[];
  isTimed: boolean;
  isBodyweight: boolean;
  selectedMetric: 'weight' | '1rm' | 'volume' | 'reps';
}

export const ProgressionTrajectoryChart: React.FC<ProgressionTrajectoryChartProps> = ({
  data,
  isTimed,
  isBodyweight,
  selectedMetric,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ExerciseSessionDataPoint | null>(null);

  // Calculate chart bounds based on active metric
  const getPointValue = (p: ExerciseSessionDataPoint) => {
    if (isTimed) return p.maxHoldDurationSeconds;
    if (isBodyweight || selectedMetric === 'reps') return p.totalReps;
    if (selectedMetric === 'weight') return p.maxWeightKg;
    if (selectedMetric === '1rm') return p.estimated1RMKg;
    return p.totalVolumeKg;
  };

  const values = data.map(getPointValue);
  const maxVal = Math.max(...values);

  return (
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
  );
};
