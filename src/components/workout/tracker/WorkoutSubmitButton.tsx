import React from 'react';
import { Dumbbell, Loader2, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';

interface WorkoutSubmitButtonProps {
  errorMsg: string | null;
  successMsg: string | null;
  loggingWorkout: boolean;
  isUploadingPhotos: boolean;
  isSessionActive: boolean;
  onStartWorkout?: () => void;
  onSubmit: () => void;
}

export const WorkoutSubmitButton: React.FC<WorkoutSubmitButtonProps> = ({
  errorMsg,
  successMsg,
  loggingWorkout,
  isUploadingPhotos,
  isSessionActive,
  onSubmit,
}) => {
  return (
    <div className="space-y-3 pt-2">
      {errorMsg && (
        <div
          role="alert"
          className="p-4 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded-xl font-mono"
        >
          <span className="font-bold uppercase tracking-widest text-red-400">ERROR:</span> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-4 bg-emerald-950/50 border border-emerald-900/60 text-[#C0FF00] text-xs rounded-xl font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C0FF00] shrink-0" />
            <span className="uppercase tracking-wide font-black">{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('switch_app_tab', { detail: 'history' }));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C0FF00] text-black font-display font-black text-[11px] uppercase tracking-wider hover:bg-[#a6dc00] transition-colors cursor-pointer self-start sm:self-auto shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0FF00]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>View in Log Book</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!isSessionActive || loggingWorkout || isUploadingPhotos}
        aria-label="Submit workout"
        title={!isSessionActive ? 'Start workout in the header card above to enable submission' : 'Submit workout'}
        className={`w-full min-h-[48px] flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] ${
          !isSessionActive
            ? 'bg-[#141414] text-gray-500 border border-[#262626] cursor-not-allowed opacity-80'
            : 'bg-white hover:bg-gray-100 text-black shadow-[0_0_25px_rgba(255,255,255,0.08)] hover:shadow-[0_0_35px_rgba(255,255,255,0.15)] cursor-pointer active:scale-[0.99]'
        }`}
      >
        {loggingWorkout || isUploadingPhotos ? (
          <Loader2 className="w-4.5 h-4.5 animate-spin text-black" />
        ) : (
          <Dumbbell className={`w-4.5 h-4.5 ${!isSessionActive ? 'text-gray-500' : 'fill-black text-black'}`} />
        )}
        <span>
          {isUploadingPhotos
            ? 'UPLOADING PHOTOS...'
            : loggingWorkout
            ? 'SAVING WORKOUT...'
            : 'SUBMIT WORKOUT'}
        </span>
      </button>

      {!isSessionActive && (
        <p className="text-center text-[11px] font-mono text-gray-400">
          Tap <span className="text-[#C0FF00] font-bold">Start Workout</span> in the header card above to begin tracking and enable submission.
        </p>
      )}
    </div>
  );
};
