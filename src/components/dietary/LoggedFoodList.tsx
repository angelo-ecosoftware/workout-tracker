import React from 'react';
import { Apple, Plus, ScanBarcode, Trash2 } from 'lucide-react';
import { LoggedDietaryEntry } from '../../models.ts';

interface LoggedFoodListProps {
  entries: LoggedDietaryEntry[];
  selectedDate: string;
  isToday: boolean;
  onOpenAddModal: () => void;
  onOpenBarcodeScanner?: () => void;
  onUpdateEntryGrams: (entryId: string, grams: number) => void;
  onDeleteEntry: (entryId: string) => void;
}

export const LoggedFoodList: React.FC<LoggedFoodListProps> = ({
  entries,
  selectedDate,
  isToday,
  onOpenAddModal,
  onOpenBarcodeScanner,
  onUpdateEntryGrams,
  onDeleteEntry,
}) => {
  return (
    <div className="bg-[#111] border border-[#222] rounded-3xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-center justify-between border-b border-[#222] pb-3">
        <div>
          <h2 className="font-display text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Apple className="w-5 h-5 text-[#C0FF00]" />
            Logged Food Items ({entries.length})
          </h2>
          <p className="font-sans text-[11px] text-gray-500 uppercase tracking-wider font-semibold mt-0.5">
            Enter portion grams — live macro scaling
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBarcodeScanner && (
            <button
              onClick={onOpenBarcodeScanner}
              title="Scan barcode with camera"
              aria-label="Scan barcode with camera"
              className="p-2 sm:px-3 sm:py-2 bg-[#1b1b1b] hover:bg-[#252525] border border-[#333] hover:border-[#C0FF00]/50 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ScanBarcode className="w-4 h-4 text-[#C0FF00]" />
              <span className="hidden sm:inline">Scan</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(192,255,0,0.2)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Log Food
          </button>
        </div>
      </div>

      {/* Empty State */}
      {entries.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[#222] rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center text-gray-500 mx-auto mb-3">
            <Apple className="w-6 h-6 opacity-40" />
          </div>
          <p className="font-display text-sm font-bold uppercase tracking-wider text-gray-400">
            No Food Logged For {isToday ? 'Today' : selectedDate}
          </p>
          <p className="font-sans text-xs text-gray-600 mt-1 max-w-xs mx-auto">
            Tap "Log Food" to search the community database, paste an AH product link, or import your grocery list.
          </p>
        </div>
      ) : (
        /* List of Logged Products */
        <div className="space-y-3">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className="p-3.5 sm:p-4 bg-[#161616] border border-[#222] hover:border-[#333] rounded-2xl transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-[#222] flex items-center justify-center text-[10px] font-mono font-bold text-gray-400">
                      {idx + 1}
                    </span>
                    {entry.brand && (
                      <span className="text-[10px] font-mono font-bold uppercase text-[#C0FF00] bg-[#C0FF00]/10 px-1.5 py-0.2 rounded">
                        {entry.brand}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-gray-500">
                      (Ref: {entry.kcalPer100g} kcal / 100g)
                    </span>
                  </div>
                  <div className="font-sans text-sm font-bold text-white mt-1">
                    {entry.name}
                  </div>
                </div>

                {/* Portion Grams Quick Edit */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-[#0d0d0d] border border-[#333] focus-within:border-[#C0FF00] rounded-xl px-2.5 py-1">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={entry.amountGrams}
                      onChange={(e) =>
                        onUpdateEntryGrams(entry.id, Number(e.target.value) || 0)
                      }
                      className="w-14 bg-transparent text-right font-mono text-xs font-bold text-[#C0FF00] outline-none"
                    />
                    <span className="text-[10px] font-mono font-bold text-gray-500 ml-1">g</span>
                  </div>

                  <button
                    onClick={() => onDeleteEntry(entry.id)}
                    className="p-1.5 hover:bg-red-950/40 text-gray-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                    title="Remove product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Macro Pills Breakdown */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-[#202020] text-center font-mono text-xs">
                <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                  <div className="text-[9px] text-gray-500 uppercase font-sans font-bold">Calories</div>
                  <div className="font-black text-white">{entry.calculatedKcal}</div>
                </div>
                <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                  <div className="text-[9px] text-[#C0FF00] uppercase font-sans font-bold">Protein</div>
                  <div className="font-black text-white">{entry.calculatedProtein}g</div>
                </div>
                <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                  <div className="text-[9px] text-amber-400 uppercase font-sans font-bold">Carbs</div>
                  <div className="font-black text-white">{entry.calculatedCarbs}g</div>
                </div>
                <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                  <div className="text-[9px] text-orange-400 uppercase font-sans font-bold">Sugars</div>
                  <div className="font-black text-white">{entry.calculatedSugar}g</div>
                </div>
                <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                  <div className="text-[9px] text-rose-400 uppercase font-sans font-bold">Fat</div>
                  <div className="font-black text-white">{entry.calculatedFat}g</div>
                </div>
                <div className="bg-[#101010] p-1.5 rounded-lg border border-[#1f1f1f]">
                  <div className="text-[9px] text-emerald-400 uppercase font-sans font-bold">Fiber</div>
                  <div className="font-black text-white">{entry.calculatedFiber}g</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
