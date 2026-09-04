import React, { useState } from 'react';
import { UserCheck, Sparkles, Check, X, Loader2, Award } from 'lucide-react';
import { CoachAthleteLink } from '../../models.ts';
import { acceptCoachLinkByCode } from '../../lib/supabaseData.ts';

interface CoachInviteAcceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  athleteId: string;
  athleteName?: string;
  coachInviteData?: CoachAthleteLink | null;
  onAccepted?: () => void;
}

export const CoachInviteAcceptModal: React.FC<CoachInviteAcceptModalProps> = ({
  isOpen,
  onClose,
  inviteCode,
  athleteId,
  athleteName,
  coachInviteData,
  onAccepted,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const coachName = coachInviteData?.coachName || 'Your Coach';
  const specialty = coachInviteData?.specialty || 'strength';

  const handleAccept = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await acceptCoachLinkByCode(inviteCode, athleteId, athleteName);
      if (!res) {
        throw new Error('This invitation code is invalid, expired, or has already been accepted.');
      }
      setSuccess(true);
      setTimeout(() => {
        if (onAccepted) onAccepted();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept coach invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-[#222222] rounded-[28px] w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden text-left"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#C0FF00]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-[#C0FF00] text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Coaching Invitation
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-500 hover:text-white hover:bg-[#222] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-display font-black text-white uppercase tracking-tight leading-tight">
              Connect with <span className="text-[#C0FF00]">{coachName}</span>
            </h2>
            <p className="text-gray-400 font-sans text-xs mt-1 leading-relaxed">
              {coachName} has invited you to connect as your <strong>{specialty} coach</strong>. Connecting allows them to supervise your workouts and send customized routine proposals.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#282828] space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>Invite Code:</span>
              <span className="font-bold text-white bg-[#222] px-2 py-0.5 rounded">{inviteCode}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>Coaching Specialty:</span>
              <span className="font-bold text-[#C0FF00] capitalize">{specialty}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-300 text-xs rounded-xl font-mono">
              {errorMsg}
            </div>
          )}

          {success ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Connected with {coachName}!
            </div>
          ) : (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 rounded-xl border border-[#333] text-gray-400 hover:text-white text-xs font-mono font-bold transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={loading}
                className="flex-[2] py-3 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <UserCheck className="w-4 h-4 stroke-[2.5]" />}
                <span>Accept Connection</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
