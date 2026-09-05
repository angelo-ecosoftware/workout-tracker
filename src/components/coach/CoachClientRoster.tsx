import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Eye,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Loader2,
  Utensils,
  Dumbbell,
} from 'lucide-react';
import { CoachAthleteLink, CoachSpecialty } from '../../models.ts';
import { fetchCoachAthleteLinks, revokeCoachLink } from '../../lib/supabaseData.ts';
import { CoachInviteModal } from './CoachInviteModal.tsx';
import { RoutineProposalComposer } from './RoutineProposalComposer.tsx';

interface CoachClientRosterProps {
  coachId: string;
  coachName?: string;
  specialty?: CoachSpecialty;
  onInspectClient: (athleteId: string, athleteName: string) => void;
  onPrescribeNutrition?: (athleteId: string, athleteName: string) => void;
}

export const CoachClientRoster: React.FC<CoachClientRosterProps> = ({
  coachId,
  coachName,
  specialty = 'strength',
  onInspectClient,
  onPrescribeNutrition,
}) => {
  const [clients, setClients] = useState<CoachAthleteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [proposalTargetClient, setProposalTargetClient] = useState<CoachAthleteLink | null>(null);

  const loadRoster = async () => {
    try {
      setLoading(true);
      const data = await fetchCoachAthleteLinks(coachId);
      setClients(data.clients);
    } catch (err: unknown) {
      console.error('Failed to load coach client roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coachId) {
      loadRoster();
    }
  }, [coachId]);

  const handleEndRelationship = async (linkId: string, athleteName?: string) => {
    if (!window.confirm(`Are you sure you want to conclude the coaching relationship with ${athleteName || 'this athlete'}?`)) {
      return;
    }

    try {
      await revokeCoachLink(linkId);
      setClients((prev) => prev.filter((c) => c.id !== linkId));
    } catch (err: unknown) {
      console.error('Failed to revoke coach client link:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C0FF00] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C0FF00] font-bold">
                Coach Management Hub
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
              <Users className="w-7 h-7 text-[#C0FF00]" />
              Client Roster & Adherence
            </h1>
            <p className="font-sans text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
              Supervise athlete compliance, propose progressive overload training splits, and monitor recovery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(192,255,0,0.2)] self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Invite Client</span>
          </button>
        </div>
      </div>

      {/* Client List Section */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#222] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-display text-sm sm:text-base font-black uppercase tracking-wider text-white">
              Active Athletes ({clients.filter((c) => c.status === 'accepted').length})
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-500">
            {clients.length} total connections
          </span>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#C0FF00]" />
            <span className="text-xs font-mono">Loading client roster...</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-8 text-center bg-[#141414] border border-[#222] rounded-2xl space-y-3">
            <Sparkles className="w-8 h-8 text-[#C0FF00] mx-auto opacity-60" />
            <h3 className="text-white font-bold text-sm">No Connected Athletes Yet</h3>
            <p className="text-gray-400 text-xs max-w-sm mx-auto font-sans">
              Send your first coaching invite via QR code, link, or email to start guiding client training.
            </p>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C0FF00] text-black font-display font-black text-xs uppercase tracking-wider"
            >
              <Plus className="w-3.5 h-3.5" /> Invite First Client
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const isAccepted = client.status === 'accepted';
              return (
                <div
                  key={client.id}
                  className="p-4 rounded-2xl bg-[#161616] border border-[#262626] hover:border-[#333] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-display font-black text-white text-base tracking-tight">
                        {client.athleteName || 'Athlete Client'}
                      </span>
                      {client.athleteEmail && (
                        <span className="text-xs font-mono text-gray-400">
                          ({client.athleteEmail})
                        </span>
                      )}

                      {/* Status Badges */}
                      {isAccepted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> 🟢 On Track
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          <Clock className="w-3 h-3" /> Pending Acceptance
                        </span>
                      )}

                      <span className="text-[10px] font-mono uppercase bg-[#222] text-gray-400 px-2 py-0.5 rounded">
                        {client.specialty}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono text-gray-500 pt-0.5">
                      <span>Connected since {new Date(client.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {isAccepted && (
                      <>
                        <button
                          type="button"
                          onClick={() => onInspectClient(client.athleteId, client.athleteName || 'Athlete')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f1f1f] hover:bg-[#282828] border border-[#333] text-gray-200 text-xs font-mono font-bold transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#C0FF00]" />
                          <span>Inspect</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setProposalTargetClient(client)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C0FF00]/10 hover:bg-[#C0FF00]/20 border border-[#C0FF00]/30 text-[#C0FF00] text-xs font-mono font-bold transition-all cursor-pointer"
                        >
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>Propose Routine</span>
                        </button>

                        {onPrescribeNutrition && (
                          <button
                            type="button"
                            onClick={() => onPrescribeNutrition(client.athleteId, client.athleteName || 'Athlete')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00ade6]/10 hover:bg-[#00ade6]/20 border border-[#00ade6]/30 text-[#00ade6] text-xs font-mono font-bold transition-all cursor-pointer"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Prescribe Macros</span>
                          </button>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleEndRelationship(client.id, client.athleteName)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                      aria-label="End relationship"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <CoachInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          coachId={coachId}
          coachName={coachName}
          specialty={specialty}
          onInviteCreated={loadRoster}
        />
      )}

      {/* Proposal Composer Modal */}
      {proposalTargetClient && (
        <RoutineProposalComposer
          isOpen={Boolean(proposalTargetClient)}
          onClose={() => setProposalTargetClient(null)}
          coachId={coachId}
          coachName={coachName}
          athleteId={proposalTargetClient.athleteId}
          athleteName={proposalTargetClient.athleteName || 'Athlete Client'}
        />
      )}
    </div>
  );
};
