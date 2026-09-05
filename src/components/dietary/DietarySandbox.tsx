import React, { useState } from 'react';
import { Apple, Search, ExternalLink, Loader2, AlertCircle, ShoppingCart, Check, Sparkles } from 'lucide-react';

interface AHProduct {
  id: number;
  title: string;
  brand: string;
  webPath: string;
  salesUnitSize: string;
  quantity: number;
}

export const DietarySandbox: React.FC = () => {
  const [listUrl, setListUrl] = useState('https://www.ah.nl/mijnlijst/gedeelde-lijst/2241f734-e626-45d6-804b-254efb8bf1a8');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<AHProduct[]>([]);

  // Function to extract list ID from AH shared list URL
  const extractListId = (url: string): string => {
    const clean = url.trim();
    const match = clean.match(/gedeelde-lijst\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
    return clean;
  };

  const handleFetchList = async () => {
    setLoading(true);
    setError(null);
    setProducts([]);

    try {
      const listId = extractListId(listUrl);
      if (!listId) {
        throw new Error('Please enter a valid Albert Heijn shared list link or ID');
      }

      // Query server-side proxy route to bypass browser CORS restrictions
      const res = await fetch(`/api/grocery-list?listId=${encodeURIComponent(listId)}`);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch list (status ${res.status})`);
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.products)) {
        throw new Error(data.error || 'Invalid list response');
      }

      setProducts(data.products);
    } catch (err: unknown) {
      console.error('Failed to extract AH list:', err);
      setError(err instanceof Error ? err.message : 'Could not fetch list. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ade6] rounded-full blur-[120px] opacity-[0.06] pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ade6] animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#00ade6] font-bold">
                Experimental Sandbox
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
              <Apple className="w-7 h-7 text-[#00ade6]" />
              Dietary & Grocery Extract
            </h1>
            <p className="font-sans text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
              Automated ingestion testing engine for supermarket grocery lists (Albert Heijn mobile GraphQL).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#181818] border border-[#2a2a2a] px-3.5 py-2 rounded-xl text-xs font-mono text-gray-300">
            <Sparkles className="w-4 h-4 text-[#C0FF00]" />
            <span>Mobile API Read Mode</span>
          </div>
        </div>
      </div>

      {/* Input Form Card */}
      <div className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6 space-y-4">
        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">
          Albert Heijn Shared List URL (or ID)
        </label>
        
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative w-full">
            <input
              type="text"
              value={listUrl}
              onChange={(e) => setListUrl(e.target.value)}
              placeholder="https://www.ah.nl/mijnlijst/gedeelde-lijst/..."
              className="w-full bg-[#181818] border border-[#333] focus:border-[#00ade6] rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder:text-gray-600 outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleFetchList}
            disabled={loading || !listUrl.trim()}
            className="w-full sm:w-auto px-6 py-3 bg-[#00ade6] hover:bg-[#0096c7] active:scale-[0.98] text-white font-sans text-xs font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,173,230,0.25)] shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 stroke-[2.5]" />}
            <span>Extract Products</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {products.length > 0 && (
        <div className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#222] pb-3">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#00ade6]" />
              <h2 className="font-display text-sm sm:text-base font-black uppercase tracking-wider text-white">
                Extracted Products ({products.length})
              </h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Check className="w-3 h-3" /> Ready
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p, idx) => (
              <div
                key={p.id || idx}
                className="p-3.5 bg-[#161616] border border-[#262626] hover:border-[#00ade6]/40 rounded-2xl flex items-start justify-between gap-3 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-md bg-[#222] flex items-center justify-center text-[10px] font-mono font-bold text-gray-400">
                      {idx + 1}
                    </span>
                    {p.brand && (
                      <span className="text-[10px] font-mono font-bold uppercase text-[#00ade6] bg-[#00ade6]/10 px-1.5 py-0.2 rounded">
                        {p.brand}
                      </span>
                    )}
                    {p.salesUnitSize && (
                      <span className="text-[10px] font-mono text-gray-500">
                        {p.salesUnitSize}
                      </span>
                    )}
                  </div>
                  <div className="font-sans text-sm font-bold text-white group-hover:text-[#00ade6] transition-colors line-clamp-1">
                    {p.title}
                  </div>
                  <div className="text-[10px] font-mono text-gray-500 mt-1">
                    Quantity: <span className="text-gray-300 font-bold">{p.quantity}x</span>
                  </div>
                </div>

                {p.webPath && (
                  <a
                    href={`https://www.ah.nl${p.webPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-xl bg-[#202020] hover:bg-[#00ade6] text-gray-400 hover:text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                    title="View on Albert Heijn"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
