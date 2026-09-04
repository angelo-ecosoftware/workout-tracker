import React from 'react';
import { UserCheck, LogOut, ShieldAlert } from 'lucide-react';

interface CoachViewAsBannerProps {
  athleteName: string;
  onExit: () => void;
}

export const CoachViewAsBanner: React.FC<CoachViewAsBannerProps> = ({
  athleteName,
  onExit,
}) => {
  return (
    <div className="sticky top-0 z-40 bg-[#0e1726] border-b border-[#1e3a8a] text-white px-4 py-2.5 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-lg bg-[#3b82f6]/20 text-[#60a5fa]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-xs font-sans truncate">
            <span className="font-bold text-[#93c5fd] font-display uppercase tracking-wide">
              Coach Inspection Mode:
            </span>{' '}
            <span className="text-gray-200">Viewing as {athleteName} (Read-Only)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-display font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Client View</span>
        </button>
      </div>
    </div>
  );
};
