import React from 'react';
import { Search, Plus, Check, Globe } from 'lucide-react';
import { FoodItemNutrition } from '../../models.ts';
import { getStoreMetadata, cleanProductTitle, isHouseBrand } from '../../lib/storeBranding.ts';

interface FoodSearchTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredCatalog: FoodItemNutrition[];
  selectedFoodItem: FoodItemNutrition | null;
  setSelectedFoodItem: (item: FoodItemNutrition | null) => void;
  portionGrams: number;
  setPortionGrams: (g: number) => void;
  onLogPortion: (item: FoodItemNutrition, grams: number) => void;
}

export const FoodSearchTab: React.FC<FoodSearchTabProps> = ({
  searchQuery,
  setSearchQuery,
  filteredCatalog,
  selectedFoodItem,
  setSelectedFoodItem,
  portionGrams,
  setPortionGrams,
  onLogPortion,
}) => {
  return (
    <div className="space-y-4">
      {!selectedFoodItem ? (
        <>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, supermarket or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] border border-[#222222] focus:border-[#C0FF00] rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-500 outline-none"
            />
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {filteredCatalog.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">
                No food items matched your query. Paste an Albert Heijn / Jumbo / Dirk link or create a custom item.
              </div>
            ) : (
              filteredCatalog.map((food) => {
                const storeMeta = getStoreMetadata(food.name, food.brand);
                const displayTitle = cleanProductTitle(food.name);
                const houseBrand = isHouseBrand(food.brand, storeMeta);

                return (
                  <div
                    key={food.id}
                    onClick={() => {
                      setSelectedFoodItem(food);
                      setPortionGrams(100);
                    }}
                    className="bg-[#141414] border border-[#222222] hover:border-[#C0FF00]/50 p-3 rounded-xl cursor-pointer flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-[#C0FF00] transition-colors truncate">
                          {displayTitle}
                        </span>
                        {storeMeta && (
                          <span
                            className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${storeMeta.bgColor} ${storeMeta.textColor} border ${storeMeta.borderColor}`}
                          >
                            {storeMeta.name}
                          </span>
                        )}
                        {houseBrand && !storeMeta && (
                          <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Housebrand
                          </span>
                        )}
                        {food.brand && !houseBrand && (
                          <span className="text-[10px] text-gray-400 font-mono">
                            • {food.brand}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                        <span className="text-white font-semibold">
                          {Math.round(food.kcalPer100g)} kcal
                        </span>
                        <span>P: {food.proteinPer100g}g</span>
                        <span>C: {food.carbsPer100g}g</span>
                        <span>F: {food.fatPer100g}g</span>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-[#222222] group-hover:bg-[#C0FF00] group-hover:text-black flex items-center justify-center text-gray-400 transition-colors flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* PORTION INPUT VIEW */
        <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-[#C0FF00] uppercase tracking-wider">
                Logging Item
              </span>
              <h4 className="text-base font-bold text-white">
                {cleanProductTitle(selectedFoodItem.name)}
              </h4>
              {selectedFoodItem.brand && (
                <p className="text-xs text-gray-400 font-mono">{selectedFoodItem.brand}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedFoodItem(null)}
              className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
            >
              Change item
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-gray-400">Portion Size (Grams)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={portionGrams || ''}
                onChange={(e) => setPortionGrams(parseInt(e.target.value, 10) || 0)}
                className="flex-1 bg-[#111111] border border-[#333333] focus:border-[#C0FF00] rounded-xl px-4 py-2.5 text-white font-mono text-base font-bold outline-none"
              />
              <span className="text-xs font-mono text-gray-400">grams</span>
            </div>
          </div>

          {/* Portion Presets */}
          <div className="flex flex-wrap gap-2">
            {[50, 100, 150, 200, 250, 300].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setPortionGrams(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                  portionGrams === g
                    ? 'bg-[#C0FF00] text-black'
                    : 'bg-[#1F1F1F] text-gray-300 hover:bg-[#282828]'
                }`}
              >
                {g}g
              </button>
            ))}
          </div>

          {/* Computed Nutrients for this portion */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#222]">
            <div className="bg-[#111] p-2.5 rounded-xl border border-[#222]">
              <span className="text-[9px] font-mono text-gray-500 uppercase">Calories</span>
              <div className="text-sm font-bold text-white font-mono mt-0.5">
                {Math.round((selectedFoodItem.kcalPer100g * portionGrams) / 100)} kcal
              </div>
            </div>
            <div className="bg-[#111] p-2.5 rounded-xl border border-[#222]">
              <span className="text-[9px] font-mono text-gray-500 uppercase">Protein</span>
              <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                {((selectedFoodItem.proteinPer100g * portionGrams) / 100).toFixed(1)}g
              </div>
            </div>
            <div className="bg-[#111] p-2.5 rounded-xl border border-[#222]">
              <span className="text-[9px] font-mono text-gray-500 uppercase">Carbs</span>
              <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
                {((selectedFoodItem.carbsPer100g * portionGrams) / 100).toFixed(1)}g
              </div>
            </div>
            <div className="bg-[#111] p-2.5 rounded-xl border border-[#222]">
              <span className="text-[9px] font-mono text-gray-500 uppercase">Fats</span>
              <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
                {((selectedFoodItem.fatPer100g * portionGrams) / 100).toFixed(1)}g
              </div>
            </div>
          </div>

          <button
            onClick={() => onLogPortion(selectedFoodItem, portionGrams)}
            disabled={!portionGrams || portionGrams <= 0}
            className="w-full py-3 bg-[#C0FF00] hover:bg-[#A8E600] disabled:bg-[#222] disabled:text-gray-600 text-black font-black uppercase text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#C0FF00]/10"
          >
            <Check className="w-4 h-4" />
            Add to Daily Journal
          </button>
        </div>
      )}
    </div>
  );
};
