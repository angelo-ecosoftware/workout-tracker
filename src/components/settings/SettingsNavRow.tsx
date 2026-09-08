import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SettingsNavRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
  ariaLabel?: string;
}

/**
 * High-contrast, tactile navigation item for Settings Home.
 * Enforces >=44px touch targets and clear visual hierarchy.
 */
export const SettingsNavRow: React.FC<SettingsNavRowProps> = ({
  icon,
  title,
  subtitle,
  badge,
  onClick,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || title}
      className="flex items-center justify-between gap-3 w-full p-3.5 sm:p-4 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-2xl text-left transition-all group cursor-pointer shadow-sm active:scale-[0.99] min-h-[56px]"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-9 h-9 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/25 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black shrink-0 transition-colors">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold text-sm sm:text-base text-white tracking-tight group-hover:text-[#C0FF00] transition-colors truncate">
            {title}
          </div>
          <div className="text-xs text-gray-400 font-sans mt-0.5 truncate">
            {subtitle}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-[11px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider bg-[#C0FF00]/10 border border-[#C0FF00]/25 px-2 py-0.5 rounded-md">
            {badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#C0FF00] transition-colors" />
      </div>
    </button>
  );
};

interface SettingsSubpageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  onClose: () => void;
}

export const SettingsSubpageHeader: React.FC<SettingsSubpageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#222] bg-[#111]/95 backdrop-blur sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to settings menu"
          className="p-1.5 -ml-1 hover:bg-[#222] rounded-lg text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-mono text-xs font-bold"
        >
          <span>‹ Back</span>
        </button>
        <div className="min-w-0 border-l border-[#262626] pl-2.5">
          <h2 className="font-display font-black uppercase italic tracking-tight text-white text-sm sm:text-base truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-gray-400 font-sans truncate">{subtitle}</p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close settings"
        className="p-1 hover:bg-[#222] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
      >
        <span className="text-lg leading-none select-none">✕</span>
      </button>
    </div>
  );
};
