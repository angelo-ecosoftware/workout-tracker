import React from 'react';
import { Calendar } from 'lucide-react';
import { HeatmapDay } from '../../lib/insightsEngine.ts';

interface InsightsHeatmapCardProps {
  sessionsLast90Days: number;
  heatmapDays: HeatmapDay[];
  hoveredDay: HeatmapDay | null;
  onHoverDay: (day: HeatmapDay | null) => void;
}

export const InsightsHeatmapCard: React.FC<InsightsHeatmapCardProps> = ({
  sessionsLast90Days,
  heatmapDays,
  hoveredDay,
  onHoverDay,
}) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-3">
        <div>
          <h3 className="font-display font-black text-base text-white uppercase tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#C0FF00]" />
            90-Day Activity & Consistency Heatmap
          </h3>
          <p className="text-[11px] font-sans text-gray-400 mt-0.5">
            {sessionsLast90Days} sessions completed in the last 90 days.
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

      {/* Heatmap Grid - Standard Calendar View: Left to Right, Rows = Weeks */}
      <div className="space-y-1.5 pt-1">
        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[9px] font-mono font-bold text-gray-500 uppercase tracking-wider">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Calendar Grid: Left-to-Right by day, Top-to-Bottom by week */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5 max-w-xl mx-auto">
          {heatmapDays.map((day) => {
            let bgClass = 'bg-[#181818] border border-[#282828] hover:border-[#555]';
            if (day.sessionsCount > 0) {
              if (day.totalVolumeKg > 5000) {
                bgClass = 'bg-[#C0FF00] text-black shadow-[0_0_8px_rgba(192,255,0,0.3)] border border-[#C0FF00]';
              } else if (day.totalVolumeKg > 2000) {
                bgClass = 'bg-[#a3db00] text-black border border-[#a3db00]';
              } else {
                bgClass = 'bg-[#C0FF00]/60 text-black border border-[#C0FF00]/40';
              }
            }

            const d = new Date(day.date);
            const dayOfMonth = d.getDate();

            return (
              <div
                key={day.date}
                onMouseEnter={() => onHoverDay(day)}
                onMouseLeave={() => onHoverDay(null)}
                className={`h-7 sm:h-8 rounded-md flex flex-col items-center justify-center transition-all cursor-pointer px-0.5 relative ${bgClass} ${
                  day.isToday ? 'ring-1.5 ring-white font-black' : ''
                } hover:scale-105`}
              >
                <span className={`text-[9px] sm:text-[10px] leading-none font-mono ${day.sessionsCount > 0 ? 'font-black' : 'text-gray-400'}`}>
                  {dayOfMonth}
                </span>
                {day.sessionsCount > 0 && (
                  <span className="text-[7px] leading-tight font-mono font-bold uppercase tracking-tighter truncate max-w-full">
                    {day.totalVolumeKg > 0 ? `${Math.round(day.totalVolumeKg)}kg` : '✓'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Hover details pill */}
        <div className="min-h-[28px] mt-2 flex items-center">
          {hoveredDay ? (
            <div className="text-[11px] font-mono text-gray-300 flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#333] inline-flex flex-wrap">
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
              Hover or tap any date to view workout split and volume moved.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
