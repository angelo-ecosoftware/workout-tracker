import React from 'react';
import { Sparkles, Utensils, Target, ShieldCheck } from 'lucide-react';
import { DailyDietaryLog, CoachMacroPrescription } from '../../models.ts';

interface DietaryDailyMacroTotalsProps {
  summary: DailyDietaryLog;
  prescription?: CoachMacroPrescription | null;
}

export const DietaryDailyMacroTotals: React.FC<DietaryDailyMacroTotalsProps> = ({
  summary,
  prescription,
}) => {
  const entryCount = summary.entries?.length || 0;

  const kcalPercent = prescription?.targetKcal
    ? Math.min(100, Math.round((summary.totalKcal / prescription.targetKcal) * 100))
    : null;

  const proteinPercent = prescription?.targetProteinG
    ? Math.min(100, Math.round((summary.totalProtein / prescription.targetProteinG) * 100))
    : null;

  return (
    <div className="bg-[#111] border border-[#222] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#C0FF00]">
            Daily Intake Total
          </span>
          <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#C0FF00]" />
            Macronutrient Summary
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {prescription && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-sky-500/10 border border-sky-500/30 rounded-xl text-xs font-mono text-sky-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Coach Targets ({prescription.coachName || 'Coach'})</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#181818] border border-[#282828] rounded-xl text-xs font-mono font-bold text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-[#C0FF00]" />
            <span>{entryCount} Logged Items</span>
          </div>
        </div>
      </div>

      {/* Hero Calorie & Protein Highlight */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-[#161616] border border-[#252525] rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#C0FF00]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-gray-400 font-semibold">
              Total Calories
            </span>
            {kcalPercent !== null && (
              <span className="text-[10px] font-mono font-bold text-sky-400">
                {kcalPercent}% of {prescription?.targetKcal} kcal
              </span>
            )}
          </div>
          <div className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
            {summary.totalKcal}{' '}
            <span className="text-xs font-mono font-normal text-gray-500">
              {prescription ? `/ ${prescription.targetKcal} kcal` : 'kcal'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#161616] border border-[#252525] rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#C0FF00]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-[#C0FF00] font-semibold">
              Total Protein
            </span>
            {proteinPercent !== null && (
              <span className="text-[10px] font-mono font-bold text-[#C0FF00]">
                {proteinPercent}% of {prescription?.targetProteinG}g
              </span>
            )}
          </div>
          <div className="font-display text-2xl sm:text-3xl font-black text-[#C0FF00] mt-1">
            {summary.totalProtein}{' '}
            <span className="text-xs font-mono font-normal text-[#C0FF00]/70">
              {prescription ? `/ ${prescription.targetProteinG}g` : 'g'}
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Macros 4-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 bg-[#161616] border border-[#222] rounded-xl text-center">
          <div className="font-mono text-[10px] uppercase font-bold text-amber-400 tracking-wider">
            Carbohydrates
          </div>
          <div className="font-display text-lg font-black text-white mt-0.5">
            {summary.totalCarbs}{' '}
            <span className="text-xs font-mono text-gray-500">
              {prescription ? `/ ${prescription.targetCarbsG}g` : 'g'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#161616] border border-[#222] rounded-xl text-center">
          <div className="font-mono text-[10px] uppercase font-bold text-orange-400 tracking-wider">
            Sugars
          </div>
          <div className="font-display text-lg font-black text-white mt-0.5">
            {summary.totalSugar} <span className="text-xs font-mono text-gray-500">g</span>
          </div>
        </div>

        <div className="p-3 bg-[#161616] border border-[#222] rounded-xl text-center">
          <div className="font-mono text-[10px] uppercase font-bold text-rose-400 tracking-wider">
            Fats
          </div>
          <div className="font-display text-lg font-black text-white mt-0.5">
            {summary.totalFat}{' '}
            <span className="text-xs font-mono text-gray-500">
              {prescription ? `/ ${prescription.targetFatG}g` : 'g'}
            </span>
          </div>
        </div>

        <div className="p-3 bg-[#161616] border border-[#222] rounded-xl text-center">
          <div className="font-mono text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
            Fiber
          </div>
          <div className="font-display text-lg font-black text-white mt-0.5">
            {summary.totalFiber}{' '}
            <span className="text-xs font-mono text-gray-500">
              {prescription?.targetFiberG ? `/ ${prescription.targetFiberG}g` : 'g'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
