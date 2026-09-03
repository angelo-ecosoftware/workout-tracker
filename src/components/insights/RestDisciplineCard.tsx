import React from 'react';
import { Timer, Zap, Clock } from 'lucide-react';
import { RestDisciplineMetrics } from '../../lib/insightsEngine.ts';

interface RestDisciplineCardProps {
  restDiscipline: RestDisciplineMetrics;
  totalWorkSeconds: number;
}

export const RestDisciplineCard: React.FC<RestDisciplineCardProps> = ({
  restDiscipline,
  totalWorkSeconds,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-[24px] p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-purple-400" />
          <h3 className="font-display font-black text-sm uppercase text-white tracking-wide">
            Rest Interval Discipline
          </h3>
        </div>
        <span className="text-xs font-mono text-purple-400 font-bold">
          {restDiscipline.adherencePercentage}% Target Match
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#161616] p-3 rounded-xl border border-[#222]">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Avg Rest</div>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {restDiscipline.averageRestSeconds}s
          </div>
        </div>

        <div className="bg-[#161616] p-3 rounded-xl border border-[#222]">
          <div className="text-[10px] font-mono text-gray-500 uppercase">On-Time Intervals</div>
          <div className="text-lg font-bold font-mono text-[#C0FF00] mt-0.5">
            {restDiscipline.onTimeCount}
          </div>
        </div>

        <div className="bg-[#161616] p-3 rounded-xl border border-[#222]">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Rushed (&lt; Target)</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
            {restDiscipline.underRestCount}
          </div>
        </div>

        <div className="bg-[#161616] p-3 rounded-xl border border-[#222]">
          <div className="text-[10px] font-mono text-gray-500 uppercase">Delayed (&gt; Target)</div>
          <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
            {restDiscipline.overRestCount}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#1a1a1a] text-xs font-mono text-gray-400">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          Total Work Time: {formatDuration(totalWorkSeconds)}
        </span>
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-purple-400" />
          Work-to-Rest: {restDiscipline.workToRestRatio.toFixed(2)}x
        </span>
      </div>
    </div>
  );
};
