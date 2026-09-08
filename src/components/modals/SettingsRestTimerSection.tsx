import React from 'react';
import { Timer } from 'lucide-react';

interface SettingsRestTimerSectionProps {
  restDurationSeconds: number;
  setRestDurationSeconds: (val: number) => void;
}

export const SettingsRestTimerSection: React.FC<SettingsRestTimerSectionProps> = ({
  restDurationSeconds,
  setRestDurationSeconds,
}) => {
  return (
    <div className="p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] rounded-xl flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#262626] text-[#C0FF00]">
            <Timer className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 flex-wrap">
              <span>Rest Interval Timer</span>
            </div>
            <div className="text-[11px] text-gray-500 line-clamp-1">
              Rest countdown duration between completed sets
            </div>
          </div>
        </div>
        <span className="text-xs font-mono font-bold text-[#C0FF00] bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded-md">
          {restDurationSeconds}s
        </span>
      </div>

      <div className="pt-2 border-t border-[#262626] flex items-center justify-between">
        <div className="text-[10px] font-mono text-gray-400">
          <span>Target Rest: </span>
          <span className="text-[#C0FF00] font-bold">{restDurationSeconds}s</span>
        </div>
        <div className="flex items-center gap-1">
          {[5, 30, 60, 90, 120].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setRestDurationSeconds(sec)}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
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
    </div>
  );
};
