import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Play,
  Layers,
  Dumbbell,
  UserCheck,
  Loader2,
} from 'lucide-react';
import { RoutineProposal, Workout, Exercise } from '../../models.ts';
import {
  updateRoutineProposalStatus,
  saveRoutineProgramToLibrary,
  saveWorkoutsAndExercises,
  setActiveRoutineProgram,
} from '../../lib/supabaseData.ts';

interface ProposedRoutineReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  proposal: RoutineProposal | null;
  onProposalApplied?: () => void;
}

export const ProposedRoutineReviewModal: React.FC<ProposedRoutineReviewModalProps> = ({
  isOpen,
  onClose,
  userId,
  proposal,
  onProposalApplied,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !proposal) return null;

  const workouts: (Workout & { exercises: Exercise[] })[] =
    proposal.programPayload?.workouts || [];

  const handleApplyProposal = async () => {
    try {
      setLoading(true);
      // 1. Save to athlete's saved routines library
      const savedProg = await saveRoutineProgramToLibrary(
        userId,
        proposal.title,
        proposal.programPayload,
        proposal.description || undefined,
        proposal.coachId
      );

      // 2. Sync to active workouts
      if (workouts.length > 0) {
        await saveWorkoutsAndExercises(userId, workouts);
        await setActiveRoutineProgram(userId, savedProg.id);
      }

      // 3. Mark proposal as applied
      await updateRoutineProposalStatus(proposal.id, 'applied');

      setStatusMsg({ type: 'success', text: `Activated "${proposal.title}" as your routine!` });
      setTimeout(() => {
        if (onProposalApplied) onProposalApplied();
        onClose();
        window.location.reload();
      }, 800);
    } catch (err: unknown) {
      console.error('Failed to apply routine proposal:', err);
      setStatusMsg({ type: 'error', text: 'Failed to apply proposed routine.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectProposal = async () => {
    try {
      setLoading(true);
      await updateRoutineProposalStatus(proposal.id, 'rejected');
      if (onProposalApplied) onProposalApplied();
      onClose();
    } catch (err: unknown) {
      console.error('Failed to decline proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-[#222222] rounded-[24px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">
                Proposed Routine Review
              </h2>
              <p className="text-[10px] font-mono text-gray-400">
                Proposed by {proposal.coachName || 'Coach'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#222] rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status */}
        {statusMsg && (
          <div
            className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-mono font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#282828] space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-white text-base uppercase tracking-tight">
                {proposal.title}
              </span>
              <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-full">
                {workouts.length} Training Days
              </span>
            </div>

            {proposal.description && (
              <p className="text-xs text-gray-300 font-sans leading-relaxed">
                {proposal.description}
              </p>
            )}
          </div>

          {/* Workouts Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-bold">
              Routine Days & Prescribed Exercises
            </h3>

            {workouts.map((w, idx) => (
              <div
                key={w.id || idx}
                className="p-3.5 rounded-2xl bg-[#141414] border border-[#222] space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-[#252525] pb-2">
                  <span className="font-display font-bold text-white text-xs uppercase tracking-wide flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#C0FF00]" />
                    {w.name}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    {w.exercises?.length || 0} exercises
                  </span>
                </div>

                <div className="space-y-1.5">
                  {(w.exercises || []).map((ex, exIdx) => (
                    <div
                      key={ex.id || exIdx}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#181818] text-xs"
                    >
                      <span className="text-gray-200 font-medium truncate">{ex.name}</span>
                      <span className="text-[10px] font-mono font-bold text-[#C0FF00] shrink-0">
                        {ex.targetSets} sets × {ex.targetRepMin}-{ex.targetRepMax} reps
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#222] bg-[#141414] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRejectProposal}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-[#333] text-gray-400 hover:text-red-400 hover:border-red-500/40 font-mono text-xs font-bold transition-colors cursor-pointer"
          >
            Decline Proposal
          </button>

          <button
            type="button"
            onClick={handleApplyProposal}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black italic uppercase text-xs tracking-wider transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" /> Save to My Routines & Activate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
