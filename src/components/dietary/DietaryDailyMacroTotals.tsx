import React from 'react';
import { Sparkles, Utensils } from 'lucide-react';
import { DailyDietaryLog } from '../../models.ts';

interface DietaryDailyMacroTotalsProps {
  summary: DailyDietaryLog;
}

export const DietaryDailyMacroTotals: React.FC<DietaryDailyMacroTotalsProps> = ({ summary }) => {
  const entryCount = summary.entries?.length || 0;
  return (
    <div className="bg-[#111] border border-[#222] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-[#C0FF00]">
            Daily Intake Total
          </span>
          <h3 className="font-display text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#C0FF00]" />
            Macronutrient Summary
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#181818] border border-[#282828] rounded-xl text-xs font-mono font-bold text-gray-400">
          <Sparkles className="w-3.5 h-3.5 text-[#C0FF00]" />
          <span>{entryCount} Logged Items</span>
        </div>
      </div>

      {/* Hero Calorie & Protein Highlight */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-[#161616] border border-[#252525] rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#C0FF00]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="font-mono text-xs uppercase tracking-wider text-gray-400 font-semibold">
            Total Calories
          </div>
          <div className="font-display text-2xl sm:text-3xl font-black text-white mt-1">
            {summary.totalKcal}{' '}
            <span className="text-xs font-mono font-normal text-gray-500">kcal</span>
          </div>
        </div>

        <div className="p-4 bg-[#161616] border border-[#252525] rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#C0FF00]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="font-mono text-xs uppercase tracking-wider text-[#C0FF00] font-semibold">
            Total Protein
          </div>
          <div className="font-display text-2xl sm:text-3xl font-black text-[#C0FF00] mt-1">
            {summary.totalProtein}{' '}
            <span className="text-xs font-mono font-normal text-[#C0FF00]/70">g</span>
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
            {summary.totalCarbs} <span className="text-xs font-mono text-gray-500">g</span>
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
            {summary.totalFat} <span className="text-xs font-mono text-gray-500">g</span>
          </div>
        </div>

        <div className="p-3 bg-[#161616] border border-[#222] rounded-xl text-center">
          <div className="font-mono text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
            Fiber
          </div>
          <div className="font-display text-lg font-black text-white mt-0.5">
            {summary.totalFiber} <span className="text-xs font-mono text-gray-500">g</span>
          </div>
        </div>
      </div>
    </div>
  );
};
