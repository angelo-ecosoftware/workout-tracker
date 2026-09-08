import React, { RefObject } from 'react';
import {
  X,
  Clock,
  Dumbbell,
  Scale,
  Calendar,
  FileText,
  Camera,
  FolderOpen,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  workoutOrder: number;
  elapsedSeconds: number;
  completedSetsCount: number;
  totalSets: number;
  completedExercisesCount: number;
  totalExercisesCount: number;
  sessionDate: string;
  onSessionDateChange: (val: string) => void;
  sleepHours: number;
  onSleepHoursChange: (val: number) => void;
  energyScore: number;
  onEnergyScoreChange: (val: number) => void;
  bodyWeightKg: string;
  onBodyWeightKgChange: (val: string) => void;
  sessionNotes: string;
  onSessionNotesChange: (val: string) => void;
  selectedPhotos: File[];
  photoPreviews: string[];
  onRemovePhoto: (index: number) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  loggingWorkout: boolean;
  isUploadingPhotos: boolean;
  errorMsg: string | null;
  onConfirmSave: () => void;
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;

  if (hrs > 0) {
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}m ${secs}s`;
}

export const FinishWorkoutModal: React.FC<FinishWorkoutModalProps> = ({
  isOpen,
  onClose,
  workoutName,
  workoutOrder,
  elapsedSeconds,
  completedSetsCount,
  totalSets,
  completedExercisesCount,
  totalExercisesCount,
  sessionDate,
  onSessionDateChange,
  sleepHours,
  onSleepHoursChange,
  energyScore,
  onEnergyScoreChange,
  bodyWeightKg,
  onBodyWeightKgChange,
  sessionNotes,
  onSessionNotesChange,
  selectedPhotos,
  photoPreviews,
  onRemovePhoto,
  onPhotoSelect,
  cameraInputRef,
  fileInputRef,
  loggingWorkout,
  isUploadingPhotos,
  errorMsg,
  onConfirmSave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-workout-title"
    >
      <div className="bg-[#121212] border border-[#262626] rounded-[28px] max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#202020]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#C0FF00]/10 text-[#C0FF00] border border-[#C0FF00]/30">
                Day {workoutOrder}
              </span>
              <h2 id="finish-workout-title" className="text-base sm:text-lg font-display font-black text-white uppercase tracking-tight">
                Finish Workout
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-sans mt-0.5 truncate max-w-[320px]">
              {workoutName}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close finish workout modal"
            className="p-2 text-gray-400 hover:text-white bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto overscroll-contain flex-1">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3 text-center space-y-0.5">
              <Clock className="w-3.5 h-3.5 text-[#C0FF00] mx-auto" />
              <div className="text-[10px] font-mono text-gray-400 uppercase">Duration</div>
              <div className="font-mono font-black text-sm text-white">
                {elapsedSeconds > 0 ? formatDuration(elapsedSeconds) : 'Session'}
              </div>
            </div>

            <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3 text-center space-y-0.5">
              <Dumbbell className="w-3.5 h-3.5 text-[#C0FF00] mx-auto" />
              <div className="text-[10px] font-mono text-gray-400 uppercase">Sets Done</div>
              <div className="font-mono font-black text-sm text-white">
                {completedSetsCount} / {totalSets}
              </div>
            </div>

            <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3 text-center space-y-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C0FF00] mx-auto" />
              <div className="text-[10px] font-mono text-gray-400 uppercase">Exercises</div>
              <div className="font-mono font-black text-sm text-white">
                {completedExercisesCount} / {totalExercisesCount}
              </div>
            </div>
          </div>

          {/* Date Picker */}
          <div className="flex items-center justify-between p-3 bg-[#181818] border border-[#262626] rounded-2xl">
            <label htmlFor="finish-session-date" className="text-xs font-mono font-bold text-gray-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Session Date</span>
            </label>
            <input
              id="finish-session-date"
              type="date"
              value={sessionDate}
              onChange={(e) => onSessionDateChange(e.target.value)}
              className="px-2.5 py-1 text-xs border border-[#333] rounded-lg bg-[#202020] text-white font-mono focus:outline-none focus:border-[#C0FF00]"
            />
          </div>

          {/* Bodyweight Check-in */}
          <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="finish-bodyweight-input" className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Scale className="w-3.5 h-3.5 text-[#C0FF00]" />
                <span>Today's Bodyweight</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="finish-bodyweight-input"
                  type="number"
                  step="0.1"
                  min="20"
                  max="350"
                  placeholder="e.g. 82.5"
                  value={bodyWeightKg}
                  onChange={(e) => onBodyWeightKgChange(e.target.value)}
                  className="w-24 bg-[#202020] border border-[#333] focus:border-[#C0FF00] text-white font-mono text-xs font-bold text-center py-1.5 px-2 rounded-xl outline-none"
                />
                <span className="text-xs font-mono font-bold text-[#C0FF00]">kg</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 font-sans">
              Auto-syncs to your biometric trend history and GDPR Art. 9 encrypted logs.
            </p>
          </div>

          {/* Readiness: Sleep & Energy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sleep */}
            <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-gray-300">💤 Sleep</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={sleepHours}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      onSleepHoursChange(isNaN(v) ? 0 : v);
                    }}
                    className="w-14 bg-[#202020] border border-[#333] text-[#C0FF00] font-mono text-xs font-bold text-center py-1 px-1.5 rounded-lg"
                  />
                  <span className="text-[10px] font-mono text-gray-400">hrs</span>
                </div>
              </div>
              <input
                type="range"
                min="4"
                max="14"
                step="0.5"
                value={Math.min(Math.max(sleepHours, 4), 14)}
                onChange={(e) => onSleepHoursChange(parseFloat(e.target.value))}
                aria-label="Adjust sleep hours"
                className="w-full h-1 bg-[#282828] rounded-lg appearance-none cursor-pointer accent-[#C0FF00]"
              />
            </div>

            {/* Energy */}
            <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-gray-300">⚡ Energy</span>
                <span className="text-xs font-mono font-bold text-[#C0FF00]">{energyScore} / 10</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => onEnergyScoreChange(score)}
                    className={`flex-1 py-1 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      energyScore === score
                        ? 'bg-[#C0FF00] text-black font-black'
                        : 'bg-[#222] text-gray-400 hover:text-white'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session Notes */}
          <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3.5 space-y-2">
            <label htmlFor="finish-workout-notes" className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-[#C0FF00]" />
              <span>Workout Notes</span>
            </label>
            <textarea
              id="finish-workout-notes"
              rows={2}
              value={sessionNotes}
              onChange={(e) => onSessionNotesChange(e.target.value)}
              placeholder="e.g., felt strong on pushups, took it easy on shoulders..."
              className="w-full bg-[#202020] border border-[#333] focus:border-[#C0FF00] rounded-xl p-2.5 text-xs text-white placeholder-gray-500 font-sans outline-none resize-none"
            />
          </div>

          {/* Physique / Workout Photos */}
          <div className="bg-[#181818] border border-[#262626] rounded-2xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                <Camera className="w-3.5 h-3.5 text-[#C0FF00]" />
                <span>Physique Progress Photos</span>
              </span>
              <span className="text-[10px] font-mono text-gray-500">Max 5 photos</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#333] text-gray-300 font-mono text-[11px] font-bold cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-[#C0FF00]" />
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#202020] hover:bg-[#282828] border border-[#333] text-gray-300 font-mono text-[11px] font-bold cursor-pointer transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                <span>Upload</span>
              </button>
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              onChange={onPhotoSelect}
              className="hidden"
            />
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={onPhotoSelect}
              className="hidden"
            />

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {photoPreviews.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-[#333] group">
                    <img src={url} alt={`Workout upload ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onRemovePhoto(i)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-400 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded-xl font-mono flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#202020] flex flex-col sm:flex-row items-center gap-2.5 bg-[#141414]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#202020] hover:bg-[#282828] text-gray-400 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer"
          >
            Continue Workout
          </button>

          <button
            type="button"
            onClick={onConfirmSave}
            disabled={loggingWorkout || isUploadingPhotos}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#C0FF00] hover:bg-[#b0f000] disabled:bg-[#202020] disabled:text-gray-600 text-black font-display font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(192,255,0,0.3)] cursor-pointer"
          >
            {loggingWorkout || isUploadingPhotos ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-black" />
            )}
            <span>{isUploadingPhotos ? 'Uploading Photos...' : 'Save & Complete Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
