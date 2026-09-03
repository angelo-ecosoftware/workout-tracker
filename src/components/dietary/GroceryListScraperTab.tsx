import React from 'react';
import { ShoppingCart, Loader2, ArrowRight, Check } from 'lucide-react';
import { ScrapedProductDTO } from '../../types/api.ts';

interface GroceryListScraperTabProps {
  listLinkInput: string;
  setListLinkInput: (v: string) => void;
  listLinkLoading: boolean;
  listLinkError: string | null;
  listExtractedProducts: ScrapedProductDTO[];
  isBulkImporting: boolean;
  onFetchSharedList: () => void;
  onBulkImportList: () => void;
}

export const GroceryListScraperTab: React.FC<GroceryListScraperTabProps> = ({
  listLinkInput,
  setListLinkInput,
  listLinkLoading,
  listLinkError,
  listExtractedProducts,
  isBulkImporting,
  onFetchSharedList,
  onBulkImportList,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-[#222222] p-4 rounded-2xl space-y-3">
        <p className="text-xs text-gray-400 leading-relaxed">
          Paste a shared grocery basket link from <strong className="text-white">Albert Heijn</strong>{' '}
          (<code className="text-[#C0FF00]">ah.nl/lijstje/...</code>). All items will be parsed and bulk-added to your catalog.
        </p>

        <div className="space-y-2">
          <label className="text-[10px] font-mono text-gray-400 uppercase">Shared List URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://www.ah.nl/lijstje/..."
              value={listLinkInput}
              onChange={(e) => setListLinkInput(e.target.value)}
              className="flex-1 bg-[#111111] border border-[#333333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none"
            />
            <button
              type="button"
              onClick={onFetchSharedList}
              disabled={listLinkLoading || !listLinkInput.trim()}
              className="px-4 bg-[#C0FF00] hover:bg-[#A8E600] disabled:bg-[#222] disabled:text-gray-600 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {listLinkLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              Fetch List
            </button>
          </div>
        </div>

        {listLinkError && (
          <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-400 text-xs rounded-xl font-mono">
            {listLinkError}
          </div>
        )}

        {/* Preview Extracted Products */}
        {listExtractedProducts.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-[#222]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-300">
                Found {listExtractedProducts.length} items
              </span>
              <button
                onClick={onBulkImportList}
                disabled={isBulkImporting}
                className="px-3 py-1.5 bg-[#C0FF00] hover:bg-[#a6dc00] disabled:bg-[#222] text-black text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                {isBulkImporting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Import All to Journal
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {listExtractedProducts.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-[#111] p-2 rounded-lg border border-[#222] flex items-center justify-between text-xs"
                >
                  <span className="text-white truncate max-w-[200px]">{p.name}</span>
                  <span className="text-gray-400 font-mono">
                    {Math.round(p.kcalPer100g || 0)} kcal • P: {p.proteinPer100g || 0}g
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
