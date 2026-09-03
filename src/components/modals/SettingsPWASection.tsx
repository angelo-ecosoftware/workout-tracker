import React from 'react';
import { Smartphone, Share2 } from 'lucide-react';

interface SettingsPWASectionProps {
  isMobile: boolean;
  isStandalone: boolean;
  showIOSGuide: boolean;
  setShowIOSGuide: (val: boolean) => void;
  onInstallApp: () => void;
}

export const SettingsPWASection: React.FC<SettingsPWASectionProps> = ({
  isMobile,
  isStandalone,
  showIOSGuide,
  setShowIOSGuide,
  onInstallApp,
}) => {
  if (!isMobile || isStandalone) return null;

  return (
    <>
      <button
        onClick={onInstallApp}
        className="flex items-center justify-between gap-3 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black shrink-0 transition-colors">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-white truncate">
              Install / Download App
            </div>
            <div className="text-[11px] text-gray-500 truncate">
              Fast offline & home screen access
            </div>
          </div>
        </div>
        <div className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider shrink-0 bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded group-hover:bg-[#C0FF00] group-hover:text-black transition-colors">
          Install
        </div>
      </button>

      {/* iOS Install Instruction Banner */}
      {showIOSGuide && (
        <div className="p-2.5 bg-[#161616] border border-[#333] rounded-xl text-[11px] space-y-1.5 text-gray-300">
          <div className="flex items-center justify-between font-bold text-white uppercase font-mono tracking-wider text-[10px]">
            <span className="flex items-center gap-1.5 text-[#C0FF00]">
              <Share2 className="w-3 h-3" /> iOS Safari Installation
            </span>
            <button onClick={() => setShowIOSGuide(false)} className="text-gray-500 hover:text-white cursor-pointer">
              ✕
            </button>
          </div>
          <ol className="list-decimal list-inside space-y-0.5 text-gray-400 pl-1">
            <li>
              Tap <strong className="text-white">Share</strong> in Safari's bottom toolbar (
              <span className="text-[#C0FF00]">⎋</span>).
            </li>
            <li>
              Tap <strong className="text-white">"Add to Home Screen"</strong> (
              <span className="text-[#C0FF00]">⊕</span>).
            </li>
            <li>
              Tap <strong className="text-white">"Add"</strong> at top right.
            </li>
          </ol>
        </div>
      )}
    </>
  );
};
