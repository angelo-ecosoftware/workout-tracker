import React, { useEffect } from 'react';
import { Trophy, Zap, Dumbbell, Award, ArrowRight, Flame } from 'lucide-react';
import { soundEffects } from '../../../utils/sound.ts';

export interface ExercisePR {
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  previous1RM?: number;
  improvementKg?: number;
  isNew1RMRecord: boolean;
}

export interface WorkoutSummaryCelebration {
  workoutName: string;
  totalVolumeKg: number;
  totalReps: number;
  completedSetsCount: number;
  prsAchieved: ExercisePR[];
  durationMinutes?: number;
}

interface WorkoutCompletionModalProps {
  isOpen: boolean;
  summary: WorkoutSummaryCelebration | null;
  onClose: () => void;
}

export const WorkoutCompletionModal: React.FC<WorkoutCompletionModalProps> = ({
  isOpen,
  summary,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundEffects.playFinish();
    }
  }, [isOpen]);

  if (!isOpen || !summary) return null;

  const hasPRs = summary.prsAchieved.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pr-modal-title"
    >
      <div className="relative w-full max-w-lg bg-[#0e0e0e] border border-[#2a2a2a] rounded-[28px] sm:rounded-[36px] p-6 sm:p-8 shadow-[0_0_80px_rgba(192,255,0,0.18)] overflow-hidden text-center flex flex-col items-center">
        {/* Glow ambient background highlight */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#C0FF00]/15 rounded-full blur-[80px] pointer-events-none" />

        {/* Floating Trophy Icon with celebration ring */}
        <div className="relative mb-4 mt-2">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-[#181818] border border-[#C0FF00]/40 flex items-center justify-center text-[#C0FF00] shadow-[0_0_30px_rgba(192,255,0,0.25)] animate-bounce duration-1000">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 stroke-[2.5]" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C0FF00] opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#C0FF00]" />
          </span>
        </div>

        {/* Title */}
        <h3
          id="pr-modal-title"
          className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight uppercase italic"
        >
          Session <span className="text-[#C0FF00]">Crushed!</span>
        </h3>
        <p className="text-xs sm:text-sm font-sans font-semibold text-gray-400 mt-1 uppercase tracking-wider">
          {summary.workoutName}
        </p>

        {/* High-Impact Stat Badges Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full my-5">
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-3 flex flex-col items-center justify-center">
            <Dumbbell className="w-4 h-4 text-[#C0FF00] mb-1" />
            <span className="font-mono font-black text-base sm:text-lg text-white">
              {summary.totalVolumeKg.toLocaleString()}
              <span className="text-[10px] text-gray-500 font-normal ml-0.5">kg</span>
            </span>
            <span className="text-[9px] font-mono uppercase text-gray-500 font-bold tracking-wider">
              Total Volume
            </span>
          </div>

          <div className="bg-[#141414] border border-[#222] rounded-2xl p-3 flex flex-col items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="font-mono font-black text-base sm:text-lg text-white">
              {summary.completedSetsCount}
              <span className="text-[10px] text-gray-500 font-normal ml-0.5">sets</span>
            </span>
            <span className="text-[9px] font-mono uppercase text-gray-500 font-bold tracking-wider">
              Completed
            </span>
          </div>

          <div className="bg-[#141414] border border-[#222] rounded-2xl p-3 flex flex-col items-center justify-center">
            <Flame className="w-4 h-4 text-amber-400 mb-1" />
            <span className="font-mono font-black text-base sm:text-lg text-white">
              {summary.totalReps}
              <span className="text-[10px] text-gray-500 font-normal ml-0.5">reps</span>
            </span>
            <span className="text-[9px] font-mono uppercase text-gray-500 font-bold tracking-wider">
              Total Reps
            </span>
          </div>
        </div>

        {/* PR Records Section */}
        {hasPRs ? (
          <div className="w-full mb-5 text-left">
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Award className="w-4 h-4 text-[#C0FF00]" />
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#C0FF00]">
                New Records & PR Milestones ({summary.prsAchieved.length})
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {summary.prsAchieved.map((pr, idx) => (
                <div
                  key={idx}
                  className="bg-[#141414] border border-[#C0FF00]/30 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-white block truncate font-sans">
                      {pr.exerciseName}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400">
                      Best: {pr.weight} kg × {pr.reps} reps
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-[#C0FF00] block text-xs">
                      {pr.estimated1RM} kg 1RM
                    </span>
                    {pr.improvementKg && pr.improvementKg > 0 ? (
                      <span className="text-[9px] font-mono font-bold text-emerald-400">
                        +{pr.improvementKg.toFixed(1)} kg
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-gray-500 uppercase">
                        First Log
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full mb-5 bg-[#141414] border border-[#222] rounded-2xl p-3.5 text-center">
            <span className="text-xs font-mono text-gray-400">
              Consistency is key. Every set builds toward your next milestone!
            </span>
          </div>
        )}

        {/* Close / Next Workout CTA */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 sm:py-4 px-6 bg-[#C0FF00] hover:bg-[#b0eb00] active:scale-[0.98] text-black rounded-2xl font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(192,255,0,0.3)] transition-all"
        >
          <span>Continue to Logbook</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
