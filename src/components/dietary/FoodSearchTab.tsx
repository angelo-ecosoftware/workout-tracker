import React from 'react';
import { FoodItemNutrition } from '../../models.ts';
import { calculatePortionNutrients } from '../../lib/dietaryData.ts';
import { StoreMetadata } from './FoodSearchModal.tsx';
import { Check, Globe, Search } from 'lucide-react';

interface FoodSearchTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredCatalog: FoodItemNutrition[];
  selectedFoodItem: FoodItemNutrition | null;
  setSelectedFoodItem: (item: FoodItemNutrition | null) => void;
  portionGrams: number;
  setPortionGrams: (g: number) => void;
  selectedDate: string;
  formatDateTitle: (dateStr: string) => string;
  onAddEntryToLog: (food: FoodItemNutrition, grams: number) => void;
  onSelectTab: (tab: 'search' | 'link' | 'list' | 'custom') => void;
  setNewFoodName: (val: string) => void;
  getStoreMetadata: (url?: string, id?: string) => StoreMetadata | null;
  cleanProductTitle: (rawName: string) => string;
  isHouseBrand: (brandName?: string, storeMeta?: StoreMetadata | null) => boolean;
}

export const FoodSearchTab: React.FC<FoodSearchTabProps> = ({
  searchQuery,
  setSearchQuery,
  filteredCatalog,
  selectedFoodItem,
  setSelectedFoodItem,
  portionGrams,
  setPortionGrams,
  selectedDate,
  formatDateTitle,
  onAddEntryToLog,
  onSelectTab,
  setNewFoodName,
  getStoreMetadata,
  cleanProductTitle,
  isHouseBrand,
}) => {
  if (selectedFoodItem) {
    const preview = calculatePortionNutrients(selectedFoodItem, portionGrams);

    return (
      <div className="p-4 bg-[#1b1b1b] border border-[#C0FF00]/40 rounded-2xl space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#C0FF00] bg-[#C0FF00]/10 px-1.5 py-0.2 rounded">
              {selectedFoodItem.brand || 'Selected'}
            </span>
            <h4 className="font-sans text-sm font-bold text-white mt-1">
              {selectedFoodItem.name}
            </h4>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5">
              Per 100g: {selectedFoodItem.kcalPer100g} kcal • {selectedFoodItem.proteinPer100g}g protein
            </p>
          </div>
          <button
            onClick={() => setSelectedFoodItem(null)}
            className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
          >
            Change
          </button>
        </div>

        {/* Gram Input & Quick Buttons */}
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-400 font-bold mb-1.5">
            Amount Consumed (Grams / ML)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              step="1"
              value={portionGrams}
              onChange={(e) => setPortionGrams(Number(e.target.value) || 0)}
              className="w-24 bg-[#101010] border border-[#333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-center text-sm font-mono font-bold text-[#C0FF00] outline-none"
            />
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Standard portion buttons */}
              {[30, 50, 100, 150, 200].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setPortionGrams(g)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                    portionGrams === g
                      ? 'bg-[#C0FF00] text-black'
                      : 'bg-[#252525] hover:bg-[#303030] text-gray-300'
                  }`}
                >
                  {g}g
                </button>
              ))}

              {/* Full package shortcut if available */}
              {selectedFoodItem.packageWeightGrams && (
                <button
                  type="button"
                  onClick={() => setPortionGrams(selectedFoodItem.packageWeightGrams!)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                    portionGrams === selectedFoodItem.packageWeightGrams
                      ? 'bg-[#00ade6] text-black'
                      : 'bg-[#1e293b] hover:bg-[#334155] text-[#38bdf8] border border-[#00ade6]/40'
                  }`}
                >
                  Pak ({selectedFoodItem.packageWeightGrams}g)
                </button>
              )}

              {/* Per piece shortcut if piece count & package weight exist */}
              {selectedFoodItem.pieceCount && selectedFoodItem.packageWeightGrams && (
                <button
                  type="button"
                  onClick={() =>
                    setPortionGrams(
                      Math.round(selectedFoodItem.packageWeightGrams! / selectedFoodItem.pieceCount!)
                    )
                  }
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                    portionGrams ===
                    Math.round(selectedFoodItem.packageWeightGrams! / selectedFoodItem.pieceCount!)
                      ? 'bg-amber-400 text-black'
                      : 'bg-[#3b2a1a] hover:bg-[#4a3520] text-amber-300 border border-amber-500/40'
                  }`}
                >
                  1 stuk (~{Math.round(selectedFoodItem.packageWeightGrams / selectedFoodItem.pieceCount)}g)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Calculated Preview */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#121212] p-2 rounded-xl text-center font-mono text-xs border border-[#2a2a2a]">
          <div>
            <div className="text-[9px] text-gray-500 uppercase">Calories</div>
            <div className="font-bold text-white">{preview.calculatedKcal}</div>
          </div>
          <div>
            <div className="text-[9px] text-[#C0FF00] uppercase">Protein</div>
            <div className="font-bold text-[#C0FF00]">{preview.calculatedProtein}g</div>
          </div>
          <div>
            <div className="text-[9px] text-amber-400 uppercase">Carbs</div>
            <div className="font-bold text-white">{preview.calculatedCarbs}g</div>
          </div>
          <div>
            <div className="text-[9px] text-orange-400 uppercase">Sugars</div>
            <div className="font-bold text-white">{preview.calculatedSugar}g</div>
          </div>
          <div>
            <div className="text-[9px] text-rose-400 uppercase">Fat</div>
            <div className="font-bold text-white">{preview.calculatedFat}g</div>
          </div>
          <div>
            <div className="text-[9px] text-emerald-400 uppercase">Fiber</div>
            <div className="font-bold text-white">{preview.calculatedFiber}g</div>
          </div>
        </div>

        <button
          onClick={() => onAddEntryToLog(selectedFoodItem, portionGrams)}
          className="w-full py-2.5 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(192,255,0,0.25)] flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          Log {portionGrams}g into {formatDateTitle(selectedDate)}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Search Bar & Database Status */}
      <div className="space-y-1.5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shared database (e.g. Kipfilet, Kwark, Melk)..."
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#C0FF00] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white font-sans placeholder:text-gray-600 outline-none transition-colors"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 px-1">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-[#C0FF00]" />
            <span>Global Database</span>
          </span>
          <span>{filteredCatalog.length} items available</span>
        </div>
      </div>

      {/* Food Item List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredCatalog.length === 0 ? (
          <div className="text-center py-8 bg-[#181818] border border-dashed border-[#2b2b2b] rounded-2xl">
            <p className="font-sans text-xs text-gray-400">
              No foods found matching "{searchQuery}"
            </p>
            <div className="flex items-center justify-center gap-3 mt-3">
              <button
                onClick={() => onSelectTab('link')}
                className="text-xs font-sans text-[#00ade6] underline font-bold cursor-pointer"
              >
                Paste Product Link (Jumbo / AH)
              </button>
              <span className="text-gray-600">•</span>
              <button
                onClick={() => {
                  setNewFoodName(searchQuery);
                  onSelectTab('custom');
                }}
                className="text-xs font-sans text-[#C0FF00] underline font-bold cursor-pointer"
              >
                Create as Custom
              </button>
            </div>
          </div>
        ) : (
          filteredCatalog.map((item) => {
            const storeMeta = getStoreMetadata(item.sourceUrl, item.id);
            const displayName = cleanProductTitle(item.name);
            const showBrandBadge = item.brand && !isHouseBrand(item.brand, storeMeta);

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedFoodItem(item);
                  setPortionGrams(100);
                }}
                className="p-3 bg-[#181818] border border-[#262626] hover:border-[#C0FF00]/60 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-sans text-xs font-bold text-white group-hover:text-[#C0FF00] transition-colors">
                      {displayName}
                    </span>

                    {/* Brand badge: only shown if it is a genuine A-brand/3rd-party brand */}
                    {showBrandBadge && (
                      <span className="text-[9px] font-mono font-bold uppercase text-gray-400 bg-[#242424] px-1.5 py-0.2 rounded">
                        {item.brand}
                      </span>
                    )}

                    {/* Store badge: dynamically rendered per store (AH, Jumbo, Dirk, PLUS, etc.) */}
                    {storeMeta && (
                      <span className={`text-[9px] font-mono font-bold uppercase ${storeMeta.textColor} ${storeMeta.bgColor} px-1.5 py-0.2 rounded border ${storeMeta.borderColor}`}>
                        {storeMeta.badgeLabel}
                      </span>
                    )}

                    {/* Custom indicator for private manual foods */}
                    {item.isCustom && (
                      <span className="text-[9px] font-mono font-bold uppercase text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/30">
                        Mijn Product
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 mt-1 flex-wrap">
                    <span className="text-white font-semibold">{item.kcalPer100g} kcal</span>
                    <span>•</span>
                    <span className="text-[#C0FF00]">P: {item.proteinPer100g}g</span>
                    <span>•</span>
                    <span className="text-amber-400">C: {item.carbsPer100g}g</span>
                    <span>•</span>
                    <span className="text-rose-400">F: {item.fatPer100g}g</span>
                    <span>•</span>
                    <span className="text-emerald-400">Fib: {item.fiberPer100g}g</span>
                    {item.packageWeightGrams && (
                      <>
                        <span>•</span>
                        <span className="text-sky-400">({item.packageWeightGrams}g)</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#C0FF00] group-hover:translate-x-0.5 uppercase font-bold shrink-0 transition-transform">
                  Select →
                </span>
              </div>
            );
          })
        )}
      </div>
    </>
  );
};
