import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Link as LinkIcon,
  Mail,
  Copy,
  Check,
  X,
  Sparkles,
  Users,
} from 'lucide-react';
import { CoachSpecialty } from '../../models.ts';
import { createCoachInvite } from '../../lib/supabaseData.ts';

interface CoachInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  coachName?: string;
  specialty?: CoachSpecialty;
  onInviteCreated?: () => void;
}

export const CoachInviteModal: React.FC<CoachInviteModalProps> = ({
  isOpen,
  onClose,
  coachId,
  coachName,
  specialty = 'strength',
  onInviteCreated,
}) => {
  const [athleteEmail, setAthleteEmail] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<CoachSpecialty>(specialty);
  const [copiedLink, setCopiedLink] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const generateInviteLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}?coach_invite=${code}`;
  };

  const handleCreateInvite = async (e?: React.FormEvent): Promise<string | null> => {
    if (e) e.preventDefault();
    try {
      const invite = await createCoachInvite(
        coachId,
        selectedSpecialty,
        athleteEmail.trim() || undefined,
        coachName
      );
      const code = invite.inviteCode || null;
      setCreatedInviteCode(code);
      setStatusMsg({ type: 'success', text: 'Invitation created successfully!' });
      if (onInviteCreated) onInviteCreated();
      return code;
    } catch (err: any) {
      console.error('Failed to create coach invite:', err);
      setStatusMsg({ type: 'error', text: 'Failed to generate invitation.' });
      return null;
    }
  };

  const handleCopyLink = async () => {
    let code = createdInviteCode;
    if (!code) {
      code = await handleCreateInvite();
    }
    if (!code) return;
    const link = generateInviteLink(code);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      window.prompt('Copy invite link:', link);
    }
  };

  useEffect(() => {
    if (isOpen && coachId) {
      // Pre-generate an invite code on open if none exists yet
      if (!createdInviteCode) {
        handleCreateInvite();
      }
    }
  }, [isOpen, coachId]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-[#222222] rounded-[24px] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">
                Invite Athlete Client
              </h2>
              <p className="text-[10px] font-mono text-gray-400">
                Generate a hybrid QR/link or send direct email invite
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

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mx-4 mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-mono font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <X className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Specialty Selector */}
          <div>
            <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1">
              Coaching Specialty
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
              {(['strength', 'nutrition', 'head_coach'] as const).map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`py-2 px-2 rounded-xl border text-center transition-all capitalize font-bold ${
                    selectedSpecialty === spec
                      ? 'bg-[#C0FF00]/15 border-[#C0FF00] text-[#C0FF00]'
                      : 'bg-[#181818] border-[#282828] text-gray-400 hover:text-white'
                  }`}
                >
                  {spec === 'head_coach' ? 'Head Coach' : spec}
                </button>
              ))}
            </div>
          </div>

          {/* Option A: Direct Email Invite */}
          <form onSubmit={handleCreateInvite} className="p-3.5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
              <Mail className="w-3.5 h-3.5 text-[#C0FF00]" />
              <span>Direct Email Invite</span>
            </div>

            <input
              type="email"
              placeholder="athlete@example.com"
              value={athleteEmail}
              onChange={(e) => setAthleteEmail(e.target.value)}
              className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Send Email Invite
            </button>
          </form>

          {/* Option B: Shareable Link / QR Code */}
          <div className="p-3.5 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase">
                <LinkIcon className="w-3.5 h-3.5 text-[#C0FF00]" />
                <span>Instant Shareable Link & QR</span>
              </div>
              <span className="text-[10px] font-mono text-gray-500">In-person scan</span>
            </div>

            {createdInviteCode && (
              <div className="p-2.5 rounded-xl bg-[#111] border border-[#333] flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-gray-300 truncate">
                  {generateInviteLink(createdInviteCode)}
                </span>
                <span className="text-[9px] font-mono font-bold uppercase text-[#C0FF00] bg-[#C0FF00]/10 px-2 py-0.5 rounded">
                  {createdInviteCode}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2.5 rounded-xl bg-[#1f1f1f] hover:bg-[#282828] border border-[#333] text-gray-200 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#C0FF00]" />
                  <span className="text-[#C0FF00]">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Shareable Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
