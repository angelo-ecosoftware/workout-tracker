import React from 'react';
import { Dumbbell, Layers, Timer, Flame, Info, X } from 'lucide-react';
import { InsightsMetrics } from '../../lib/insightsEngine.ts';

interface InsightsHeroMetricsProps {
  metrics: InsightsMetrics;
  activeInfoKey: string | null;
  onToggleInfoKey: (key: string) => void;
  onCloseInfoKey: () => void;
  formatKg: (kg: number) => string;
  formatDuration: (seconds: number) => string;
}

export const InsightsHeroMetrics: React.FC<InsightsHeroMetricsProps> = ({
  metrics,
  activeInfoKey,
  onToggleInfoKey,
  onCloseInfoKey,
  formatKg,
  formatDuration,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total Tonnage Moved */}
      <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-[20px] p-4 space-y-2 transition-all relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                90-Day Volume
              </span>
              <div className="relative inline-flex items-center group/info">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInfoKey('volume');
                  }}
                  className="text-gray-500 hover:text-[#C0FF00] p-0.5 rounded-full transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Information about 90-Day Volume"
                >
                  <Info className="w-2.5 h-2.5" />
                </button>

                {/* Info popover */}
                <div
                  className={`absolute z-30 bottom-full left-0 w-60 sm:w-72 mb-2 p-3 bg-[#181818] border border-[#333] rounded-xl text-left shadow-2xl transition-all duration-150 pointer-events-none ${
                    activeInfoKey === 'volume'
                      ? '!opacity-100 !scale-100 !pointer-events-auto'
                      : 'opacity-0 scale-95 md:group-hover/info:opacity-100 md:group-hover/info:scale-100 md:group-hover/info:pointer-events-auto'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#282828]">
                    <span className="text-[11px] font-display font-black text-[#C0FF00] uppercase tracking-tight">
                      90-Day Volume (Tonnage)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseInfoKey();
                      }}
                      className="md:hidden text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-sans mb-1.5">
                    <strong className="text-white font-medium">What it is:</strong> The sum of (weight × reps) across every completed set in the last 90 days.
                  </p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    <strong className="text-white font-medium">Why it matters:</strong> Volume load is the primary driver of muscle hypertrophy and progressive overload. Tracking tonnage ensures your muscular workload increases over training cycles.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00] shrink-0">
            <Dumbbell className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-display font-black text-[#C0FF00] tracking-tight">
            {formatKg(metrics.totalVolume90DaysKg)}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400 mt-1">
            <span>Lifetime: {formatKg(metrics.totalVolumeKg)}</span>
          </div>
        </div>
      </div>

      {/* Total Reps Completed */}
      <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-[20px] p-4 space-y-2 transition-all relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Total Reps
              </span>
              <div className="relative inline-flex items-center group/info">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInfoKey('reps');
                  }}
                  className="text-gray-500 hover:text-[#C0FF00] p-0.5 rounded-full transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Information about Total Reps"
                >
                  <Info className="w-2.5 h-2.5" />
                </button>

                <div
                  className={`absolute z-30 bottom-full right-0 sm:right-auto sm:left-0 w-60 sm:w-72 mb-2 p-3 bg-[#181818] border border-[#333] rounded-xl text-left shadow-2xl transition-all duration-150 pointer-events-none ${
                    activeInfoKey === 'reps'
                      ? '!opacity-100 !scale-100 !pointer-events-auto'
                      : 'opacity-0 scale-95 md:group-hover/info:opacity-100 md:group-hover/info:scale-100 md:group-hover/info:pointer-events-auto'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#282828]">
                    <span className="text-[11px] font-display font-black text-[#C0FF00] uppercase tracking-tight">
                      Total Repetitions
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseInfoKey();
                      }}
                      className="md:hidden text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-sans mb-1.5">
                    <strong className="text-white font-medium">What it is:</strong> The absolute count of completed repetitions across all logged sets.
                  </p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    <strong className="text-white font-medium">Why it matters:</strong> Measures movement quality volume and neuromuscular repetitions accumulated, reflecting density and stamina build-up.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00] shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-display font-black text-white tracking-tight">
            {metrics.totalReps.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-1">
            Across {metrics.totalCompletedSessions} workouts
          </div>
        </div>
      </div>

      {/* Timed Holds / Tension */}
      <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-[20px] p-4 space-y-2 transition-all relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Timed Tension
              </span>
              <div className="relative inline-flex items-center group/info">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInfoKey('tension');
                  }}
                  className="text-gray-500 hover:text-[#C0FF00] p-0.5 rounded-full transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Information about Timed Tension"
                >
                  <Info className="w-2.5 h-2.5" />
                </button>

                <div
                  className={`absolute z-30 bottom-full left-0 w-60 sm:w-72 mb-2 p-3 bg-[#181818] border border-[#333] rounded-xl text-left shadow-2xl transition-all duration-150 pointer-events-none ${
                    activeInfoKey === 'tension'
                      ? '!opacity-100 !scale-100 !pointer-events-auto'
                      : 'opacity-0 scale-95 md:group-hover/info:opacity-100 md:group-hover/info:scale-100 md:group-hover/info:pointer-events-auto'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#282828]">
                    <span className="text-[11px] font-display font-black text-[#C0FF00] uppercase tracking-tight">
                      Timed Tension (TUT)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseInfoKey();
                      }}
                      className="md:hidden text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-sans mb-1.5">
                    <strong className="text-white font-medium">What it is:</strong> Time spent in static isometric holds (planks, dead hangs, paused holds).
                  </p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    <strong className="text-white font-medium">Why it matters:</strong> Builds tendon strength, core stability, and deep muscle recruitment without requiring joint movement.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00] shrink-0">
            <Timer className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-display font-black text-white tracking-tight">
            {formatDuration(metrics.totalTimedHoldSeconds)}
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-1">
            Isometric & timed holds
          </div>
        </div>
      </div>

      {/* Active Work vs Rest */}
      <div className="bg-[#111] border border-[#222] hover:border-[#333] rounded-[20px] p-4 space-y-2 transition-all relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-mono text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Active Effort
              </span>
              <div className="relative inline-flex items-center group/info">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleInfoKey('effort');
                  }}
                  className="text-gray-500 hover:text-[#C0FF00] p-0.5 rounded-full transition-colors focus:outline-none flex items-center justify-center"
                  aria-label="Information about Active Effort"
                >
                  <Info className="w-2.5 h-2.5" />
                </button>

                <div
                  className={`absolute z-30 bottom-full right-0 w-60 sm:w-72 mb-2 p-3 bg-[#181818] border border-[#333] rounded-xl text-left shadow-2xl transition-all duration-150 pointer-events-none ${
                    activeInfoKey === 'effort'
                      ? '!opacity-100 !scale-100 !pointer-events-auto'
                      : 'opacity-0 scale-95 md:group-hover/info:opacity-100 md:group-hover/info:scale-100 md:group-hover/info:pointer-events-auto'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#282828]">
                    <span className="text-[11px] font-display font-black text-[#C0FF00] uppercase tracking-tight">
                      Active Effort
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseInfoKey();
                      }}
                      className="md:hidden text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-sans mb-1.5">
                    <strong className="text-white font-medium">What it is:</strong> Exact duration of active execution intervals (excluding rest periods).
                  </p>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                    <strong className="text-white font-medium">Why it matters:</strong> Distinguishes true physical work from gym downtime, giving you an accurate measurement of training density and intensity.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-1.5 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00] shrink-0">
            <Flame className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-display font-black text-white tracking-tight">
            {formatDuration(metrics.totalWorkSeconds)}
          </div>
          <div className="text-[10px] font-mono text-gray-400 mt-1">
            Pure lifting/hold duration
          </div>
        </div>
      </div>
    </div>
  );
};
