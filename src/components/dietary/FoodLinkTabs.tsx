import React from 'react';
import { Check, Link as LinkIcon, Loader2, Search, Sparkles } from 'lucide-react';

interface FoodLinkTabsProps {
  activeModalTab: 'link' | 'list';
  // Link Scraper Tab Props
  singleLinkInput: string;
  setSingleLinkInput: (url: string) => void;
  singleLinkLoading: boolean;
  singleLinkError: string | null;
  onFetchSingleProductLink: () => void;
  // List Import Tab Props
  listLinkInput: string;
  setListLinkInput: (url: string) => void;
  listLinkLoading: boolean;
  listLinkError: string | null;
  listExtractedProducts: Array<{ id: string; title: string; brand?: string; salesUnitSize?: string }>;
  isBulkImporting: boolean;
  onFetchSharedList: () => void;
  onBulkImportAllList: () => void;
  onImportListItemToIndex: (item: { id: string; title: string; brand?: string; salesUnitSize?: string }) => void;
}

export const FoodLinkTabs: React.FC<FoodLinkTabsProps> = ({
  activeModalTab,
  singleLinkInput,
  setSingleLinkInput,
  singleLinkLoading,
  singleLinkError,
  onFetchSingleProductLink,
  listLinkInput,
  setListLinkInput,
  listLinkLoading,
  listLinkError,
  listExtractedProducts,
  isBulkImporting,
  onFetchSharedList,
  onBulkImportAllList,
  onImportListItemToIndex,
}) => {
  if (activeModalTab === 'link') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-bold mb-1">
            Supermarket Product Link (AH / Jumbo / Dirk / PLUS)
          </label>
          <p className="text-[11px] text-gray-500 font-sans mb-2">
            Plak een product link van <strong>ah.nl</strong>, <strong>jumbo.com</strong>, <strong>dirk.nl</strong> of <strong>plus.nl</strong>. De voedingswaarden en verpakkingsgrootte worden automatisch uitgelezen en opgeslagen in de centrale database!
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={singleLinkInput}
              onChange={(e) => setSingleLinkInput(e.target.value)}
              placeholder="https://www.ah.nl/..., https://www.jumbo.com/..., https://www.dirk.nl/..., https://www.plus.nl/..."
              className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#00ade6] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
            />
            <button
              onClick={onFetchSingleProductLink}
              disabled={singleLinkLoading || !singleLinkInput.trim()}
              className="px-4 py-2.5 bg-[#00ade6] hover:bg-[#0096c7] text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {singleLinkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              Extract & Save
            </button>
          </div>
        </div>

        {singleLinkError && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300">
            {singleLinkError}
          </div>
        )}

        <div className="p-3 bg-[#181818] border border-[#222] rounded-xl text-xs text-gray-400 space-y-1">
          <div className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C0FF00]" />
            Ondersteunde Supermarkten
          </div>
          <p className="text-[11px] text-gray-500">
            Ondersteunt <strong>Albert Heijn</strong>, <strong>Jumbo</strong>, <strong>Dirk van den Broek</strong> en <strong>PLUS</strong> met automatische herkenning van portiegroottes en verpakkingsgewichten.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-bold mb-1">
          Albert Heijn Shared Grocery List Link
        </label>
        <p className="text-[11px] text-gray-500 font-sans mb-2">
          Share your cart/list from the AH app or web and paste the link below to import products:
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={listLinkInput}
            onChange={(e) => setListLinkInput(e.target.value)}
            placeholder="https://www.ah.nl/mijnlijst/gedeelde-lijst/..."
            className="w-full bg-[#1c1c1c] border border-[#333] focus:border-[#00ade6] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none"
          />
          <button
            onClick={onFetchSharedList}
            disabled={listLinkLoading || !listLinkInput.trim()}
            className="px-4 py-2.5 bg-[#00ade6] hover:bg-[#0096c7] text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {listLinkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Fetch
          </button>
        </div>
      </div>

      {listLinkError && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300">
          {listLinkError}
        </div>
      )}

      {listExtractedProducts.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#222]">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono text-gray-400 font-bold uppercase">
              Products ({listExtractedProducts.length})
            </div>
            <button
              onClick={onBulkImportAllList}
              disabled={isBulkImporting}
              className="px-3 py-1 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isBulkImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Import All to Database
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {listExtractedProducts.map((p, i) => (
              <div
                key={p.id || i}
                className="p-3 bg-[#181818] border border-[#262626] hover:border-[#00ade6]/50 rounded-xl flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-sans text-xs font-bold text-white truncate">
                    {p.title}
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 mt-0.5">
                    {p.brand} • {p.salesUnitSize}
                  </div>
                </div>
                <button
                  onClick={() => onImportListItemToIndex(p)}
                  className="px-3 py-1.5 bg-[#C0FF00] hover:bg-[#a8e000] text-black font-sans text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer shrink-0"
                >
                  + Add & Log
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
