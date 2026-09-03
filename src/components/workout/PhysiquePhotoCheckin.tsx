import React from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

interface PhysiquePhotoCheckinProps {
  photoDrafts: string[];
  photoInputRef: React.RefObject<HTMLInputElement>;
  isCapturingPhoto: boolean;
  onPhotoSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePhoto: (index: number) => void;
  onTriggerPhotoInput: () => void;
}

export const PhysiquePhotoCheckin: React.FC<PhysiquePhotoCheckinProps> = ({
  photoDrafts,
  photoInputRef,
  isCapturingPhoto,
  onPhotoSelected,
  onRemovePhoto,
  onTriggerPhotoInput,
}) => {
  return (
    <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 flex items-center justify-center text-[#C0FF00]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wider">
              Post-Workout Physique Check-In
            </h4>
            <p className="text-[10px] text-gray-500 font-mono">
              Saved automatically to your encrypted photo gallery
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTriggerPhotoInput}
          disabled={isCapturingPhoto || photoDrafts.length >= 4}
          className="px-3 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333] text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5 text-[#C0FF00]" />
          <span>Add Snap ({photoDrafts.length}/4)</span>
        </button>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPhotoSelected}
        className="hidden"
      />

      {photoDrafts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          {photoDrafts.map((imgUri, index) => (
            <div
              key={index}
              className="relative group rounded-xl overflow-hidden border border-[#333] aspect-square bg-black/40"
            >
              <img
                src={imgUri}
                alt={`Physique check-in ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemovePhoto(index)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-black/80 hover:bg-red-600/90 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
