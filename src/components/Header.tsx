import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Dumbbell, Settings, User } from 'lucide-react';
import { SettingsModal } from './SettingsModal.tsx';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <header className="border-b border-[#222] bg-[#111] px-4 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C0FF00] flex items-center justify-center text-black shadow-[0_0_15px_rgba(192,255,0,0.2)]">
              <Dumbbell className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <h1 className="font-display font-black italic text-base tracking-tight text-white leading-none uppercase">
                WORKOUT <span className="text-[#C0FF00]">TRACKER</span>
              </h1>
              <p className="font-sans text-[9px] uppercase tracking-wider text-gray-500 mt-1 leading-none font-semibold">
                Powering consistent progression
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#222] rounded-xl">
              {user.photoURL ? (
                <img 
                  referrerPolicy="no-referrer"
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'} 
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className="font-mono text-xs font-semibold text-gray-300 max-w-[120px] truncate uppercase tracking-tight">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="p-2 border border-[#333] hover:border-[#555] hover:bg-neutral-900 rounded-xl text-gray-400 transition-all duration-200 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};
