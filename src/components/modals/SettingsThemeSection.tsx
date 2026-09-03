import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

export const SettingsThemeSection: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] rounded-xl flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
            {theme === 'light' ? (
              <Sun className="w-3.5 h-3.5" />
            ) : theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5" />
            ) : (
              <Monitor className="w-3.5 h-3.5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-xs sm:text-sm text-white">Theme & Appearance</div>
            <div className="text-[11px] text-gray-500 truncate">Select color scheme</div>
          </div>
        </div>
      </div>

      {/* Segmented Theme Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#262626]">
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
            theme === 'dark'
              ? 'bg-[#C0FF00] text-black border-[#C0FF00] shadow-[0_0_10px_rgba(192,255,0,0.25)]'
              : 'bg-[#111] text-gray-400 border-[#262626] hover:text-white hover:border-[#383838]'
          }`}
        >
          <Moon className="w-3 h-3 shrink-0" />
          <span>Dark</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
            theme === 'light'
              ? 'bg-[#C0FF00] text-black border-[#C0FF00] shadow-[0_0_10px_rgba(192,255,0,0.25)]'
              : 'bg-[#111] text-gray-400 border-[#262626] hover:text-white hover:border-[#383838]'
          }`}
        >
          <Sun className="w-3 h-3 shrink-0" />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all border cursor-pointer ${
            theme === 'system'
              ? 'bg-[#C0FF00] text-black border-[#C0FF00] shadow-[0_0_10px_rgba(192,255,0,0.25)]'
              : 'bg-[#111] text-gray-400 border-[#262626] hover:text-white hover:border-[#383838]'
          }`}
        >
          <Monitor className="w-3 h-3 shrink-0" />
          <span>Auto</span>
        </button>
      </div>
    </div>
  );
};
