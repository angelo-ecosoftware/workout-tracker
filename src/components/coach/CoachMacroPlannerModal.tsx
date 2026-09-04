import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Check,
  X,
  Sparkles,
  Loader2,
  Flame,
  Wheat,
  Droplet,
  Dumbbell,
} from 'lucide-react';
import { CoachMacroPrescription } from '../../models.ts';
import {
  fetchActiveMacroPrescription,
  saveMacroPrescription,
} from '../../lib/supabaseData.ts';

interface CoachMacroPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId: string;
  coachName?: string;
  athleteId: string;
  athleteName: string;
  onPrescriptionSaved?: () => void;
}

export const CoachMacroPlannerModal: React.FC<CoachMacroPlannerModalProps> = ({
  isOpen,
  onClose,
  coachId,
  coachName,
  athleteId,
  athleteName,
  onPrescriptionSaved,
}) => {
  const [kcal, setKcal] = useState<number | ''>(2600);
  const [protein, setProtein] = useState<number | ''>(185);
  const [carbs, setCarbs] = useState<number | ''>(280);
  const [fat, setFat] = useState<number | ''>(70);
  const [fiber, setFiber] = useState<number | ''>(35);
  const [notes, setNotes] = useState('High protein training day protocol');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && athleteId) {
      fetchActiveMacroPrescription(athleteId).then((existing) => {
        if (existing) {
          setKcal(existing.targetKcal);
          setProtein(existing.targetProteinG);
          setCarbs(existing.targetCarbsG);
          setFat(existing.targetFatG);
          setFiber(existing.targetFiberG || '');
          setNotes(existing.notes || '');
        }
      });
    }
  }, [isOpen, athleteId]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kcal || !protein || !carbs || !fat) {
      setStatusMsg({ type: 'error', text: 'Please fill in required calorie, protein, carb, and fat targets.' });
      return;
    }

    try {
      setLoading(true);
      await saveMacroPrescription(
        coachId,
        athleteId,
        Number(kcal),
        Number(protein),
        Number(carbs),
        Number(fat),
        fiber ? Number(fiber) : undefined,
        notes.trim() || undefined,
        coachName
      );

      setStatusMsg({ type: 'success', text: `Prescribed daily nutrition plan for ${athleteName}!` });
      setTimeout(() => {
        if (onPrescriptionSaved) onPrescriptionSaved();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Failed to save macro prescription:', err);
      setStatusMsg({ type: 'error', text: 'Failed to save macro plan.' });
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
        className="bg-[#111111] border border-[#222222] rounded-[24px] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222] bg-[#141414]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#00ade6]/10 border border-[#00ade6]/20 flex items-center justify-center text-[#00ade6]">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display font-black uppercase italic tracking-tight text-white text-base sm:text-lg">
                Prescribe Macro Targets
              </h2>
              <p className="text-[10px] font-mono text-gray-400">
                Setting daily nutritional goals for {athleteName}
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1">
              Daily Target Calories (kcal) *
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="2600"
                value={kcal}
                onChange={(e) => setKcal(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-[#161616] border border-[#333] focus:border-[#00ade6] rounded-xl pl-3 pr-12 py-2 text-sm text-white font-mono font-bold outline-none"
                required
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-gray-500">kcal</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-mono text-[#00ade6] font-bold block mb-1">
                Protein (g) *
              </label>
              <input
                type="number"
                placeholder="185"
                value={protein}
                onChange={(e) => setProtein(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-[#161616] border border-[#333] focus:border-[#00ade6] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-amber-400 font-bold block mb-1">
                Carbohydrates (g) *
              </label>
              <input
                type="number"
                placeholder="280"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-[#161616] border border-[#333] focus:border-[#00ade6] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-rose-400 font-bold block mb-1">
                Fats (g) *
              </label>
              <input
                type="number"
                placeholder="70"
                value={fat}
                onChange={(e) => setFat(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-[#161616] border border-[#333] focus:border-[#00ade6] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                required
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono text-emerald-400 font-bold block mb-1">
                Fiber (g) (Optional)
              </label>
              <input
                type="number"
                placeholder="35"
                value={fiber}
                onChange={(e) => setFiber(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-[#161616] border border-[#333] focus:border-[#00ade6] rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-mono text-gray-400 font-bold block mb-1">
              Coaching Notes & Diet Directives
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Ensure 40g protein post-workout and maintain 3L daily water intake."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#161616] border border-[#333] focus:border-[#00ade6] rounded-xl px-3 py-2 text-xs text-white font-sans outline-none resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00ade6] hover:bg-[#0096c7] text-white font-display font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,173,230,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Publish Macro Targets</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
