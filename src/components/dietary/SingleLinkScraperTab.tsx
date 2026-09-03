import React from 'react';
import { Link as LinkIcon, Loader2, ArrowRight } from 'lucide-react';

interface SingleLinkScraperTabProps {
  singleLinkInput: string;
  setSingleLinkInput: (v: string) => void;
  singleLinkLoading: boolean;
  singleLinkError: string | null;
  onFetchSingleLink: () => void;
}

export const SingleLinkScraperTab: React.FC<SingleLinkScraperTabProps> = ({
  singleLinkInput,
  setSingleLinkInput,
  singleLinkLoading,
  singleLinkError,
  onFetchSingleLink,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-[#222222] p-4 rounded-2xl space-y-3">
        <p className="text-xs text-gray-400 leading-relaxed">
          Paste any live product page from <strong className="text-white">Albert Heijn</strong>,{' '}
          <strong className="text-white">Jumbo</strong>, or <strong className="text-white">Dirk</strong>.
          Our edge scraper instantly parses the exact macros and caches it for future access.
        </p>

        <div className="space-y-2">
          <label className="text-[10px] font-mono text-gray-400 uppercase">Product URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://www.ah.nl/producten/product/wi..."
              value={singleLinkInput}
              onChange={(e) => setSingleLinkInput(e.target.value)}
              className="flex-1 bg-[#111111] border border-[#333333] focus:border-[#C0FF00] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 outline-none"
            />
            <button
              type="button"
              onClick={onFetchSingleLink}
              disabled={singleLinkLoading || !singleLinkInput.trim()}
              className="px-4 bg-[#C0FF00] hover:bg-[#A8E600] disabled:bg-[#222] disabled:text-gray-600 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {singleLinkLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              Scrape
            </button>
          </div>
        </div>

        {singleLinkError && (
          <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-400 text-xs rounded-xl font-mono">
            {singleLinkError}
          </div>
        )}
      </div>
    </div>
  );
};
