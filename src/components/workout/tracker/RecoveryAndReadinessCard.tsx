import React, { RefObject, useState } from 'react';
import { Calendar, FileText, Scale, Camera, FolderOpen, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface RecoveryAndReadinessCardProps {
  sessionDate: string;
  onSessionDateChange: (val: string) => void;
  sleepHours: number;
  onSleepHoursChange: (val: number) => void;
  energyScore: number;
  onEnergyScoreChange: (val: number) => void;
  sessionNotes: string;
  onSessionNotesChange: (val: string) => void;
  bodyWeightKg: string;
  onBodyWeightKgChange: (val: string) => void;
  selectedPhotos: File[];
  photoPreviews: string[];
  onRemovePhoto: (index: number) => void;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export const RecoveryAndReadinessCard: React.FC<RecoveryAndReadinessCardProps> = ({
  sessionDate,
  onSessionDateChange,
  sleepHours,
  onSleepHoursChange,
  energyScore,
  onEnergyScoreChange,
  sessionNotes,
  onSessionNotesChange,
  bodyWeightKg,
  onBodyWeightKgChange,
  selectedPhotos,
  photoPreviews,
  onRemovePhoto,
  onPhotoSelect,
  cameraInputRef,
  fileInputRef,
}) => {
  // Collapsed by default; persist user toggle state in localStorage
  const [isExpanded, setIsExpandedState] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('workout_recovery_expanded');
      return stored === 'true'; // false if null or 'false'
    } catch {
      return false;
    }
  });

  const toggleExpanded = () => {
    setIsExpandedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('workout_recovery_expanded', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-controls="recovery-readiness-content"
          className="flex items-center justify-between sm:justify-start gap-3 cursor-pointer group flex-1 select-none text-left"
        >
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-sm tracking-tight text-white uppercase group-hover:text-[#C0FF00] transition-colors">
                Recovery & Readiness
              </h3>
              <span className="p-1 rounded-lg bg-[#1a1a1a] border border-[#333] text-gray-400 group-hover:text-[#C0FF00] transition-colors">
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans mt-0.5">
              Log physical state for automated load optimization
            </p>
          </div>

          {!isExpanded && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-400 ml-auto">
              <span className="bg-[#181818] px-1.5 py-0.5 rounded border border-[#262626]">
                💤 {sleepHours}h
              </span>
              <span className="bg-[#181818] px-1.5 py-0.5 rounded border border-[#262626]">
                ⚡ {energyScore}/10
              </span>
              {bodyWeightKg && (
                <span className="bg-[#181818] px-1.5 py-0.5 rounded border border-[#262626]">
                  ⚖️ {bodyWeightKg}kg
                </span>
              )}
            </div>
          )}
        </button>

        <div className="relative shrink-0 w-full sm:w-auto">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => onSessionDateChange(e.target.value)}
            aria-label="Session Date"
            className="w-full sm:w-auto pl-8 pr-3 py-1.5 text-xs border border-[#333] rounded-xl bg-[#1a1a1a] text-white font-mono focus:outline-none focus:border-[#C0FF00]"
          />
          <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {isExpanded && (
        <div id="recovery-readiness-content" className="space-y-4">
          {/* Recovery Sliders and Mini Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Sleep Mini Form Field & Slider */}
            <div className="bg-[#161616] border border-[#262626] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="sleep-hours-input" className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <span aria-hidden="true">💤</span>
                  <span>Sleep</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="sleep-hours-input"
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={sleepHours}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onSleepHoursChange(isNaN(val) ? 0 : val);
                    }}
                    className="w-16 bg-[#1f1f1f] border border-[#333] focus:border-[#C0FF00] text-[#C0FF00] font-mono text-xs font-bold text-center py-1 px-2 rounded-lg outline-none transition-colors"
                    title="Sleep in hours"
                  />
                  <span className="text-[11px] font-mono text-gray-400">hrs</span>
                </div>
              </div>
              <input
                type="range"
                min="4"
                max="14"
                step="0.5"
                value={Math.min(Math.max(sleepHours, 4), 14)}
                onChange={(e) => onSleepHoursChange(parseFloat(e.target.value))}
                aria-label="Adjust Sleep Hours Slider"
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#C0FF00]"
              />
            </div>

            {/* Energy Mini Form Field & Slider */}
            <div className="bg-[#161616] border border-[#262626] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label htmlFor="energy-score-input" className="text-[11px] font-mono font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
                  <span aria-hidden="true">⚡</span>
                  <span>Energy</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="energy-score-input"
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={energyScore}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onEnergyScoreChange(isNaN(val) ? 1 : Math.max(1, Math.min(10, val)));
                    }}
                    className="w-16 bg-[#1f1f1f] border border-[#333] focus:border-amber-400 text-amber-400 font-mono text-xs font-bold text-center py-1 px-2 rounded-lg outline-none transition-colors"
                    title="Energy rating (1-10)"
                  />
                  <span className="text-[11px] font-mono text-gray-400">/ 10</span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={energyScore}
                onChange={(e) => onEnergyScoreChange(parseInt(e.target.value, 10))}
                aria-label="Adjust Energy Score Slider"
                className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* Routine Day Note Input */}
          <div className="space-y-1.5 pt-3 border-t border-[#222]">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 font-mono">
              <label htmlFor="routine-notes-input" className="uppercase tracking-wider flex items-center gap-1.5 text-gray-300">
                <FileText className="w-3.5 h-3.5 text-[#C0FF00]" aria-hidden="true" />
                Routine Notes / Remarks
              </label>
              <span className="text-[10px] text-gray-400 font-normal">Optional</span>
            </div>
            <textarea
              id="routine-notes-input"
              value={sessionNotes}
              onChange={(e) => onSessionNotesChange(e.target.value)}
              placeholder="e.g., Felt strong on pushups, shoulder felt great, tweaked grip width..."
              rows={2}
              className="w-full bg-[#161616] border border-[#2e2e2e] focus:border-[#C0FF00] rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors resize-y font-sans"
            />
          </div>

          {/* Bodyweight for Session / Day */}
          <div className="pt-3 border-t border-[#222]">
            <div className="bg-[#141414] border border-[#282828] hover:border-[#383838] transition-colors rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00] shrink-0" aria-hidden="true">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <label htmlFor="bodyweight-kg-input" className="block text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                    Today&apos;s Bodyweight
                  </label>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5">
                    Updates your daily weight & BMI progression log for {sessionDate}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="relative">
                  <input
                    id="bodyweight-kg-input"
                    type="number"
                    step="0.1"
                    min="20"
                    max="350"
                    placeholder="kg"
                    value={bodyWeightKg}
                    onChange={(e) => onBodyWeightKgChange(e.target.value)}
                    className="w-24 bg-[#1e1e1e] border border-[#333] focus:border-[#C0FF00] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-right pr-7 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Photos of the Day (Up to 5) */}
          <div className="space-y-2 pt-3 border-t border-[#222]">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 font-mono">
              <span className="uppercase tracking-wider flex items-center gap-1.5 text-gray-300">
                <Camera className="w-3.5 h-3.5 text-[#C0FF00]" />
                Photo of the Day ({selectedPhotos.length}/5)
              </span>
              <span className="text-[10px] text-gray-500 font-normal">Optional</span>
            </div>

            {/* Direct Camera Capture (forces mobile camera shutter) */}
            <input
              type="file"
              ref={cameraInputRef}
              onChange={onPhotoSelect}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {/* File / Photo Library / File Manager Picker */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={onPhotoSelect}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
              {photoPreviews.map((previewUrl, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-[#333] bg-[#1a1a1a]"
                >
                  <img
                    src={previewUrl}
                    alt={`Workout snap ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(index)}
                    className="absolute top-1 right-1 p-2 rounded-lg bg-black/80 hover:bg-red-600 text-white transition-colors cursor-pointer opacity-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label={`Remove photo ${index + 1}`}
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {selectedPhotos.length < 5 && (
                <div className="flex gap-2 col-span-3 sm:col-span-2">
                  {/* Button 1: Take Photo with Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#333] hover:border-[#C0FF00] bg-[#161616] hover:bg-[#1f1f1f] text-gray-300 hover:text-[#C0FF00] transition-all cursor-pointer p-2 min-h-[44px]"
                    aria-label="Take Photo with Camera"
                    title="Take Photo with Camera"
                  >
                    <Camera className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-center">
                      Camera
                    </span>
                  </button>

                  {/* Button 2: Upload from Files / Gallery */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#333] hover:border-[#C0FF00] bg-[#161616] hover:bg-[#1f1f1f] text-gray-300 hover:text-[#C0FF00] transition-all cursor-pointer p-2 min-h-[44px]"
                    aria-label="Choose from Gallery or File Manager"
                    title="Choose from Gallery or File Manager"
                  >
                    <FolderOpen className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-center">
                      Files
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
