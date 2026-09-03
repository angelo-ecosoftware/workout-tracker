import React from 'react';
import { Flame, Zap, Wheat, Candy, Droplet, Sparkles } from 'lucide-react';
import { DailyDietaryLog } from '../../models.ts';

interface DietaryDailySummaryCardsProps {
  dailyLog: DailyDietaryLog;
}

export const DietaryDailySummaryCards: React.FC<DietaryDailySummaryCardsProps> = ({ dailyLog }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Calories */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-[#C0FF00]/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Calories</span>
          <div className="w-6 h-6 rounded-lg bg-[#C0FF00]/10 flex items-center justify-center text-[#C0FF00]">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            {Math.round(dailyLog.totalKcal)}
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">kcal today</div>
        </div>
      </div>

      {/* Protein */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Protein</span>
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            {dailyLog.totalProtein.toFixed(1)}
            <span className="text-xs text-gray-400 font-normal ml-1">g</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">muscle recovery</div>
        </div>
      </div>

      {/* Carbs */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Carbs</span>
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Wheat className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            {dailyLog.totalCarbs.toFixed(1)}
            <span className="text-xs text-gray-400 font-normal ml-1">g</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">energy source</div>
        </div>
      </div>

      {/* Sugar */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-pink-500/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Sugar</span>
          <div className="w-6 h-6 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
            <Candy className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            {dailyLog.totalSugar.toFixed(1)}
            <span className="text-xs text-gray-400 font-normal ml-1">g</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">of carbs</div>
        </div>
      </div>

      {/* Fat */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-blue-500/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Fat</span>
          <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Droplet className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            {dailyLog.totalFat.toFixed(1)}
            <span className="text-xs text-gray-400 font-normal ml-1">g</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">essential fats</div>
        </div>
      </div>

      {/* Fiber */}
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-purple-500/40 transition-colors">
        <div className="flex items-center justify-between text-gray-400 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider">Fiber</span>
          <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-black font-display text-white tracking-tight">
            {dailyLog.totalFiber.toFixed(1)}
            <span className="text-xs text-gray-400 font-normal ml-1">g</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">gut health</div>
        </div>
      </div>
    </div>
  );
};
