import React, { useState } from 'react';
import {
  Users,
  Layers,
  Utensils,
  Activity,
  Plus,
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Dumbbell,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { CoachAthleteLink, CoachSpecialty } from '../../models.ts';
import { CoachClientRoster } from './CoachClientRoster.tsx';
import { CoachInviteModal } from './CoachInviteModal.tsx';

interface CoachPortalViewProps {
  coachId: string;
  coachName?: string;
  specialty?: CoachSpecialty;
  onInspectClient: (athleteId: string, athleteName: string) => void;
  onPrescribeNutrition?: (athleteId: string, athleteName: string) => void;
  onSwitchToPersonalMode: () => void;
}

export const CoachPortalView: React.FC<CoachPortalViewProps> = ({
  coachId,
  coachName,
  specialty = 'strength',
  onInspectClient,
  onPrescribeNutrition,
  onSwitchToPersonalMode,
}) => {
  const [activeCoachSection, setActiveCoachSection] = useState<'roster' | 'templates' | 'macros' | 'activity'>('roster');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 1. Header Banner & Mode Switcher */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C0FF00]/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C0FF00] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C0FF00] font-bold">
                Coach Management Workspace
              </span>
              <span className="text-[9px] font-mono uppercase bg-[#222] text-gray-400 px-2 py-0.5 rounded-full border border-[#333]">
                {specialty} Trainer
              </span>
            </div>
            
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-[#C0FF00]" />
              Trainer Command Center
            </h1>
            <p className="font-sans text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
              Supervise athlete progress, program progressive overload splits, prescribe macronutrients, and track roster compliance.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
            <button
              type="button"
              onClick={onSwitchToPersonalMode}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#181818] hover:bg-[#222] border border-[#333] text-gray-300 hover:text-white text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              title="Switch to your personal athlete workout log book"
            >
              <Dumbbell className="w-3.5 h-3.5 text-[#C0FF00]" />
              <span>Personal Workouts</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInviteOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_20px_rgba(192,255,0,0.2)]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Invite Athlete</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Coach Navigation Tabs */}
      <div className="flex bg-[#111] border border-[#222] rounded-2xl p-1.5 w-full max-w-2xl mx-auto font-sans flex-wrap gap-1 shadow-md">
        <button
          type="button"
          onClick={() => setActiveCoachSection('roster')}
          className={`flex-1 py-2.5 px-3 text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeCoachSection === 'roster'
              ? 'bg-[#C0FF00] text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-[#181818]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Client Roster</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCoachSection('templates')}
          className={`flex-1 py-2.5 px-3 text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeCoachSection === 'templates'
              ? 'bg-[#C0FF00] text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-[#181818]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Program Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCoachSection('macros')}
          className={`flex-1 py-2.5 px-3 text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeCoachSection === 'macros'
              ? 'bg-[#00ade6] text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-[#181818]'
          }`}
        >
          <Utensils className="w-3.5 h-3.5" />
          <span>Nutrition Plans</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCoachSection('activity')}
          className={`flex-1 py-2.5 px-3 text-xs uppercase tracking-wider font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeCoachSection === 'activity'
              ? 'bg-[#C0FF00] text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-[#181818]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Activity Feed</span>
        </button>
      </div>

      {/* 3. Section Renderers */}
      <div>
        {activeCoachSection === 'roster' && (
          <CoachClientRoster
            coachId={coachId}
            coachName={coachName}
            specialty={specialty}
            onInspectClient={onInspectClient}
            onPrescribeNutrition={onPrescribeNutrition}
          />
        )}

        {activeCoachSection === 'templates' && (
          <div className="p-8 text-center bg-[#111] border border-[#222] rounded-3xl space-y-4">
            <Layers className="w-10 h-10 text-[#C0FF00] mx-auto opacity-70" />
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">
              Program Template Library
            </h3>
            <p className="text-gray-400 text-xs font-sans max-w-md mx-auto">
              Build and organize standard progressive overload templates (e.g., 4-Day Upper/Lower, 6-Day PPL) to assign to any client in 1-tap.
            </p>
            <div className="pt-2">
              <span className="text-[11px] font-mono text-[#C0FF00] bg-[#C0FF00]/10 border border-[#C0FF00]/30 px-3 py-1.5 rounded-xl">
                ✦ Templates auto-populate when creating Routine Proposals
              </span>
            </div>
          </div>
        )}

        {activeCoachSection === 'macros' && (
          <div className="p-8 text-center bg-[#111] border border-[#222] rounded-3xl space-y-4">
            <Utensils className="w-10 h-10 text-[#00ade6] mx-auto opacity-70" />
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">
              Macro & Calorie Plans
            </h3>
            <p className="text-gray-400 text-xs font-sans max-w-md mx-auto">
              Manage client dietary prescriptions, calorie deficits/surpluses, and protein targets. Select any client in your roster to publish nutrition plans.
            </p>
          </div>
        )}

        {activeCoachSection === 'activity' && (
          <div className="p-8 text-center bg-[#111] border border-[#222] rounded-3xl space-y-4">
            <Activity className="w-10 h-10 text-[#C0FF00] mx-auto opacity-70" />
            <h3 className="font-display font-bold text-lg text-white uppercase tracking-tight">
              Live Roster Activity Feed
            </h3>
            <p className="text-gray-400 text-xs font-sans max-w-md mx-auto">
              Real-time feed of client workout completions, personal records (1RM spikes), and missed training alerts.
            </p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <CoachInviteModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          coachId={coachId}
          coachName={coachName}
          specialty={specialty}
        />
      )}
    </div>
  );
};
