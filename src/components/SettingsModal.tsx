import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { usePWA } from '../context/PWAContext.tsx';
import { X, Download, Upload, Trash2, LogOut, Loader2, AlertTriangle, Smartphone, Check, Share2, Layers, Timer, Zap, UserCheck } from 'lucide-react';
import { exportAllLogs, deleteAllLogs, importAllLogs, fetchWorkoutsData, saveWorkoutsAndExercises } from '../lib/supabaseData.ts';
import { RoutineEditorModal } from './RoutineEditorModal.tsx';
import { Workout, Exercise } from '../models.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, logout, switchAccount } = useAuth();
  const { installPrompt, setInstallPrompt, isStandalone, isIOS, isMobile } = usePWA();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
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
    // Notify listeners / active components
    window.dispatchEvent(new Event('workout_settings_updated'));
  }, [assistedTimedWorkout]);

  useEffect(() => {
    localStorage.setItem('setting_rest_duration_seconds', restDurationSeconds.toString());
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
    // Reload page or let parent sync
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  const handleInstallApp = async () => {
    if (isStandalone) {
      alert("App is already installed and running in app mode.");
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
        console.error("Failed to prompt install:", err);
      }
      return;
    }

    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    // Android / Chromium fallback guidance if prompt event hasn't fired or was dismissed
    alert(
      "To install the app on your device:\n\n" +
      "1. Open the browser menu (3 dots in Chrome/Edge/Brave)\n" +
      "2. Tap 'Install app' or 'Add to Home screen'\n" +
      "3. The app icon will appear directly on your home screen!"
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
      a.download = `workout_logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export logs:', e);
      alert('Failed to export logs.');
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
      alert('Logs imported successfully!');
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Failed to import logs:', err);
      alert('Failed to import logs. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await deleteAllLogs(user.uid);
      setShowConfirmReset(false);
      onClose();
      // Optionally reload the page to clear state
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset logs:', e);
      alert('Failed to reset logs.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111] border border-[#222] rounded-2xl w-full max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#111]/95 backdrop-blur sticky top-0 z-10 shrink-0">
          <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3.5 sm:p-5 flex flex-col gap-3 overflow-y-auto overscroll-contain flex-1">
          {/* Assisted Timed Workout Toggle */}
          <div className="p-3.5 bg-[#1a1a1a] border border-[#222] rounded-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  assistedTimedWorkout 
                    ? 'bg-[#C0FF00] text-black shadow-[0_0_12px_rgba(192,255,0,0.3)]' 
                    : 'bg-[#262626] text-gray-400'
                }`}>
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    Assisted Timed Workout
                    {assistedTimedWorkout && (
                      <span className="text-[9px] font-mono bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Guided 1-set focus mode with background timing & rest intervals
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssistedTimedWorkout(!assistedTimedWorkout)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  assistedTimedWorkout ? 'bg-[#C0FF00]' : 'bg-[#333]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow ring-0 transition duration-200 ease-in-out ${
                    assistedTimedWorkout ? 'translate-x-5 bg-black' : 'translate-x-0 bg-gray-400'
                  }`}
                />
              </button>
            </div>

            {/* Rest duration timer setting (TODO: Full custom presets) */}
            {assistedTimedWorkout && (
              <div className="pt-2.5 border-t border-[#262626] flex items-center justify-between">
                <div className="text-[11px] font-mono text-gray-400">
                  <span>Rest Interval Timeout: </span>
                  <span className="text-[#C0FF00] font-bold">{restDurationSeconds}s</span>
                </div>
                {/* TODO: Add custom user rest duration slider / presets */}
                <div className="flex items-center gap-1.5">
                  {[5, 30, 60, 90].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setRestDurationSeconds(sec)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer border ${
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

          {/* Edit Routines & Exercises */}
          <button
            onClick={handleOpenRoutineEditor}
            disabled={loadingWorkouts}
            className="flex items-center justify-between w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black transition-colors">
                {loadingWorkouts ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-bold text-sm text-white">Edit Routines & Exercises</div>
                <div className="text-xs text-gray-500">Add/remove days, customize exercises & rep/set targets</div>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-[#C0FF00] uppercase tracking-wider">
              Configure
            </div>
          </button>

          {/* PWA Install Button - Mobile only (hidden on desktop) */}
          {isMobile && (
            <button
              onClick={handleInstallApp}
              className="flex items-center justify-between w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black transition-colors">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    Install / Download App
                    {isStandalone && (
                      <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                        <Check className="w-3 h-3" /> Installed
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isStandalone ? "Running in standalone app mode" : "Download to your home screen for offline & fast access"}
                  </div>
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-[#C0FF00] uppercase tracking-wider">
                {isStandalone ? "Active" : "Install"}
              </div>
            </button>
          )}

          {/* iOS Install Instruction Banner */}
          {isMobile && showIOSGuide && (
            <div className="p-3.5 bg-[#161616] border border-[#333] rounded-xl text-xs space-y-2 text-gray-300">
              <div className="flex items-center justify-between font-bold text-white uppercase font-mono tracking-wider text-[11px]">
                <span className="flex items-center gap-1.5 text-[#C0FF00]">
                  <Share2 className="w-3.5 h-3.5" /> iOS / Safari Installation
                </span>
                <button onClick={() => setShowIOSGuide(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-gray-400 pl-1">
                <li>Tap the <strong className="text-white">Share</strong> button in Safari's bottom toolbar (<span className="text-[#C0FF00]">⎋</span> / square with arrow).</li>
                <li>Scroll down and select <strong className="text-white">"Add to Home Screen"</strong> (<span className="text-[#C0FF00]">⊕</span>).</li>
                <li>Tap <strong className="text-white">"Add"</strong> at the top right to install.</li>
              </ol>
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-3 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-sm text-white">Export all logs (JSON)</div>
              <div className="text-xs text-gray-500">Download your history as a JSON file</div>
            </div>
          </button>

          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-3 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#333] rounded-xl text-left transition-colors disabled:opacity-50"
          >
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-sm text-white">Import logs (JSON)</div>
              <div className="text-xs text-gray-500">Restore your history from a JSON file</div>
            </div>
          </button>

          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-3 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-red-900/50 rounded-xl text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-red-500">Reset all logs</div>
                <div className="text-xs text-gray-500">Permanently delete your entire history</div>
              </div>
            </button>
          ) : (
            <div className="p-3 bg-red-500/10 border border-red-900/50 rounded-xl flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-red-500 uppercase tracking-tight">Are you sure about that?</div>
                  <div className="text-xs text-red-400/80 mt-1">This will permanently delete all your sessions and sets. This cannot be undone.</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setShowConfirmReset(false)}
                  disabled={isResetting}
                  className="flex-1 py-2 bg-transparent border border-red-900/50 text-red-400 text-xs font-bold rounded-lg hover:bg-red-900/20 transition-colors uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex-1 py-2 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </div>
          )}

          <div className="h-px bg-[#222] my-1" />

          {/* Switch Google Account */}
          <button
            onClick={async () => {
              onClose();
              await switchAccount();
            }}
            className="flex items-center justify-between w-full p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black transition-colors">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-sm text-white">Switch Account</div>
                <div className="text-xs text-gray-500">Pick or switch to another Google account</div>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-[#C0FF00] uppercase tracking-wider">
              Switch
            </div>
          </button>

          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center justify-center gap-2 w-full p-3 bg-[#1a1a1a] border border-[#222] hover:bg-neutral-900 rounded-xl text-gray-300 transition-colors font-bold text-sm uppercase tracking-wider mt-1"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
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
      )}    </div>
  );
};
