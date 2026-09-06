import React, { useState } from 'react';
import {
  Loader2,
  HardDriveDownload,
  HardDriveUpload,
  Share2,
  Layers,
  Dumbbell,
  History,
  Scale,
  Utensils,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { ExportScopeOptions } from '../../lib/supabaseData.ts';

interface SettingsBackupSectionProps {
  isExporting: boolean;
  isImporting: boolean;
  onExport: (options?: ExportScopeOptions, label?: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsBackupSection: React.FC<SettingsBackupSectionProps> = ({
  isExporting,
  isImporting,
  onExport,
  fileInputRef,
  onFileChange,
}) => {
  const [showCustomExport, setShowCustomExport] = useState(false);
  const [includeRoutines, setIncludeRoutines] = useState(true);
  const [includeExercises, setIncludeExercises] = useState(true);
  const [includeWorkoutHistory, setIncludeWorkoutHistory] = useState(true);
  const [includeBodyLogs, setIncludeBodyLogs] = useState(true);
  const [includeDietary, setIncludeDietary] = useState(true);

  const handleCustomExport = () => {
    const scope: ExportScopeOptions = {
      includeRoutines,
      includeExercises,
      includeWorkoutHistory,
      includeBodyLogs,
      includeDietary,
      includeProfile: true,
    };

    let label = 'custom_export';
    if (includeRoutines && includeExercises && !includeWorkoutHistory && !includeBodyLogs && !includeDietary) {
      label = 'routines_and_exercises';
    } else if (includeRoutines && !includeExercises && !includeWorkoutHistory && !includeBodyLogs && !includeDietary) {
      label = 'routines_only';
    } else if (!includeRoutines && includeExercises && !includeWorkoutHistory && !includeBodyLogs && !includeDietary) {
      label = 'exercises_only';
    } else if (!includeRoutines && !includeExercises && includeWorkoutHistory) {
      label = 'workout_history';
    }

    onExport(scope, label);
  };

  return (
    <div className="pt-2 space-y-2.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold px-1 flex items-center justify-between">
        <span>Data Backup, Export & Share</span>
        <span className="text-[9px] text-[#C0FF00] flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> Safe ID Remapping
        </span>
      </div>

      <div className="space-y-2">
        {/* Option 1: Quick Shareable Routine & Exercises */}
        <button
          onClick={() =>
            onExport(
              {
                includeRoutines: true,
                includeExercises: true,
                includeWorkoutHistory: false,
                includeBodyLogs: false,
                includeDietary: false,
                includeProfile: false,
              },
              'shareable_routines_and_exercises'
            )
          }
          disabled={isExporting}
          className="flex items-center gap-2.5 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all disabled:opacity-50 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black shrink-0 transition-colors">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
              <span>Share Routines & Exercises Only</span>
              <span className="text-[10px] font-mono text-[#C0FF00] font-normal">SHAREABLE</span>
            </div>
            <div className="text-[11px] text-gray-400 line-clamp-1">
              Export workout split and exercise catalog (without personal logs)
            </div>
          </div>
        </button>

        {/* Option 2: Full Backup */}
        <button
          onClick={() =>
            onExport(
              {
                includeRoutines: true,
                includeExercises: true,
                includeWorkoutHistory: true,
                includeBodyLogs: true,
                includeDietary: true,
                includeProfile: true,
              },
              'full_backup'
            )
          }
          disabled={isExporting}
          className="flex items-center gap-2.5 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-blue-500/40 rounded-xl text-left transition-all disabled:opacity-50 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-black shrink-0 transition-colors">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDriveDownload className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
              <span>Save Full Backup (All Logs & History)</span>
              <span className="text-[10px] font-mono text-blue-400 font-normal">FULL</span>
            </div>
            <div className="text-[11px] text-gray-400 line-clamp-1">
              Download routines, history, weigh-ins, and dietary entries
            </div>
          </div>
        </button>

        {/* Option 3: Custom Granular Export Accordion */}
        <div className="bg-[#161616] border border-[#262626] rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCustomExport(!showCustomExport)}
            className="w-full p-2.5 flex items-center justify-between text-left text-xs font-mono text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">Custom Export Selection</span>
            </div>
            {showCustomExport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showCustomExport && (
            <div className="p-3 pt-1 space-y-2.5 border-t border-[#222] text-xs font-sans">
              <p className="text-[11px] text-gray-400">
                Choose exactly what data to include in your export file:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#383838]">
                  <input
                    type="checkbox"
                    checked={includeRoutines}
                    onChange={(e) => setIncludeRoutines(e.target.checked)}
                    className="accent-[#C0FF00]"
                  />
                  <Layers className="w-3.5 h-3.5 text-[#C0FF00]" />
                  <span className="text-gray-200">Workout Routines</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#383838]">
                  <input
                    type="checkbox"
                    checked={includeExercises}
                    onChange={(e) => setIncludeExercises(e.target.checked)}
                    className="accent-[#C0FF00]"
                  />
                  <Dumbbell className="w-3.5 h-3.5 text-[#C0FF00]" />
                  <span className="text-gray-200">Exercise Catalog</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#383838]">
                  <input
                    type="checkbox"
                    checked={includeWorkoutHistory}
                    onChange={(e) => setIncludeWorkoutHistory(e.target.checked)}
                    className="accent-[#C0FF00]"
                  />
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-gray-200">Workout History (Sets)</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#383838]">
                  <input
                    type="checkbox"
                    checked={includeBodyLogs}
                    onChange={(e) => setIncludeBodyLogs(e.target.checked)}
                    className="accent-[#C0FF00]"
                  />
                  <Scale className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-gray-200">Bodyweight & BMI</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-[#1f1f1f] border border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#383838] sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={includeDietary}
                    onChange={(e) => setIncludeDietary(e.target.checked)}
                    className="accent-[#C0FF00]"
                  />
                  <Utensils className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-gray-200">Dietary Logs & Custom Foods</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleCustomExport}
                disabled={isExporting || (!includeRoutines && !includeExercises && !includeWorkoutHistory && !includeBodyLogs && !includeDietary)}
                className="w-full py-2 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HardDriveDownload className="w-3.5 h-3.5" />}
                Export Selected Data
              </button>
            </div>
          )}
        </div>

        {/* Option 4: Import / Restore */}
        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2.5 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all disabled:opacity-50 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black shrink-0 transition-colors">
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HardDriveUpload className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-white flex items-center justify-between">
              <span>Import / Restore Data from File</span>
              <span className="text-[10px] font-mono text-[#C0FF00] font-normal">RESTORE</span>
            </div>
            <div className="text-[11px] text-gray-400 line-clamp-1">
              Load shared routines, exercises or backup files safely
            </div>
          </div>
        </button>

        <p className="text-[10px] font-mono text-gray-500 px-1 pt-1">
          💡 Safe Import: Every imported routine and exercise automatically receives unique IDs for your account. You can freely import shared files from friends or other accounts without overwriting data.
        </p>
      </div>
    </div>
  );
};
