import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { usePWA } from '../../context/PWAContext.tsx';
import { X, LogOut, Loader2, Layers, UserCheck } from 'lucide-react';
import { exportAllLogs, importAllLogs, fetchWorkoutsData, saveWorkoutsAndExercises } from '../../lib/supabaseData.ts';
import { RoutineEditorModal } from './RoutineEditorModal.tsx';
import { Workout, Exercise } from '../../models.ts';
import { SettingsThemeSection } from './SettingsThemeSection.tsx';
import { SettingsAssistedWorkoutSection } from './SettingsAssistedWorkoutSection.tsx';
import { SettingsBackupSection } from './SettingsBackupSection.tsx';
import { SettingsPWASection } from './SettingsPWASection.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, logout, switchAccount } = useAuth();
  const { installPrompt, setInstallPrompt, isStandalone, isIOS, isMobile } = usePWA();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);
  const [userWorkouts, setUserWorkouts] = useState<(Workout & { exercises: Exercise[] })[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  // Assisted Timed Workout settings
  const [assistedTimedWorkout, setAssistedTimedWorkout] = useState<boolean>(() => {
    return localStorage.getItem('setting_assisted_timed_workout') === 'true';
  });
  const [restDurationSeconds, setRestDurationSeconds] = useState<number>(() => {
    const val = localStorage.getItem('setting_rest_duration_seconds');
    return val ? parseInt(val, 10) : 5; // Default short 5s for quick verification
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('setting_assisted_timed_workout', assistedTimedWorkout ? 'true' : 'false');
    window.dispatchEvent(new Event('workout_settings_updated'));
  }, [assistedTimedWorkout]);

  useEffect(() => {
    localStorage.setItem('setting_rest_duration_seconds', restDurationSeconds.toString());
    window.dispatchEvent(new Event('workout_settings_updated'));
  }, [restDurationSeconds]);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleOpenRoutineEditor = async () => {
    setLoadingWorkouts(true);
    try {
      const data = await fetchWorkoutsData(user.uid);
      setUserWorkouts(data.combinedWorkouts);
      setIsRoutineEditorOpen(true);
    } catch (err) {
      console.error('Failed to load routines for editing:', err);
      alert('Could not load routine split. Please try again.');
    } finally {
      setLoadingWorkouts(false);
    }
  };

  const handleSaveRoutines = async (updatedWorkouts: (Workout & { exercises: Exercise[] })[]) => {
    await saveWorkoutsAndExercises(user.uid, updatedWorkouts);
    setUserWorkouts(updatedWorkouts);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleInstallApp = async () => {
    if (isStandalone) {
      alert('App is already installed and running in app mode.');
      return;
    }

    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          setInstallPrompt(null);
        }
      } catch (err) {
        console.error('Failed to prompt install:', err);
      }
      return;
    }

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    alert(
      'To install the app on your device:\n\n' +
        '1. Open the browser menu (3 dots in Chrome/Edge/Brave)\n' +
        "2. Tap 'Install app' or 'Add to Home screen'\n" +
        '3. The app icon will appear directly on your home screen!'
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllLogs(user.uid);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const rawName = user.displayName || user.email?.split('@')[0] || 'user';
      const cleanUsername = rawName
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .trim();
      a.download = `${cleanUsername}_data.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to save complete backup:', e);
      alert('Failed to save complete backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importAllLogs(user.uid, data);
      alert('All routines, exercises, and workout history restored successfully!');
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Failed to restore data file:', err);
      alert('Failed to restore data file. Please ensure it is a valid backup JSON file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-sm sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-150"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#222] bg-[#111]/95 backdrop-blur sticky top-0 z-10 shrink-0">
            <h2 className="font-display font-black uppercase italic tracking-tight text-white text-sm sm:text-base">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#222] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-2.5 overflow-y-auto overscroll-contain flex-1">
            {/* Theme Selector */}
            <SettingsThemeSection />

            {/* Assisted Timed Workout Toggle & Timer Setting */}
            <SettingsAssistedWorkoutSection
              assistedTimedWorkout={assistedTimedWorkout}
              setAssistedTimedWorkout={setAssistedTimedWorkout}
              restDurationSeconds={restDurationSeconds}
              setRestDurationSeconds={setRestDurationSeconds}
            />

            {/* Edit Routines & Exercises Button */}
            <button
              onClick={handleOpenRoutineEditor}
              disabled={loadingWorkouts}
              className="flex items-center justify-between gap-3 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black shrink-0 transition-colors">
                  {loadingWorkouts ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Layers className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-white truncate">
                    Edit Routines & Exercises
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">
                    Customize days, exercises & targets
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider shrink-0 bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded group-hover:bg-[#C0FF00] group-hover:text-black transition-colors">
                Configure
              </div>
            </button>

            {/* PWA Section */}
            <SettingsPWASection
              isMobile={isMobile}
              isStandalone={isStandalone}
              showIOSGuide={showIOSGuide}
              setShowIOSGuide={setShowIOSGuide}
              onInstallApp={handleInstallApp}
            />

            {/* Backup and Restore Section */}
            <SettingsBackupSection
              isExporting={isExporting}
              isImporting={isImporting}
              onExport={handleExport}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
            />

            <div className="h-px bg-[#222] my-0.5" />

            {/* Switch Google Account */}
            <button
              onClick={async () => {
                onClose();
                await switchAccount();
              }}
              className="flex items-center justify-between gap-3 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black shrink-0 transition-colors">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-white truncate">
                    Switch Account
                  </div>
                  <div className="text-[11px] text-gray-500 truncate">Change Google account</div>
                </div>
              </div>
              <div className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider shrink-0 bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded group-hover:bg-[#C0FF00] group-hover:text-black transition-colors">
                Switch
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex items-center justify-center gap-2 w-full p-2.5 bg-[#1a1a1a] border border-[#222] hover:bg-neutral-900 rounded-xl text-gray-300 transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Routine & Exercise Editor Modal */}
      {isRoutineEditorOpen && (
        <RoutineEditorModal
          isOpen={isRoutineEditorOpen}
          onClose={() => setIsRoutineEditorOpen(false)}
          userId={user.uid}
          workouts={userWorkouts}
          onSaveWorkouts={handleSaveRoutines}
        />
      )}
    </>
  );
};
