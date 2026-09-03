import React, { useState } from 'react';
import { Calendar, Info, X } from 'lucide-react';
import { HeatmapDay } from '../../lib/insightsEngine.ts';

interface InsightsHeatmapCardProps {
  heatmapDays: HeatmapDay[];
}

export const InsightsHeatmapCard: React.FC<InsightsHeatmapCardProps> = ({ heatmapDays }) => {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);
  const [activeInfoKey, setActiveInfoKey] = useState<string | null>(null);

  const getHeatmapColor = (sessionsCount: number, volumeKg: number) => {
    if (sessionsCount === 0) return 'bg-[#181818] border-[#252525] hover:border-[#383838]';
    if (volumeKg > 10000 || sessionsCount > 1) {
      return 'bg-[#C0FF00] border-[#C0FF00] text-black shadow-[0_0_12px_rgba(192,255,0,0.5)]';
    }
    if (volumeKg > 5000) {
      return 'bg-[#8ec700] border-[#8ec700] text-black shadow-[0_0_8px_rgba(142,199,0,0.4)]';
    }
    return 'bg-[#567a00] border-[#567a00] text-white';
  };

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-[24px] p-5 sm:p-6 shadow-xl relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#C0FF00]" />
          <h3 className="font-display font-black text-sm uppercase text-white tracking-wide">
            90-Day Consistency Heatmap
          </h3>
          <button
            type="button"
            onClick={() => setActiveInfoKey(activeInfoKey === 'heatmap' ? null : 'heatmap')}
            className="text-gray-500 hover:text-gray-300 p-0.5 rounded cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-500">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#181818] border border-[#252525]"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#567a00]"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#8ec700]"></div>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#C0FF00]"></div>
          <span>More</span>
        </div>
      </div>

      {activeInfoKey === 'heatmap' && (
        <div className="mb-4 p-3 bg-[#181818] border border-[#262626] rounded-xl text-xs text-gray-300 font-sans flex items-start justify-between gap-2">
          <p>
            Visualizes every single workout completed over the last 90 calendar days. Brighter cells indicate higher tonnage moved.
          </p>
          <button
            type="button"
            onClick={() => setActiveInfoKey(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Grid: 7 rows (days of week) */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[580px]">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5">
            {heatmapDays.map((day) => (
              <div
                key={day.date}
                onMouseEnter={() => setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border transition-transform duration-150 cursor-pointer ${getHeatmapColor(
                  day.sessionsCount,
                  day.totalVolumeKg
                )} ${day.isToday ? 'ring-1 ring-white/60' : ''} hover:scale-125 hover:z-10`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      <div className="min-h-[38px] mt-3 pt-3 border-t border-[#1c1c1c] flex items-center justify-between text-xs font-mono text-gray-400">
        {hoveredDay ? (
          <div>
            <span className="text-white font-bold">{hoveredDay.date}</span>: {hoveredDay.sessionsCount} session(s)
            {hoveredDay.sessionsCount > 0 && (
              <span className="text-[#C0FF00] ml-2">
                ({hoveredDay.totalVolumeKg.toLocaleString()} kg moved • {hoveredDay.workoutNames.join(', ')})
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-600">Hover or tap on any calendar day to inspect session volume.</span>
        )}
      </div>
    </div>
  );
};
