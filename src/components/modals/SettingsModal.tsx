import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { usePWA } from '../../context/PWAContext.tsx';
import {
  X,
  LogOut,
  Loader2,
  Layers,
  UserCheck,
  Bookmark,
  Shield,
  Sparkles,
  FileCheck2,
  Dumbbell,
  HardDrive,
  HelpCircle,
  User,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { exportAllLogs, importAllLogs, fetchWorkoutsData, saveWorkoutsAndExercises, ExportScopeOptions } from '../../lib/supabaseData.ts';
import { RoutineEditorModal } from './RoutineEditorModal.tsx';
import { SavedRoutinesLibraryModal } from './SavedRoutinesLibraryModal.tsx';
import { PrivacySettingsModal } from '../settings/PrivacySettingsModal.tsx';
import { CoachAccountModal } from './CoachAccountModal.tsx';
import { WelcomeModal } from './WelcomeModal.tsx';
import { ComplianceDossierModal } from '../settings/ComplianceDossierModal.tsx';
import { DeleteAccountModal } from '../settings/DeleteAccountModal.tsx';
import { Workout, Exercise } from '../../models.ts';
import { SettingsThemeSection } from './SettingsThemeSection.tsx';
import { SettingsAssistedWorkoutSection } from './SettingsAssistedWorkoutSection.tsx';
import { SettingsBackupSection } from './SettingsBackupSection.tsx';
import { SettingsPWASection } from './SettingsPWASection.tsx';
import { CoachConnectionsSection } from '../settings/CoachConnectionsSection.tsx';
import { CoachSettingsSection } from './CoachSettingsSection.tsx';
import { SettingsFAQSection } from './SettingsFAQSection.tsx';
import { SettingsNavRow, SettingsSubpageHeader } from '../settings/SettingsNavRow.tsx';

export type SettingsPage =
  | 'home'
  | 'training'
  | 'privacy'
  | 'data'
  | 'help'
  | 'account';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user, logout, switchAccount, isCoach, isAdmin, specialty } = useAuth();
  const { installPrompt, setInstallPrompt, isStandalone, isIOS, isMobile } = usePWA();
  const [currentPage, setCurrentPage] = useState<SettingsPage>('home');
  const [settingsMode, setSettingsMode] = useState<'trainer' | 'personal'>(() => isCoach ? 'trainer' : 'personal');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCoachAccountOpen, setIsCoachAccountOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
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
    if (isOpen) {
      setCurrentPage('home');
    }
  }, [isOpen]);

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

  const handleExport = async (options?: ExportScopeOptions, label = 'data') => {
    setIsExporting(true);
    try {
      const data = await exportAllLogs(user.uid, options);
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
      a.download = `${cleanUsername}_${label}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export data:', e);
      alert('Failed to export data.');
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
          {/* ========================================================================= */}
          {/* VIEW: SETTINGS HOME LANDING                                              */}
          {/* ========================================================================= */}
          {currentPage === 'home' && (
            <>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#222] bg-[#111]/95 backdrop-blur sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-black uppercase italic tracking-tight text-white text-sm sm:text-base">
                    Settings
                  </h2>
                  <span className="text-[10px] font-mono text-gray-400 bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#282828]">
                    {isAdmin ? 'Admin' : isCoach ? 'Coach' : 'Athlete'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 hover:bg-[#222] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Home Navigation Body */}
              <div className="p-3 sm:p-4 flex flex-col gap-2.5 overflow-y-auto overscroll-contain flex-1">
                {/* Mode Switcher inside Settings (Only for Coaches when not Admin) */}
                {!isAdmin && isCoach && (
                  <div className="flex bg-[#161616] border border-[#2a2a2a] rounded-xl p-1 font-mono text-xs mb-1">
                    <button
                      type="button"
                      onClick={() => setSettingsMode('trainer')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        settingsMode === 'trainer'
                          ? 'bg-[#C0FF00] text-black shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Trainer Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSettingsMode('personal')}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        settingsMode === 'personal'
                          ? 'bg-[#C0FF00] text-black shadow-sm'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Personal Account</span>
                    </button>
                  </div>
                )}

                {/* Trainer Dedicated View Mode */}
                {isCoach && settingsMode === 'trainer' ? (
                  <div className="space-y-3">
                    <CoachSettingsSection />
                    <button
                      type="button"
                      onClick={() => setCurrentPage('training')}
                      className="flex items-center justify-between gap-3 w-full p-3 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] rounded-xl text-left transition-all"
                    >
                      <div className="font-bold text-xs text-white">Appearance & Theme</div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 1. TRAINING */}
                    <SettingsNavRow
                      icon={<Dumbbell className="w-4 h-4" />}
                      title="Training"
                      subtitle="Timer, routines, exercises, appearance"
                      badge={`${restDurationSeconds}s`}
                      onClick={() => setCurrentPage('training')}
                    />

                    {/* 2. PRIVACY & SHARING */}
                    <SettingsNavRow
                      icon={<Shield className="w-4 h-4" />}
                      title="Privacy & Sharing"
                      subtitle="Profile, coaches, visibility"
                      onClick={() => setCurrentPage('privacy')}
                    />

                    {/* 3. DATA & APP */}
                    <SettingsNavRow
                      icon={<HardDrive className="w-4 h-4" />}
                      title="Data & App"
                      subtitle="Backup, export, offline access"
                      badge={isStandalone ? 'Installed ✓' : undefined}
                      onClick={() => setCurrentPage('data')}
                    />

                    {/* 4. HELP */}
                    <SettingsNavRow
                      icon={<HelpCircle className="w-4 h-4" />}
                      title="Help"
                      subtitle="FAQ and getting started"
                      onClick={() => setCurrentPage('help')}
                    />

                    {/* 5. ACCOUNT */}
                    <SettingsNavRow
                      icon={<User className="w-4 h-4" />}
                      title="Account"
                      subtitle={user.email || 'Email, session and account'}
                      onClick={() => setCurrentPage('account')}
                    />
                  </>
                )}
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* SUBPAGE 1: TRAINING SETTINGS                                             */}
          {/* ========================================================================= */}
          {currentPage === 'training' && (
            <>
              <SettingsSubpageHeader
                title="Training"
                subtitle="Timer, routines, exercises, appearance"
                onBack={() => setCurrentPage('home')}
                onClose={onClose}
              />

              <div className="p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain flex-1">
                {/* Theme Selector */}
                <SettingsThemeSection />

                {/* Assisted Timed Workout Toggle & Timer Setting */}
                <SettingsAssistedWorkoutSection
                  assistedTimedWorkout={assistedTimedWorkout}
                  setAssistedTimedWorkout={setAssistedTimedWorkout}
                  restDurationSeconds={restDurationSeconds}
                  setRestDurationSeconds={setRestDurationSeconds}
                />

                {/* Routine Programs Section */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold px-1">
                    Programs
                  </div>

                  {/* Edit Routines & Exercises Button */}
                  <button
                    type="button"
                    onClick={handleOpenRoutineEditor}
                    disabled={loadingWorkouts}
                    className="flex items-center justify-between gap-3 w-full p-3 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-xl text-left transition-all group cursor-pointer min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
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
                    <div className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider shrink-0 bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded">
                      Configure
                    </div>
                  </button>

                  {/* Saved Routines Library Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const data = await fetchWorkoutsData(user.uid);
                        setUserWorkouts(data.combinedWorkouts);
                      } catch {
                        // ignore
                      }
                      setIsLibraryOpen(true);
                    }}
                    className="flex items-center justify-between gap-3 w-full p-3 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-xl text-left transition-all group cursor-pointer min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
                        <Bookmark className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          Saved Routines Library
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          Switch programs & saved splits
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider shrink-0 bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded">
                      Library
                    </div>
                  </button>

                  {/* Onboarding Guide Recalibration Button */}
                  <button
                    type="button"
                    onClick={() => setIsOnboardingOpen(true)}
                    className="flex items-center justify-between gap-3 w-full p-3 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-xl text-left transition-all group cursor-pointer min-h-[48px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          Explore App & Onboarding Guide
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          Re-calibrate lifting goals, equipment & biometrics
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider shrink-0 bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded">
                      Explore
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* SUBPAGE 2: PRIVACY & SHARING                                             */}
          {/* ========================================================================= */}
          {currentPage === 'privacy' && (
            <>
              <SettingsSubpageHeader
                title="Privacy & Sharing"
                subtitle="Profile, coaches, visibility"
                onBack={() => setCurrentPage('home')}
                onClose={onClose}
              />

              <div className="p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain flex-1">
                {/* 1. Privacy & Visibility Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsPrivacyOpen(true)}
                  className="flex items-center justify-between gap-3 w-full p-3.5 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-xl text-left transition-all group cursor-pointer min-h-[50px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">
                        Profile & Data Visibility
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        Public profile, peer sharing & biometric privacy
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#C0FF00]" />
                </button>

                {/* 2. Coach Mode / Trainer Permissions Button */}
                {!isCoach && (
                  <button
                    type="button"
                    onClick={() => setIsCoachAccountOpen(true)}
                    className="flex items-center justify-between gap-3 w-full p-3.5 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-xl text-left transition-all group cursor-pointer min-h-[50px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          Coach Mode & Trainer Tools
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          Unlock client roster & proposal tools
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 px-2 py-0.5 rounded bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/20">
                      Activate
                    </div>
                  </button>
                )}

                {/* 3. Coach Connections & Proposals (Embedded) */}
                <CoachConnectionsSection userId={user.uid} />

                {/* 4. Security & Compliance Subpage Link */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold px-1">
                    Security & Compliance
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDossierOpen(true)}
                    className="flex items-center justify-between gap-3 w-full p-3.5 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-xl text-left transition-all group cursor-pointer min-h-[50px]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          Security & Compliance Dossier
                        </div>
                        <div className="text-[11px] text-gray-400 truncate">
                          CRA SBOM, TLS 1.3 proof, RLS matrices & audits
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#C0FF00]" />
                  </button>
                </div>

                {/* 5. Danger Zone: GDPR Article 17 Account Purge */}
                <div className="space-y-2 pt-2 border-t border-[#222]">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-bold px-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Danger Zone</span>
                  </div>

                  <div className="p-3.5 bg-red-950/20 border border-red-500/30 rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-white">Permanently Delete Account</div>
                      <div className="text-[11px] text-gray-400">
                        GDPR Article 17 permanent cascade erasure
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-display font-black text-xs uppercase tracking-wider transition-colors shrink-0 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* SUBPAGE 3: DATA & APP                                                    */}
          {/* ========================================================================= */}
          {currentPage === 'data' && (
            <>
              <SettingsSubpageHeader
                title="Data & App"
                subtitle="Backup, export, offline access"
                onBack={() => setCurrentPage('home')}
                onClose={onClose}
              />

              <div className="p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain flex-1">
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
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* SUBPAGE 4: HELP                                                          */}
          {/* ========================================================================= */}
          {currentPage === 'help' && (
            <>
              <SettingsSubpageHeader
                title="Help"
                subtitle="FAQ and getting started"
                onBack={() => setCurrentPage('home')}
                onClose={onClose}
              />

              <div className="p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain flex-1">
                {/* Onboarding Wizard Launcher */}
                <button
                  type="button"
                  onClick={() => setIsOnboardingOpen(true)}
                  className="flex items-center justify-between gap-3 w-full p-3.5 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-xl text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">
                        Re-run Onboarding Walkthrough
                      </div>
                      <div className="text-[11px] text-gray-400 truncate">
                        Step-by-step introduction to tracker features
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-[#C0FF00]" />
                </button>

                {/* In-App Searchable Help & FAQ Accordion */}
                <SettingsFAQSection />
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* SUBPAGE 5: ACCOUNT & SESSION                                             */}
          {/* ========================================================================= */}
          {currentPage === 'account' && (
            <>
              <SettingsSubpageHeader
                title="Account"
                subtitle="Email, session and account"
                onBack={() => setCurrentPage('home')}
                onClose={onClose}
              />

              <div className="p-3 sm:p-4 flex flex-col gap-3 overflow-y-auto overscroll-contain flex-1">
                {/* User Identity Card */}
                <div className="p-4 bg-[#161616] border border-[#262626] rounded-2xl space-y-2">
                  <div className="text-[10px] font-mono text-gray-400 uppercase font-bold">
                    Active Signed-In Account
                  </div>
                  <div className="text-white font-bold text-sm truncate">
                    {user.displayName || 'Athlete User'}
                  </div>
                  <div className="text-xs font-mono text-[#C0FF00] truncate">{user.email}</div>
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-[#C0FF00]/15 text-[#C0FF00] border border-[#C0FF00]/30 px-2.5 py-0.5 rounded-full">
                      Role: {isAdmin ? 'Administrator' : isCoach ? 'Coach' : 'Athlete'}
                    </span>
                    {specialty && (
                      <span className="text-[10px] font-mono text-gray-400 bg-[#222] px-2 py-0.5 rounded-full">
                        {specialty}
                      </span>
                    )}
                  </div>
                </div>

                {/* Switch Google Account */}
                <button
                  type="button"
                  onClick={async () => {
                    onClose();
                    await switchAccount();
                  }}
                  className="flex items-center justify-between gap-3 w-full p-3 bg-[#161616] hover:bg-[#1f1f1f] border border-[#262626] hover:border-[#383838] rounded-xl text-left transition-all group cursor-pointer min-h-[48px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-white truncate">
                        Switch Account
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">Change Google account</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider shrink-0 bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded">
                    Switch
                  </div>
                </button>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="flex items-center justify-center gap-2 w-full p-3 bg-[#161616] hover:bg-neutral-900 border border-[#262626] rounded-xl text-gray-300 hover:text-white transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer min-h-[48px]"
                >
                  <LogOut className="w-3.5 h-3.5 text-gray-400" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}
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

      {/* Saved Routines Library Modal */}
      {isLibraryOpen && (
        <SavedRoutinesLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          userId={user.uid}
          currentWorkouts={userWorkouts}
          onProgramActivated={async (activatedWorkouts) => {
            setUserWorkouts(activatedWorkouts);
            window.location.reload();
          }}
        />
      )}

      {/* Privacy Settings Modal */}
      {isPrivacyOpen && (
        <PrivacySettingsModal
          isOpen={isPrivacyOpen}
          onClose={() => setIsPrivacyOpen(false)}
          userId={user.uid}
          userEmail={user.email}
          onAccountDeleted={logout}
        />
      )}

      {/* EU Compliance & Security Dossier Modal */}
      {isDossierOpen && (
        <ComplianceDossierModal
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
        />
      )}

      {/* Delete Account Modal (GDPR Article 17) */}
      {isDeleteModalOpen && (
        <DeleteAccountModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          userId={user.uid}
          userEmail={user.email}
          onAccountDeleted={logout}
        />
      )}

      {/* Coach Account Modal */}
      {isCoachAccountOpen && (
        <CoachAccountModal
          isOpen={isCoachAccountOpen}
          onClose={() => setIsCoachAccountOpen(false)}
        />
      )}

      {/* Re-Launchable Onboarding / Explore App Wizard */}
      {isOnboardingOpen && (
        <WelcomeModal
          isOpen={isOnboardingOpen}
          userId={user.uid}
          onClose={() => setIsOnboardingOpen(false)}
          onCompletedOnboarding={() => {
            setIsOnboardingOpen(false);
          }}
        />
      )}
    </>
  );
};
