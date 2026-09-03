import React from 'react';
import { Timer } from 'lucide-react';

interface SettingsAssistedWorkoutSectionProps {
  assistedTimedWorkout: boolean;
  setAssistedTimedWorkout: (val: boolean) => void;
  restDurationSeconds: number;
  setRestDurationSeconds: (val: number) => void;
}

export const SettingsAssistedWorkoutSection: React.FC<SettingsAssistedWorkoutSectionProps> = ({
  assistedTimedWorkout,
  setAssistedTimedWorkout,
  restDurationSeconds,
  setRestDurationSeconds,
}) => {
  return (
    <div className="p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] rounded-xl flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              assistedTimedWorkout
                ? 'bg-[#C0FF00] text-black shadow-[0_0_10px_rgba(192,255,0,0.3)]'
                : 'bg-[#262626] text-gray-400'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 flex-wrap">
              <span>Assisted Workout</span>
              {assistedTimedWorkout && (
                <span className="text-[8px] font-mono bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/30 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
            <div className="text-[11px] text-gray-500 line-clamp-1">
              1-set focus mode & rest countdown
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAssistedTimedWorkout(!assistedTimedWorkout)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            assistedTimedWorkout ? 'bg-[#C0FF00]' : 'bg-[#333]'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
              assistedTimedWorkout ? 'translate-x-4 bg-black' : 'translate-x-0 bg-gray-400'
            }`}
          />
        </button>
      </div>

      {/* Rest duration timer setting */}
      {assistedTimedWorkout && (
        <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
          <div className="text-[10px] font-mono text-gray-400">
            <span>Rest: </span>
            <span className="text-[#C0FF00] font-bold">{restDurationSeconds}s</span>
          </div>
          <div className="flex items-center gap-1">
            {[5, 30, 60, 90].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setRestDurationSeconds(sec)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer border ${
                  restDurationSeconds === sec
                    ? 'bg-[#C0FF00] text-black border-[#C0FF00]'
                    : 'bg-[#111] text-gray-400 border-[#2b2b2b] hover:text-white'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
