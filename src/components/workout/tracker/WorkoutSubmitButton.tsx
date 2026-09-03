import React from 'react';
import { Dumbbell, Loader2, CheckCircle2 } from 'lucide-react';

interface WorkoutSubmitButtonProps {
  errorMsg: string | null;
  successMsg: string | null;
  loggingWorkout: boolean;
  isUploadingPhotos: boolean;
  onSubmit: () => void;
}

export const WorkoutSubmitButton: React.FC<WorkoutSubmitButtonProps> = ({
  errorMsg,
  successMsg,
  loggingWorkout,
  isUploadingPhotos,
  onSubmit,
}) => {
  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded-xl font-mono">
          <span className="font-bold uppercase tracking-widest text-red-400">ERROR:</span> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 text-[#C0FF00] text-xs rounded-xl font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#C0FF00]" />
          <span className="uppercase tracking-wide font-black">{successMsg}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={loggingWorkout || isUploadingPhotos}
        className="w-full flex items-center justify-center gap-2.5 py-4 bg-white hover:bg-gray-100 disabled:bg-[#1a1a1a] disabled:text-gray-600 disabled:border-[#222] text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.06)] cursor-pointer"
      >
        {loggingWorkout || isUploadingPhotos ? (
          <Loader2 className="w-4 h-4 animate-spin text-black" />
        ) : (
          <Dumbbell className="w-4.5 h-4.5 fill-black" />
        )}
        {isUploadingPhotos ? 'UPLOADING PHOTOS...' : 'SUBMIT WORKOUT'}
      </button>
    </div>
  );
};
