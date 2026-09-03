import React from 'react';
import { Database, Plus } from 'lucide-react';

interface CustomFoodTabProps {
  newFoodName: string;
  setNewFoodName: (v: string) => void;
  newFoodBrand: string;
  setNewFoodBrand: (v: string) => void;
  newFoodKcal: number | '';
  setNewFoodKcal: (v: number | '') => void;
  newFoodProtein: number | '';
  setNewFoodProtein: (v: number | '') => void;
  newFoodCarbs: number | '';
  setNewFoodCarbs: (v: number | '') => void;
  newFoodSugar: number | '';
  setNewFoodSugar: (v: number | '') => void;
  newFoodFat: number | '';
  setNewFoodFat: (v: number | '') => void;
  newFoodFiber: number | '';
  setNewFoodFiber: (v: number | '') => void;
  onCreateCustomFood: (e: React.FormEvent) => void;
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
  onCreateCustomFood,
}) => {
  return (
    <form onSubmit={onCreateCustomFood} className="space-y-4">
      <div className="bg-[#141414] border border-[#222222] p-4 rounded-2xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase">Food Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Greek Yogurt 0% Fat"
              value={newFoodName}
              onChange={(e) => setNewFoodName(e.target.value)}
              className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-gray-400 uppercase">Brand (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Fage / Homemade"
              value={newFoodBrand}
              onChange={(e) => setNewFoodBrand(e.target.value)}
              className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white outline-none mt-1"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#222]">
          <span className="text-[10px] font-mono text-[#C0FF00] uppercase font-bold">
            Nutritional Values per 100g
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            <div>
              <label className="text-[10px] font-mono text-gray-400">Calories (kcal) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={newFoodKcal}
                onChange={(e) =>
                  setNewFoodKcal(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-1.5 text-xs text-white outline-none mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-400">Protein (g) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={newFoodProtein}
                onChange={(e) =>
                  setNewFoodProtein(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-1.5 text-xs text-white outline-none mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-400">Carbohydrates (g)</label>
              <input
                type="number"
                step="0.1"
                value={newFoodCarbs}
                onChange={(e) =>
                  setNewFoodCarbs(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-1.5 text-xs text-white outline-none mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-400">Sugars (g)</label>
              <input
                type="number"
                step="0.1"
                value={newFoodSugar}
                onChange={(e) =>
                  setNewFoodSugar(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-1.5 text-xs text-white outline-none mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-400">Total Fats (g)</label>
              <input
                type="number"
                step="0.1"
                value={newFoodFat}
                onChange={(e) =>
                  setNewFoodFat(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-1.5 text-xs text-white outline-none mt-1 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-400">Dietary Fiber (g)</label>
              <input
                type="number"
                step="0.1"
                value={newFoodFiber}
                onChange={(e) =>
                  setNewFoodFiber(e.target.value === '' ? '' : parseFloat(e.target.value))
                }
                className="w-full bg-[#111] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-1.5 text-xs text-white outline-none mt-1 font-mono"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-[#C0FF00] hover:bg-[#a6dc00] text-black font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5 cursor-pointer mt-2"
        >
          <Plus className="w-4 h-4" />
          Save & Add Custom Food
        </button>
      </div>
    </form>
  );
};
