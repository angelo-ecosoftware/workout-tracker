import React from 'react';
import { Moon, BatteryCharging } from 'lucide-react';

interface PreWorkoutReadinessCardProps {
  sleepHours: number | '';
  energyScore: number | '';
  onSleepHoursChange: (val: number | '') => void;
  onEnergyScoreChange: (val: number | '') => void;
}

export const PreWorkoutReadinessCard: React.FC<PreWorkoutReadinessCardProps> = ({
  sleepHours,
  energyScore,
  onSleepHoursChange,
  onEnergyScoreChange,
}) => {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
          <BatteryCharging className="w-4 h-4" />
        </div>
        <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
          Daily Readiness & Biomarkers
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Sleep Hours */}
        <div>
          <label className="text-xs font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
            <Moon className="w-3.5 h-3.5 text-blue-400" />
            Sleep Duration (Hours)
          </label>
          <div className="flex gap-2">
            {[6, 7, 7.5, 8, 9].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onSleepHoursChange(val)}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-colors ${
                  sleepHours === val
                    ? 'bg-[#C0FF00] text-black shadow-md shadow-[#C0FF00]/10'
                    : 'bg-[#181818] text-gray-300 hover:bg-[#222] border border-[#282828]'
                }`}
              >
                {val}h
              </button>
            ))}
          </div>
        </div>

        {/* Energy & Readiness Score */}
        <div>
          <label className="text-xs font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            Energy / Readiness (1 - 5)
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onEnergyScoreChange(val)}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-colors ${
                  energyScore === val
                    ? 'bg-emerald-400 text-black shadow-md shadow-emerald-400/10'
                    : 'bg-[#181818] text-gray-300 hover:bg-[#222] border border-[#282828]'
                }`}
              >
                {val}★
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
