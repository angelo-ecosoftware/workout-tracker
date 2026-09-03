import React from 'react';
import { Clock, ShieldCheck } from 'lucide-react';
import { RestDisciplineMetrics } from '../../lib/insightsEngine.ts';

interface RestPacingCardProps {
  restDiscipline: RestDisciplineMetrics;
}

export const RestPacingCard: React.FC<RestPacingCardProps> = ({ restDiscipline }) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222] pb-3">
        <div>
          <h3 className="font-display font-black text-base text-white uppercase tracking-tight flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#C0FF00]" />
            Rest Interval Discipline & Pacing
          </h3>
          <p className="text-[11px] font-sans text-gray-400 mt-0.5">
            Rest adherence, pacing consistency, and work-to-rest intensity ratio.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-[#333] text-[11px] font-mono text-[#C0FF00] font-bold self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5" />
          {restDiscipline.recordedRestIntervalsCount > 0
            ? `${restDiscipline.adherencePercentage}% Target Adherence`
            : 'Awaiting Assisted Sets'}
        </div>
      </div>

      {restDiscipline.recordedRestIntervalsCount > 0 ? (
        /* Metric Cards Grid */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Average Rest Duration */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-3.5 space-y-1">
            <div className="text-[9px] font-mono uppercase font-bold text-gray-400">Average Rest</div>
            <div className="text-xl font-display font-black text-white">
              {restDiscipline.averageRestSeconds > 0
                ? `${restDiscipline.averageRestSeconds}s`
                : 'N/A'}
            </div>
            <div className="text-[9px] font-mono text-gray-500">Per completed set</div>
          </div>

          {/* On-Time Intervals Count */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-3.5 space-y-1">
            <div className="text-[9px] font-mono uppercase font-bold text-gray-400">On-Time Pace</div>
            <div className="text-xl font-display font-black text-emerald-400">
              {restDiscipline.onTimeCount}{' '}
              <span className="text-xs font-mono font-normal text-gray-400">
                / {restDiscipline.recordedRestIntervalsCount}
              </span>
            </div>
            <div className="text-[9px] font-mono text-gray-500">Within target window</div>
          </div>

          {/* Work to Rest Ratio */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-3.5 space-y-1">
            <div className="text-[9px] font-mono uppercase font-bold text-gray-400">Work : Rest Ratio</div>
            <div className="text-xl font-display font-black text-[#C0FF00]">
              1 : {restDiscipline.workToRestRatio > 0 ? (1 / restDiscipline.workToRestRatio).toFixed(1) : '1.0'}
            </div>
            <div className="text-[9px] font-mono text-gray-500">Effort vs. downtime</div>
          </div>

          {/* Over / Under Rest Breakdown */}
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-3.5 space-y-1">
            <div className="text-[9px] font-mono uppercase font-bold text-gray-400">Pacing Bias</div>
            <div className="text-sm font-display font-black text-white flex items-center gap-1.5 mt-1">
              <span className="text-amber-400">{restDiscipline.overRestCount} over</span>
              <span className="text-gray-600">•</span>
              <span className="text-blue-400">{restDiscipline.underRestCount} rushed</span>
            </div>
            <div className="text-[9px] font-mono text-gray-500">Outside target zone</div>
          </div>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-5 text-center space-y-1.5">
          <div className="text-xs font-display font-bold text-gray-300 uppercase">
            No Assisted Rest Intervals Logged Yet
          </div>
          <p className="text-[11px] font-sans text-gray-400 max-w-md mx-auto">
            Your previous workouts were logged before assisted timer tracking or in standard manual mode. As you complete sets with the assisted rest timer active, your live rest adherence and pacing metrics will appear here.
          </p>
        </div>
      )}
    </div>
  );
};
