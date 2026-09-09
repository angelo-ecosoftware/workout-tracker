import React from 'react';
import { Dumbbell, Loader2, CheckCircle2, ArrowRight, BookOpen, Play } from 'lucide-react';

interface WorkoutSubmitButtonProps {
  errorMsg: string | null;
  successMsg: string | null;
  loggingWorkout: boolean;
  isUploadingPhotos: boolean;
  isSessionActive: boolean;
  onStartWorkout: () => void;
  onSubmit: () => void;
}

export const WorkoutSubmitButton: React.FC<WorkoutSubmitButtonProps> = ({
  errorMsg,
  successMsg,
  loggingWorkout,
  isUploadingPhotos,
  isSessionActive,
  onStartWorkout,
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
        <div className="p-4 bg-emerald-950/50 border border-emerald-900/60 text-[#C0FF00] text-xs rounded-xl font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C0FF00] shrink-0" />
            <span className="uppercase tracking-wide font-black">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('switch_app_tab', { detail: 'history' }));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C0FF00] text-black font-display font-black text-[11px] uppercase tracking-wider hover:bg-[#a6dc00] transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View in Log Book</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {!isSessionActive ? (
        <button
          type="button"
          onClick={onStartWorkout}
          className="w-full flex items-center justify-center gap-2.5 py-4 bg-[#C0FF00] hover:bg-[#b0f000] text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 shadow-[0_0_25px_rgba(192,255,0,0.25)] hover:shadow-[0_0_35px_rgba(192,255,0,0.4)] cursor-pointer active:scale-98"
        >
          <Play className="w-4.5 h-4.5 fill-black text-black" />
          <span>START WORKOUT</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={loggingWorkout || isUploadingPhotos}
          className="w-full flex items-center justify-center gap-2.5 py-4 bg-white hover:bg-gray-100 disabled:bg-[#1a1a1a] disabled:text-gray-600 disabled:border-[#222] text-black rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.06)] cursor-pointer active:scale-98"
        >
          {loggingWorkout || isUploadingPhotos ? (
            <Loader2 className="w-4 h-4 animate-spin text-black" />
          ) : (
            <Dumbbell className="w-4.5 h-4.5 fill-black" />
          )}
          <span>{isUploadingPhotos ? 'UPLOADING PHOTOS...' : 'SUBMIT WORKOUT'}</span>
        </button>
      )}
    </div>
  );
};
