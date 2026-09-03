import React from 'react';
import { Activity } from 'lucide-react';

interface VolumeProgressionChartProps {
  weeklyTonnage: Array<{ weekLabel: string; volumeKg: number }>;
  totalVolumeKg: number;
}

export const VolumeProgressionChart: React.FC<VolumeProgressionChartProps> = ({
  weeklyTonnage,
  totalVolumeKg,
}) => {
  const maxWeeklyVol = Math.max(1, ...weeklyTonnage.map((w) => w.volumeKg));

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-[24px] p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="font-display font-black text-sm uppercase text-white tracking-wide">
            Weekly Volume Progression
          </h3>
        </div>
        <span className="text-xs font-mono text-gray-500">
          Total: {totalVolumeKg.toLocaleString()} kg
        </span>
      </div>

      <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-[#222]">
        {weeklyTonnage.map((w, idx) => {
          const heightPercent = Math.max(4, (w.volumeKg / maxWeeklyVol) * 100);
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
              <div className="text-[9px] font-mono text-gray-500 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                {w.volumeKg > 0 ? `${(w.volumeKg / 1000).toFixed(1)}k` : '0'}
              </div>
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  w.volumeKg > 0
                    ? 'bg-gradient-to-t from-emerald-600 to-[#C0FF00] group-hover:brightness-125 shadow-[0_0_12px_rgba(192,255,0,0.2)]'
                    : 'bg-[#1a1a1a]'
                }`}
              />
              <span className="text-[9px] font-mono text-gray-500 truncate w-full text-center">
                {w.weekLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
