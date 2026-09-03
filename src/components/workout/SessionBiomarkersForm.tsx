import React from 'react';
import { Calendar, Timer, Zap, Scale, FileText, Camera, FolderOpen, Trash2 } from 'lucide-react';

interface SessionBiomarkersFormProps {
  sessionDate: string;
  onSessionDateChange: (val: string) => void;
  sleepHours: number;
  onSleepHoursChange: (val: number) => void;
  energyScore: number;
  onEnergyScoreChange: (val: number) => void;
  bodyWeightKg: string;
  onBodyWeightChange: (val: string) => void;
  sessionNotes: string;
  onSessionNotesChange: (val: string) => void;
  selectedPhotos: File[];
  photoPreviews: string[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  cameraInputRef: React.RefObject<HTMLInputElement | null>;
  onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  lastAutoSavedTime: string | null;
}

export const SessionBiomarkersForm: React.FC<SessionBiomarkersFormProps> = ({
  sessionDate,
  onSessionDateChange,
  sleepHours,
  onSleepHoursChange,
  energyScore,
  onEnergyScoreChange,
  bodyWeightKg,
  onBodyWeightChange,
  sessionNotes,
  onSessionNotesChange,
  selectedPhotos,
  photoPreviews,
  fileInputRef,
  cameraInputRef,
  onPhotoSelect,
  onRemovePhoto,
  lastAutoSavedTime,
}) => {
  return (
    <div className="bg-[#161616] border border-[#262626] rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Date, Sleep, Energy */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Session Date */}
        <div>
          <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#C0FF00]" />
            Session Date
          </label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => onSessionDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#C0FF00]"
          />
        </div>

        {/* Sleep Score */}
        <div>
          <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
            <Timer className="w-3.5 h-3.5 text-blue-400" />
            Sleep Hours ({sleepHours}h)
          </label>
          <input
            type="range"
            min="3"
            max="12"
            step="0.5"
            value={sleepHours}
            onChange={(e) => onSleepHoursChange(parseFloat(e.target.value))}
            className="w-full accent-[#C0FF00] cursor-pointer"
          />
        </div>

        {/* Energy Score */}
        <div>
          <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Energy Level ({energyScore}/10)
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={energyScore}
            onChange={(e) => onEnergyScoreChange(parseInt(e.target.value, 10))}
            className="w-full accent-[#C0FF00] cursor-pointer"
          />
        </div>
      </div>

      {/* Bodyweight Check-in & Session Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#222]">
        <div>
          <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
            <Scale className="w-3.5 h-3.5 text-[#C0FF00]" />
            Bodyweight Today (kg)
          </label>
          <input
            type="number"
            step="0.1"
            placeholder="e.g. 84.5"
            value={bodyWeightKg}
            onChange={(e) => onBodyWeightChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-xl text-white text-xs font-mono focus:outline-none focus:border-[#C0FF00]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-purple-400" />
            Session Notes & Performance Feelings
          </label>
          <input
            type="text"
            placeholder="e.g. Felt great on bench, left shoulder slightly tight..."
            value={sessionNotes}
            onChange={(e) => onSessionNotesChange(e.target.value)}
            className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-xl text-white text-xs font-sans focus:outline-none focus:border-[#C0FF00]"
          />
        </div>
      </div>

      {/* Progress Photos Upload & Preview */}
      <div className="pt-2 border-t border-[#222]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#C0FF00]" />
            Physique Check-in Photos ({selectedPhotos.length}/5)
          </label>
          {lastAutoSavedTime && (
            <span className="text-[10px] font-mono text-gray-500">
              Draft saved at {lastAutoSavedTime}
            </span>
          )}
        </div>

        {/* Photo Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {/* Native Camera Capture */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={selectedPhotos.length >= 5}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed border border-[#333] rounded-xl text-xs font-mono text-white transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-[#C0FF00]" />
            <span>Take Photo</span>
          </button>
          <input
            ref={cameraInputRef as any}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onPhotoSelect}
            className="hidden"
          />

          {/* Browse Files */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={selectedPhotos.length >= 5}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] disabled:opacity-40 disabled:cursor-not-allowed border border-[#333] rounded-xl text-xs font-mono text-white transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span>Browse Files</span>
          </button>
          <input
            ref={fileInputRef as any}
            type="file"
            accept="image/*"
            multiple
            onChange={onPhotoSelect}
            className="hidden"
          />
        </div>

        {/* Previews Grid */}
        {photoPreviews.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {photoPreviews.map((src, index) => (
              <div
                key={index}
                className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#333]"
              >
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-red-600 rounded-full text-white transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
