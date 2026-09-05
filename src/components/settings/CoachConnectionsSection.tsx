import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Check,
  X,
  Trash2,
  Sparkles,
  Layers,
  Dumbbell,
  Loader2,
  Clock,
} from 'lucide-react';
import { CoachAthleteLink, RoutineProposal } from '../../models.ts';
import {
  fetchCoachAthleteLinks,
  acceptCoachLink,
  revokeCoachLink,
  fetchRoutineProposals,
} from '../../lib/supabaseData.ts';
import { ProposedRoutineReviewModal } from '../routine/ProposedRoutineReviewModal.tsx';

interface CoachConnectionsSectionProps {
  userId: string;
}

export const CoachConnectionsSection: React.FC<CoachConnectionsSectionProps> = ({ userId }) => {
  const [coaches, setCoaches] = useState<CoachAthleteLink[]>([]);
  const [proposals, setProposals] = useState<RoutineProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<RoutineProposal | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadCoachingData = async () => {
    try {
      setLoading(true);
      const [linksData, proposalsData] = await Promise.all([
        fetchCoachAthleteLinks(userId),
        fetchRoutineProposals(userId),
      ]);
      setCoaches(linksData.coaches);
      setProposals(proposalsData.filter((p) => p.status === 'proposed'));
    } catch (err: unknown) {
      console.error('Failed to load coach connections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadCoachingData();
    }
  }, [userId]);

  const handleAcceptInvite = async (linkId: string, coachName?: string) => {
    try {
      await acceptCoachLink(linkId, userId);
      setStatusMsg({ type: 'success', text: `Connected with ${coachName || 'Coach'}!` });
      await loadCoachingData();
    } catch (err: unknown) {
      console.error('Failed to accept coach link:', err);
    }
  };

  const handleDisconnectCoach = async (linkId: string, coachName?: string) => {
    if (!window.confirm(`Are you sure you want to disconnect from ${coachName || 'this coach'}? You will retain all your saved workouts and logs.`)) {
      return;
    }

    try {
      await revokeCoachLink(linkId);
      setCoaches((prev) => prev.filter((c) => c.id !== linkId));
      setStatusMsg({ type: 'success', text: `Disconnected from ${coachName || 'coach'}.` });
    } catch (err: unknown) {
      console.error('Failed to disconnect coach:', err);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#161616] border border-[#282828] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#C0FF00]" />
          <h4 className="text-white text-xs sm:text-sm font-bold uppercase tracking-wide">
            Connected Coaches ({coaches.length})
          </h4>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 ${
            statusMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Pending Routine Proposals */}
      {proposals.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase font-bold text-[#C0FF00] tracking-wider block">
            Pending Routine Proposals ({proposals.length})
          </span>

          {proposals.map((prop) => (
            <div
              key={prop.id}
              className="p-3 rounded-xl bg-[#1c2414] border border-[#C0FF00]/40 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <span className="font-bold text-white text-xs block truncate">
                  {prop.title}
                </span>
                <span className="text-[10px] font-mono text-gray-300">
                  Proposed by {prop.coachName || 'Coach'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProposal(prop)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#C0FF00] text-black font-display font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                <span>Review & Apply</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active Coaches List */}
      {loading ? (
        <div className="py-4 flex items-center justify-center gap-2 text-xs text-gray-500 font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C0FF00]" />
          <span>Checking coach connections...</span>
        </div>
      ) : coaches.length === 0 ? (
        <p className="text-xs text-gray-500 font-sans">
          No coaches connected. Connect with a trainer to receive customized routine proposals and guidance.
        </p>
      ) : (
        <div className="space-y-2">
          {coaches.map((coach) => (
            <div
              key={coach.id}
              className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#252525]"
            >
              <div>
                <span className="font-bold text-white text-xs block">
                  {coach.coachName || 'Coach'}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-0.5">
                  <span className="capitalize text-[#C0FF00] font-bold">{coach.specialty} Coach</span>
                  {coach.coachEmail && <span>• {coach.coachEmail}</span>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDisconnectCoach(coach.id, coach.coachName)}
                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                aria-label="Disconnect coach"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Proposal Review Modal */}
      {selectedProposal && (
        <ProposedRoutineReviewModal
          isOpen={Boolean(selectedProposal)}
          onClose={() => setSelectedProposal(null)}
          userId={userId}
          proposal={selectedProposal}
          onProposalApplied={loadCoachingData}
        />
      )}
    </div>
  );
};
