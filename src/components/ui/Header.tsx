import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { usePWA } from '../../context/PWAContext.tsx';
import { Dumbbell, Settings, User, WifiOff, RefreshCw } from 'lucide-react';
import { SettingsModal } from '../modals/SettingsModal.tsx';
import { ProfileModal } from '../modals/ProfileModal.tsx';
import { UserMetrics, Workout } from '../../models.ts';
import { initializeUser, fetchWorkoutsData } from '../../lib/supabaseData.ts';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { isOnline, pendingSyncCount, triggerManualSync } = usePWA();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [metrics, setMetrics] = useState<UserMetrics | undefined>(undefined);
  const [routines, setRoutines] = useState<Workout[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load initial user metrics & active routines for frequency calculation
    const loadProfileData = async () => {
      try {
        const profile = await initializeUser(user.id, user.email, user.displayName);
        if (profile) {
          const resolvedWeight = profile.weightKg || profile.metrics?.weight;
          const resolvedHeight = profile.heightCm || profile.metrics?.height;
          const resolvedMetrics: UserMetrics = {
            ...(profile.metrics || {}),
            weight: resolvedWeight,
            height: resolvedHeight,
            dateOfBirth: profile.dateOfBirth || profile.metrics?.dateOfBirth,
            gender: profile.gender || profile.metrics?.gender,
            fitnessLevel: profile.fitnessLevel || profile.metrics?.fitnessLevel,
            trainingLocation: profile.trainingLocation || profile.metrics?.trainingLocation,
          };
          setMetrics(resolvedMetrics);
          localStorage.setItem(`user_metrics_${user.id}`, JSON.stringify(resolvedMetrics));
        } else {
          const cached = localStorage.getItem(`user_metrics_${user.id}`);
          if (cached) setMetrics(JSON.parse(cached));
        }

        const { workoutsList: userRoutines } = await fetchWorkoutsData(user.id);
        setRoutines(userRoutines || []);
      } catch (err) {
        console.warn('Could not load user metrics in header:', err);
      }
    };

    loadProfileData();

    const handleProfileSync = () => {
      loadProfileData();
    };

    window.addEventListener('user_profile_updated', handleProfileSync);
    window.addEventListener('workout_settings_updated', handleProfileSync);

    return () => {
      window.removeEventListener('user_profile_updated', handleProfileSync);
      window.removeEventListener('workout_settings_updated', handleProfileSync);
    };
  }, [user]);

  if (!user) return null;

  const handleSyncClick = async () => {
    setIsSyncing(true);
    await triggerManualSync();
    setTimeout(() => setIsSyncing(false), 800);
  };

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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline indicator badge */}
            {!isOnline && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] uppercase font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Offline Mode</span>
              </div>
            )}

            {/* Desktop User Pill / Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              title="View & Edit Athlete Profile"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#252525] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl transition-all cursor-pointer group"
            >
              {user.photoURL ? (
                <img 
                  referrerPolicy="no-referrer"
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'} 
                  className="w-5 h-5 rounded-full object-cover group-hover:ring-1 group-hover:ring-[#C0FF00]"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#C0FF00]" />
              )}
              <span className="font-mono text-xs font-semibold text-gray-300 max-w-[120px] truncate uppercase tracking-tight group-hover:text-white">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </button>

            {/* Mobile User Icon / Button */}
            <button
              onClick={() => setIsProfileOpen(true)}
              title="View & Edit Athlete Profile"
              className="sm:hidden flex items-center justify-center w-8 h-8 border border-[#333] hover:border-[#C0FF00] bg-[#1a1a1a] rounded-xl cursor-pointer transition-colors"
            >
              {user.photoURL ? (
                <img 
                  referrerPolicy="no-referrer"
                  src={user.photoURL} 
                  alt={user.displayName || 'Profile'} 
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
              className="w-8 h-8 flex items-center justify-center border border-[#333] hover:border-[#555] hover:bg-neutral-900 rounded-xl text-gray-400 transition-all duration-200 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        metrics={metrics}
        routines={routines}
        onMetricsUpdated={(newMetrics) => setMetrics(newMetrics)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};
