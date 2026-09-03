import React, { RefObject } from 'react';
import { Calendar, FileText, Scale, Camera, FolderOpen, Trash2 } from 'lucide-react';

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
  return (
    <div className="bg-[#111] border border-[#222] rounded-[24px] p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-4">
        <div>
          <h3 className="font-display font-black text-sm tracking-tight text-white uppercase">
            Recovery & Readiness
          </h3>
          <p className="text-[11px] text-gray-500 font-sans">
            Log physical state for automated load optimization
          </p>
        </div>

        <div className="relative shrink-0 w-full sm:w-auto">
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => onSessionDateChange(e.target.value)}
            className="w-full sm:w-auto pl-8 pr-3 py-1.5 text-xs border border-[#333] rounded-xl bg-[#1a1a1a] text-white font-mono focus:outline-none focus:border-[#C0FF00]"
          />
          <Calendar className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Recovery Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
            <span className="uppercase tracking-wider font-mono">Sleep (Hrs)</span>
            <span className="font-mono text-[#C0FF00] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#222]">
              {sleepHours} hrs
            </span>
          </div>
          <input
            type="range"
            min="4"
            max="12"
            step="0.5"
            value={sleepHours}
            onChange={(e) => onSleepHoursChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#C0FF00]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-400">
            <span className="uppercase tracking-wider font-mono">Energy (1-10)</span>
            <span className="font-mono text-[#C0FF00] bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#222]">
              {energyScore} / 10
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={energyScore}
            onChange={(e) => onEnergyScoreChange(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-[#222] rounded-lg appearance-none cursor-pointer accent-[#C0FF00]"
          />
        </div>
      </div>

      {/* Routine Day Note Input */}
      <div className="space-y-1.5 pt-3 border-t border-[#222]">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 font-mono">
          <span className="uppercase tracking-wider flex items-center gap-1.5 text-gray-300">
            <FileText className="w-3.5 h-3.5 text-[#C0FF00]" />
            Routine Notes / Remarks
          </span>
          <span className="text-[10px] text-gray-500 font-normal">Optional</span>
        </div>
        <textarea
          value={sessionNotes}
          onChange={(e) => onSessionNotesChange(e.target.value)}
          placeholder="e.g., Felt strong on pushups, shoulder felt great, tweaked grip width..."
          rows={2}
          className="w-full bg-[#161616] border border-[#2e2e2e] focus:border-[#C0FF00] rounded-xl p-3 text-xs text-white placeholder-gray-600 focus:outline-none transition-colors resize-y font-sans"
        />
      </div>

      {/* Bodyweight for Session / Day (Auto-filled from previous, editable) */}
      <div className="pt-3 border-t border-[#222]">
        <div className="bg-[#141414] border border-[#282828] hover:border-[#383838] transition-colors rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#C0FF00]/10 text-[#C0FF00] shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                Today's Bodyweight
                <span className="text-[9px] font-sans font-normal text-[#C0FF00] bg-[#C0FF00]/10 px-1.5 py-0.2 rounded border border-[#C0FF00]/20">
                  auto-filled
                </span>
              </div>
              <p className="text-[10px] text-gray-400 font-sans">
                Updates your daily weight & BMI progression log for {sessionDate}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="20"
                max="350"
                placeholder="kg"
                value={bodyWeightKg}
                onChange={(e) => onBodyWeightKgChange(e.target.value)}
                className="w-24 bg-[#1e1e1e] border border-[#333] focus:border-[#C0FF00] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold text-right pr-7 focus:outline-none transition-colors"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 pointer-events-none">
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
                className="absolute top-1 right-1 p-1 rounded-lg bg-black/80 hover:bg-red-600 text-white transition-colors cursor-pointer opacity-90"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {selectedPhotos.length < 5 && (
            <div className="flex gap-2 col-span-3 sm:col-span-2">
              {/* Button 1: Take Photo with Camera */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#333] hover:border-[#C0FF00] bg-[#161616] hover:bg-[#1f1f1f] text-gray-400 hover:text-[#C0FF00] transition-all cursor-pointer p-2"
                title="Take Photo with Camera"
              >
                <Camera className="w-4 h-4" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-center">
                  Camera
                </span>
              </button>

              {/* Button 2: Upload from Files / Gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 aspect-square flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#333] hover:border-[#C0FF00] bg-[#161616] hover:bg-[#1f1f1f] text-gray-400 hover:text-[#C0FF00] transition-all cursor-pointer p-2"
                title="Choose from Gallery or File Manager"
              >
                <FolderOpen className="w-4 h-4" />
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-center">
                  Files / Gallery
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
