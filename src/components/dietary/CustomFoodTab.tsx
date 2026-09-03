import React from 'react';
import { Globe } from 'lucide-react';

interface CustomFoodTabProps {
  newFoodName: string;
  setNewFoodName: (val: string) => void;
  newFoodBrand: string;
  setNewFoodBrand: (val: string) => void;
  newFoodBarcode?: string;
  setNewFoodBarcode?: (val: string) => void;
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
  newFoodBarcode,
  setNewFoodBarcode,
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
  const sanitizeNonNegative = (val: string, setter: (num: number | '') => void) => {
    if (val === '') {
      setter('');
      return;
    }
    const clean = val.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    setter(isNaN(num) ? '' : Math.max(0, num));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase text-white">
          New Custom Food (Values per 100g)
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Barcode (EAN-13 / UPC)</label>
          <input
            type="text"
            inputMode="numeric"
            value={newFoodBarcode || ''}
            onChange={(e) => setNewFoodBarcode && setNewFoodBarcode(e.target.value)}
            placeholder="e.g. 8710400000000"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs font-mono text-white outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <div>
          <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">Calories / 100g</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={newFoodKcal}
            onChange={(e) => sanitizeNonNegative(e.target.value, setNewFoodKcal)}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-[#C0FF00] mb-1">Protein (g)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={newFoodProtein}
            onChange={(e) => sanitizeNonNegative(e.target.value, setNewFoodProtein)}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-amber-400 mb-1">Carbs (g)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={newFoodCarbs}
            onChange={(e) => sanitizeNonNegative(e.target.value, setNewFoodCarbs)}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-orange-400 mb-1">Sugars (g)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={newFoodSugar}
            onChange={(e) => sanitizeNonNegative(e.target.value, setNewFoodSugar)}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-rose-400 mb-1">Fat (g)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={newFoodFat}
            onChange={(e) => sanitizeNonNegative(e.target.value, setNewFoodFat)}
            placeholder="0"
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl px-2 py-1.5 text-xs text-center text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase text-emerald-400 mb-1">Fiber (g)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={newFoodFiber}
            onChange={(e) => sanitizeNonNegative(e.target.value, setNewFoodFiber)}
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
