import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  Clock,
  Sparkles,
  Award,
  X,
  Dumbbell,
  Utensils,
  ShieldCheck,
} from 'lucide-react';
import { CoachSpecialty } from '../../models.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface CoachAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CoachAccountModal: React.FC<CoachAccountModalProps> = ({ isOpen, onClose }) => {
  const { user, roleInfo, isCoach, isApprovedCoach, specialty: currentSpecialty, requestCoachRole } = useAuth();
  const [selectedSpecialty, setSelectedSpecialty] = useState<CoachSpecialty>(currentSpecialty || 'strength');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      await requestCoachRole(selectedSpecialty);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit coach upgrade:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111111] border border-[#222222] rounded-[24px] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C0FF00]/10 border border-[#C0FF00]/20 flex items-center justify-center text-[#C0FF00]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">
                Coach Account & Permissions
              </h2>
              <p className="text-[10px] font-mono text-gray-400">
                Supervise athletes, assign splits, and prescribe macros
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

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Current Status Badge */}
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-gray-500 uppercase font-bold">
                Account Role Status
              </span>
              <div className="font-display font-black text-white text-sm uppercase flex items-center gap-2">
                {isCoach ? (
                  <>
                    <span className="text-[#C0FF00]">Coach Active</span>
                    <span className="text-[10px] font-mono text-gray-400 lowercase">
                      ({currentSpecialty || 'strength'})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-300">Standard Athlete</span>
                )}
              </div>
            </div>

            {isCoach && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" /> Enabled
              </span>
            )}
          </div>

          {/* Coaching Capabilities Overview */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase font-bold text-gray-400 tracking-wider block">
              Coach Mode Unlocks:
            </span>
            <div className="space-y-1.5 text-xs text-gray-300">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141414] border border-[#222]">
                <Users className="w-4 h-4 text-[#C0FF00] shrink-0" />
                <span><strong>Client Roster:</strong> Manage connected athletes and monitor adherence</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141414] border border-[#222]">
                <Dumbbell className="w-4 h-4 text-[#C0FF00] shrink-0" />
                <span><strong>Routine Proposals:</strong> Propose multi-day splits for client activation</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141414] border border-[#222]">
                <Utensils className="w-4 h-4 text-[#00ade6] shrink-0" />
                <span><strong>Nutrition Prescriptions:</strong> Set daily target calories & macros</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-[#141414] border border-[#222]">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span><strong>Form Check Cues:</strong> Leave timestamped technique feedback</span>
              </div>
            </div>
          </div>

          {/* Specialty Selector */}
          <div className="space-y-2 pt-1">
            <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block">
              Choose Coaching Specialty
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedSpecialty('strength')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedSpecialty === 'strength'
                    ? 'bg-[#C0FF00]/15 border-[#C0FF00] text-[#C0FF00]'
                    : 'bg-[#161616] border-[#282828] text-gray-400 hover:text-white'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                <span className="text-[11px] font-bold font-mono uppercase">Strength</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSpecialty('nutrition')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedSpecialty === 'nutrition'
                    ? 'bg-[#00ade6]/15 border-[#00ade6] text-[#00ade6]'
                    : 'bg-[#161616] border-[#282828] text-gray-400 hover:text-white'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span className="text-[11px] font-bold font-mono uppercase">Nutrition</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedSpecialty('head_coach')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedSpecialty === 'head_coach'
                    ? 'bg-purple-500/15 border-purple-500 text-purple-400'
                    : 'bg-[#161616] border-[#282828] text-gray-400 hover:text-white'
                }`}
              >
                <Award className="w-4 h-4" />
                <span className="text-[11px] font-bold font-mono uppercase">Head Coach</span>
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-3">
            {success ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Coach Mode Activated! Unlocking Client Roster...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(192,255,0,0.2)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isCoach ? 'Update Specialty' : 'Activate Coach Mode'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
