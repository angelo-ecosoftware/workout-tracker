import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  Bell,
  Sliders,
  Dumbbell,
  Utensils,
  Plus,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react';
import { CoachSpecialty } from '../../models.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { CoachInviteModal } from '../coach/CoachInviteModal.tsx';

export const CoachSettingsSection: React.FC = () => {
  const { user, specialty, requestCoachRole } = useAuth();
  const [selectedSpecialty, setSelectedSpecialty] = useState<CoachSpecialty>(specialty || 'strength');
  const [defaultRestSeconds, setDefaultRestSeconds] = useState<number>(() => {
    const val = localStorage.getItem('coach_default_rest_seconds');
    return val ? parseInt(val, 10) : 90;
  });
  const [inactivityDaysAlert, setInactivityDaysAlert] = useState<number>(() => {
    const val = localStorage.getItem('coach_inactivity_days_alert');
    return val ? parseInt(val, 10) : 3;
  });
  const [notifyOnPr, setNotifyOnPr] = useState<boolean>(() => {
    return localStorage.getItem('coach_notify_on_pr') !== 'false';
  });
  const [notifyOnSessionLogged, setNotifyOnSessionLogged] = useState<boolean>(() => {
    return localStorage.getItem('coach_notify_on_session') !== 'false';
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('coach_default_rest_seconds', defaultRestSeconds.toString());
  }, [defaultRestSeconds]);

  useEffect(() => {
    localStorage.setItem('coach_inactivity_days_alert', inactivityDaysAlert.toString());
  }, [inactivityDaysAlert]);

  useEffect(() => {
    localStorage.setItem('coach_notify_on_pr', String(notifyOnPr));
  }, [notifyOnPr]);

  useEffect(() => {
    localStorage.setItem('coach_notify_on_session', String(notifyOnSessionLogged));
  }, [notifyOnSessionLogged]);

  const handleSpecialtyChange = async (newSpec: CoachSpecialty) => {
    setSelectedSpecialty(newSpec);
    if (user?.uid) {
      await requestCoachRole(newSpec);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* 1. Coaching Specialty & Profile */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C0FF00]" />
            <span className="font-bold text-xs uppercase text-white font-display">
              Coaching Specialty
            </span>
          </div>
          {saveSuccess && (
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Updated
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {(['strength', 'nutrition', 'head_coach'] as const).map((spec) => (
            <button
              key={spec}
              type="button"
              onClick={() => handleSpecialtyChange(spec)}
              className={`py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold capitalize transition-all ${
                selectedSpecialty === spec
                  ? 'bg-[#C0FF00] text-black shadow-sm'
                  : 'bg-[#141414] border border-[#262626] text-gray-400 hover:text-white'
              }`}
            >
              {spec === 'head_coach' ? 'Head Coach' : spec}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Client Quick Invite Action */}
      <button
        type="button"
        onClick={() => setIsInviteModalOpen(true)}
        className="flex items-center justify-between gap-3 w-full p-2.5 sm:p-3 bg-[#1a1a1a] border border-[#222] hover:border-[#C0FF00]/40 rounded-xl text-left transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00] group-hover:bg-[#C0FF00] group-hover:text-black shrink-0 transition-colors">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs sm:text-sm text-white truncate">
              Invite Client to Roster
            </div>
            <div className="text-[11px] text-gray-500 truncate">
              Generate shareable link, QR code, or email
            </div>
          </div>
        </div>
        <div className="text-[10px] font-mono font-bold text-[#C0FF00] uppercase tracking-wider shrink-0 bg-[#C0FF00]/10 border border-[#C0FF00]/20 px-2 py-0.5 rounded group-hover:bg-[#C0FF00] group-hover:text-black transition-colors">
          Invite
        </div>
      </button>

      {/* 3. Programming Defaults & Presets */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2 text-white font-display text-xs font-bold uppercase">
          <Sliders className="w-3.5 h-3.5 text-[#C0FF00]" />
          <span>Routine Programming Presets</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400 text-[11px]">Default Rest Timer for Proposals:</span>
            <span className="font-mono font-bold text-[#C0FF00]">{defaultRestSeconds}s</span>
          </div>
          <input
            type="range"
            min="30"
            max="240"
            step="15"
            value={defaultRestSeconds}
            onChange={(e) => setDefaultRestSeconds(parseInt(e.target.value, 10))}
            className="w-full accent-[#C0FF00] bg-[#141414] h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[9px] font-mono text-gray-600">
            <span>30s</span>
            <span>90s</span>
            <span>180s</span>
            <span>240s</span>
          </div>
        </div>
      </div>

      {/* 4. Client Compliance & Activity Alerts */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-3 space-y-2.5">
        <div className="flex items-center gap-2 text-white font-display text-xs font-bold uppercase">
          <Bell className="w-3.5 h-3.5 text-[#C0FF00]" />
          <span>Client Compliance Alerts</span>
        </div>

        <div className="space-y-2 text-xs">
          <label className="flex items-center justify-between text-gray-300 cursor-pointer">
            <span className="text-[11px]">Alert on Inactive Client (🔴 3+ Days)</span>
            <input
              type="checkbox"
              checked={inactivityDaysAlert > 0}
              onChange={(e) => setInactivityDaysAlert(e.target.checked ? 3 : 0)}
              className="accent-[#C0FF00] w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between text-gray-300 cursor-pointer">
            <span className="text-[11px]">Alert on Client Personal Record (1RM PR)</span>
            <input
              type="checkbox"
              checked={notifyOnPr}
              onChange={(e) => setNotifyOnPr(e.target.checked)}
              className="accent-[#C0FF00] w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between text-gray-300 cursor-pointer">
            <span className="text-[11px]">Notify when Client Logs a Workout</span>
            <input
              type="checkbox"
              checked={notifyOnSessionLogged}
              onChange={(e) => setNotifyOnSessionLogged(e.target.checked)}
              className="accent-[#C0FF00] w-4 h-4"
            />
          </label>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteModalOpen && user && (
        <CoachInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          coachId={user.uid}
          coachName={user.displayName}
          specialty={selectedSpecialty}
        />
      )}
    </div>
  );
};
