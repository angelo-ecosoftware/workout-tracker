import React, { useState, useEffect } from 'react';
import { Search, Plus, Dumbbell, Sparkles, X, Loader2, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { CatalogExercise } from '../../data/exerciseCatalog.ts';
import { Exercise } from '../../models.ts';
import { getExerciseThumbnailSync } from '../../lib/exerciseApiService.ts';
import { fetchCatalogExercisePage } from '../../lib/db/exerciseCatalog.ts';
import { ExerciseGuideDrawer } from './ExerciseGuideDrawer.tsx';

interface ExerciseSearchPickerProps {
  onSelectExercise: (exercise: Partial<Exercise>) => void;
  onClose: () => void;
}

export const ExerciseSearchPicker: React.FC<ExerciseSearchPickerProps> = ({
  onSelectExercise,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [results, setResults] = useState<CatalogExercise[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [detailExercise, setDetailExercise] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingDb(true);
    fetchCatalogExercisePage(page, pageSize, searchTerm, selectedCategory === 'All' ? '' : selectedCategory)
      .then((result) => {
        if (cancelled) return;
        setResults(result.items);
        setTotalResults(result.total);
      })
      .catch((err) => {
        if (!cancelled) console.warn('Could not load database exercises:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDb(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, searchTerm, selectedCategory]);

  const categories = ['All', 'Arms', 'Back', 'Cardio', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders'];
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  const handlePickCatalogItem = (item: CatalogExercise) => {
    onSelectExercise({
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      type: item.type,
      targetSets: item.defaultSets,
      targetRepMin: item.defaultRepMin,
      targetRepMax: item.defaultRepMax
    });
  };

  const handleAddCustom = () => {
    if (!searchTerm.trim()) return;
    onSelectExercise({
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: searchTerm.trim(),
      type: 'strength',
      targetSets: 3,
      targetRepMin: 8,
      targetRepMax: 12
    });
  };

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const updateCategory = (value: string) => {
    setSelectedCategory(value);
    setPage(1);
  };

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 space-y-3.5 shadow-xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#222] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#C0FF00]/10 flex items-center justify-center text-[#C0FF00]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-bold uppercase italic text-xs tracking-wider text-white">
              Exercise Catalog & Search
            </span>
            <span className="text-[10px] font-mono font-bold bg-[#1a1a1a] text-[#C0FF00] border border-[#333] px-2 py-0.5 rounded-full flex items-center gap-1.5">
              {isLoadingDb && <Loader2 className="w-3 h-3 animate-spin text-[#C0FF00]" />}
              <span>{totalResults} exercises</span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-[#222] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          autoFocus
          value={searchTerm}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Search by name ('brenk pres'), muscle ('lats', 'chest', 'quads')..."
          className="w-full bg-[#0d0d0d] border border-[#333] focus:border-[#C0FF00] rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none transition-all"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs font-mono"
          >
            ✕
          </button>
        )}
      </div>

      {/* Muscle / Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-mono">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => updateCategory(cat)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#C0FF00] text-black border-[#C0FF00]'
                  : 'bg-[#1a1a1a] text-gray-400 border-[#262626] hover:text-white hover:border-[#383838]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Results List - displays ALL exercises continuously without truncation */}
      <div className="max-h-[420px] sm:max-h-[480px] overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {isLoadingDb ? (
          <div className="flex items-center justify-center py-8 text-xs font-mono text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#C0FF00]" /> Loading exercises...
          </div>
        ) : results.length > 0 ? (
          results.map((item) => {
            const thumb = (item.images && item.images.length > 0)
              ? item.images[0]
              : getExerciseThumbnailSync(item.name, item.id);

            return (
              <div
                key={item.id}
                onClick={() => handlePickCatalogItem(item)}
                className="flex items-center justify-between p-2 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#262626] hover:border-[#C0FF00]/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Thumbnail Preview */}
                  <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#2a2a2a] overflow-hidden shrink-0 flex items-center justify-center">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Dumbbell className="w-4 h-4 text-gray-500 group-hover:text-[#C0FF00] transition-colors" />
                    )}
                  </div>

                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="font-display font-bold text-xs text-white group-hover:text-[#C0FF00] transition-colors truncate">
                      {item.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-gray-400 flex-wrap">
                      <span className="bg-[#111] px-1.5 py-0.2 rounded text-gray-300 border border-[#222]">
                        {item.category}
                      </span>
                      <span className="truncate">{item.muscles.slice(0, 2).join(', ')}</span>
                      <span className="text-gray-500">• {item.equipment}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <span className="text-[9px] font-mono text-gray-500 hidden sm:inline mr-1">
                    {item.defaultSets}×{item.defaultRepMin}-{item.defaultRepMax}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailExercise({ id: item.id, name: item.name });
                    }}
                    className="p-1.5 rounded-lg bg-[#222] hover:bg-[#333] hover:text-[#C0FF00] text-gray-400 transition-colors cursor-pointer"
                    title={`View guide & form cues for ${item.name}`}
                    aria-label={`View guide & form cues for ${item.name}`}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-6 h-6 rounded-lg bg-[#222] group-hover:bg-[#C0FF00] group-hover:text-black flex items-center justify-center text-gray-300 transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-5 space-y-2">
            <p className="text-xs text-gray-500 font-mono">No matching catalog exercises found.</p>
            {searchTerm && (
              <button
                type="button"
                onClick={handleAddCustom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C0FF00] hover:bg-[#a6dc00] text-black rounded-lg text-xs font-mono font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add custom: "{searchTerm}"
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick custom add fallback if results exist but user typed something specific */}
      {searchTerm && results.length > 0 && (
        <div className="pt-2 border-t border-[#222] flex items-center justify-between">
          <span className="text-[10px] font-mono text-gray-500">Not in list?</span>
          <button
            type="button"
            onClick={handleAddCustom}
            className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#C0FF00] hover:underline cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add "{searchTerm}" as custom exercise
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-[#222] pt-3 text-[10px] font-mono text-gray-500">
        <label className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-[#333] bg-[#111] px-2 py-1 text-white"
          >
            {[5, 10, 25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <span>{Math.min((page - 1) * pageSize + 1, totalResults)}-{Math.min(page * pageSize, totalResults)} of {totalResults}</span>
        </label>
        <div className="flex items-center gap-1">
          <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border border-[#333] p-1 disabled:opacity-30" aria-label="Previous exercise page">
            <ChevronLeft className="h-3 w-3" />
          </button>
          <span>{page}/{totalPages}</span>
          <button type="button" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded border border-[#333] p-1 disabled:opacity-30" aria-label="Next exercise page">
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Exercise Detail Guide Drawer */}
      {detailExercise && (
        <ExerciseGuideDrawer
          isOpen={true}
          exerciseName={detailExercise.name}
          exerciseId={detailExercise.id}
          onClose={() => setDetailExercise(null)}
        />
      )}
    </div>
  );
};
