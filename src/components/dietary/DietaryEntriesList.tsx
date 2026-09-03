import React from 'react';
import { Apple, Trash2, Globe } from 'lucide-react';
import { LoggedDietaryEntry } from '../../models.ts';
import { getStoreMetadata, cleanProductTitle, isHouseBrand } from '../../lib/storeBranding.ts';

interface DietaryEntriesListProps {
  entries: LoggedDietaryEntry[];
  onDeleteEntry: (id: string) => void;
  onOpenAddModal: () => void;
}

export const DietaryEntriesList: React.FC<DietaryEntriesListProps> = ({
  entries,
  onDeleteEntry,
  onOpenAddModal,
}) => {
  if (entries.length === 0) {
    return (
      <div className="bg-[#111111] border border-[#222222] rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-[#1A1A1A] border border-[#262626] flex items-center justify-center text-gray-500 mb-4">
          <Apple className="w-8 h-8 opacity-40 text-[#C0FF00]" />
        </div>
        <h3 className="text-white font-bold text-lg mb-1">No Meals Logged Today</h3>
        <p className="text-gray-400 text-xs sm:text-sm max-w-sm mb-6">
          Search your catalog, enter an Albert Heijn link, or create custom food items to track calories & macros.
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-[#C0FF00] text-black font-black uppercase text-xs tracking-wider flex items-center gap-2 hover:bg-[#b0eb00] transition-transform active:scale-95 shadow-lg shadow-[#C0FF00]/10"
        >
          Add Food Item
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {entries.map((entry) => {
        const storeMeta = getStoreMetadata(entry.name, entry.brand);
        const displayTitle = cleanProductTitle(entry.name);
        const houseBrand = isHouseBrand(entry.brand, storeMeta);

        return (
          <div
            key={entry.id}
            className="bg-[#111111] border border-[#222222] hover:border-[#333333] transition-colors rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#262626] flex-shrink-0 flex items-center justify-center text-gray-400 group-hover:text-[#C0FF00] transition-colors">
                <Apple className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="font-bold text-white text-sm sm:text-base truncate leading-snug">
                    {displayTitle}
                  </h4>
                  {storeMeta && (
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1 ${storeMeta.bgColor} ${storeMeta.textColor} border ${storeMeta.borderColor}`}
                    >
                      <Globe className="w-2.5 h-2.5" />
                      {storeMeta.name}
                    </span>
                  )}
                  {houseBrand && !storeMeta && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Housebrand
                    </span>
                  )}
                  {entry.brand && !houseBrand && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      • {entry.brand}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 font-mono flex-wrap">
                  <span className="text-[#C0FF00] font-bold bg-[#C0FF00]/10 px-2 py-0.5 rounded-md border border-[#C0FF00]/20">
                    {entry.amountGrams}g portion
                  </span>
                  <span className="text-white font-bold">
                    {Math.round(entry.calculatedKcal)} kcal
                  </span>
                  <span>• P: {entry.calculatedProtein.toFixed(1)}g</span>
                  <span>• C: {entry.calculatedCarbs.toFixed(1)}g</span>
                  <span>• F: {entry.calculatedFat.toFixed(1)}g</span>
                  {entry.calculatedFiber > 0 && <span>• Fib: {entry.calculatedFiber.toFixed(1)}g</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 self-end sm:self-center border-t sm:border-t-0 border-[#1A1A1A] pt-2 sm:pt-0 w-full sm:w-auto">
              <button
                onClick={() => onDeleteEntry(entry.id)}
                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
