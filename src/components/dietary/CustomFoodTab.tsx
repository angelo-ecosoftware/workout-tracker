import React from 'react';
import { Globe } from 'lucide-react';

interface CustomFoodTabProps {
  newFoodName: string;
  setNewFoodName: (val: string) => void;
  newFoodBrand: string;
  setNewFoodBrand: (val: string) => void;
  newFoodKcal: number | '';
  setNewFoodKcal: (val: number | '') => void;
  newFoodProtein: number | '';
  setNewFoodProtein: (val: number | '') => void;
  newFoodCarbs: number | '';
  setNewFoodCarbs: (val: number | '') => void;
  newFoodSugar: number | '';
  setNewFoodSugar: (val: number | '') => void;
  newFoodFat: number | '';
  setNewFoodFat: (val: number | '') => void;
  newFoodFiber: number | '';
  setNewFoodFiber: (val: number | '') => void;
  onSaveNewCustomFood: () => void;
}

export const CustomFoodTab: React.FC<CustomFoodTabProps> = ({
  newFoodName,
  setNewFoodName,
  newFoodBrand,
  setNewFoodBrand,
  newFoodKcal,
  setNewFoodKcal,
  newFoodProtein,
  setNewFoodProtein,
  newFoodCarbs,
  setNewFoodCarbs,
  newFoodSugar,
  setNewFoodSugar,
  newFoodFat,
  setNewFoodFat,
  newFoodFiber,
  setNewFoodFiber,
  onSaveNewCustomFood,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase text-white">
          New Custom Food (Values per 100g)
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Product Name *</label>
          <input
            type="text"
            value={newFoodName}
            onChange={(e) => setNewFoodName(e.target.value)}
            placeholder="e.g. Protein shake"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Brand / Source</label>
          <input
            type="text"
            value={newFoodBrand}
            onChange={(e) => setNewFoodBrand(e.target.value)}
            placeholder="e.g. Homemade"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Calories / 100g</label>
          <input
            type="number"
            step="0.1"
            value={newFoodKcal}
            onChange={(e) => setNewFoodKcal(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-[#C0FF00] mb-1">Protein (g)</label>
          <input
            type="number"
            step="0.1"
            value={newFoodProtein}
            onChange={(e) => setNewFoodProtein(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1">Carbs (g)</label>
          <input
            type="number"
            step="0.1"
            value={newFoodCarbs}
            onChange={(e) => setNewFoodCarbs(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-orange-400 mb-1">Sugars (g)</label>
          <input
            type="number"
            step="0.1"
            value={newFoodSugar}
            onChange={(e) => setNewFoodSugar(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-rose-400 mb-1">Fat (g)</label>
          <input
            type="number"
            step="0.1"
            value={newFoodFat}
            onChange={(e) => setNewFoodFat(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-emerald-400 mb-1">Fiber (g)</label>
          <input
            type="number"
            step="0.1"
            value={newFoodFiber}
            onChange={(e) => setNewFoodFiber(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
      </div>

      <button
        onClick={onSaveNewCustomFood}
        disabled={!newFoodName.trim()}
        className="w-full mt-3 py-2.5 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
      >
        <Globe className="w-4 h-4" />
        Save & Add to Global Database
      </button>
    </div>
  );
};
