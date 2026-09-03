import React from 'react';
import { TrendingUp } from 'lucide-react';

export interface WeeklyTonnageItem {
  weekLabel: string;
  volumeKg: number;
}

interface WeeklyVolumeChartProps {
  weeklyTonnage: WeeklyTonnageItem[];
  maxWeeklyVol: number;
}

export const WeeklyVolumeChart: React.FC<WeeklyVolumeChartProps> = ({
  weeklyTonnage,
  maxWeeklyVol,
}) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-[#222] pb-3">
        <div>
          <h3 className="font-display font-black text-base text-white uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#C0FF00]" />
            Weekly Volume Trend (kg)
          </h3>
          <p className="text-[11px] font-sans text-gray-400 mt-0.5">
            Cumulative weekly kilogram volume moved over the last 8 weeks.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-2 items-end h-40 pt-4">
        {weeklyTonnage.map((w, idx) => {
          const heightPercent = maxWeeklyVol > 0 ? Math.max(8, (w.volumeKg / maxWeeklyVol) * 100) : 8;
          const isLatest = idx === weeklyTonnage.length - 1;

          return (
            <div key={w.weekLabel} className="flex flex-col items-center gap-2 h-full justify-end group">
              <span className="text-[9px] font-mono text-gray-400 group-hover:text-white transition-colors">
                {w.volumeKg > 0 ? `${w.volumeKg.toLocaleString()}kg` : '0kg'}
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
  );
};
