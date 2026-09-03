import React from 'react';
import { SkipForward } from 'lucide-react';

interface AssistedRestTimerCardProps {
  restTimeLeft: number;
  circleRadius: number;
  circleCircumference: number;
  strokeDashoffset: number;
  onSkipRest: () => void;
}

export const AssistedRestTimerCard: React.FC<AssistedRestTimerCardProps> = ({
  restTimeLeft,
  circleRadius,
  circleCircumference,
  strokeDashoffset,
  onSkipRest,
}) => {
  return (
    <div className="bg-[#0c0c0c] border border-[#222] rounded-3xl sm:rounded-[32px] p-6 sm:p-10 text-center flex flex-col items-center justify-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 min-h-[360px] sm:min-h-[420px]">
      {/* Circular Countdown Gauge */}
      <div className="relative w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={circleRadius}
            fill="none"
            stroke="#1c1c1c"
            strokeWidth="10"
          />
          {/* Animated Progress Ring */}
          <circle
            cx="80"
            cy="80"
            r={circleRadius}
            fill="none"
            stroke="#C0FF00"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circleCircumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-[stroke-dashoffset] duration-100 ease-linear"
            style={{
              filter: 'drop-shadow(0 0 12px rgba(192, 255, 0, 0.45))'
            }}
          />
        </svg>

        {/* Time in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-black text-4xl sm:text-5xl text-[#C0FF00] tracking-tight italic font-mono drop-shadow-[0_0_15px_rgba(192,255,0,0.4)]">
            {restTimeLeft}s
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mt-1 font-bold">
            Resting
          </span>
        </div>
      </div>

      {/* Skip Rest Button */}
      <div className="pt-2 w-full max-w-xs">
        <button
          type="button"
          onClick={onSkipRest}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#181818] hover:bg-[#242424] border border-[#333] hover:border-[#C0FF00]/50 rounded-2xl text-xs font-mono font-bold text-white uppercase tracking-wider transition-all cursor-pointer shadow-lg"
        >
          <SkipForward className="w-4 h-4 text-[#C0FF00]" /> Skip Rest
        </button>
      </div>
    </div>
  );
};
