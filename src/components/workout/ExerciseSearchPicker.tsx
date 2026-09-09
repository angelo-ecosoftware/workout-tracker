import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Check, Dumbbell, Sparkles, X, Tag, Loader2, Info } from 'lucide-react';
import { ExerciseSearchEngine } from '../../lib/exerciseSearch.ts';
import { CatalogExercise } from '../../data/exerciseCatalog.ts';
import { Exercise } from '../../models.ts';
import { getExerciseThumbnailSync } from '../../lib/exerciseApiService.ts';
import { fetchAllCatalogExercises } from '../../lib/supabaseData.ts';
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
  const [dbLoadedCount, setDbLoadedCount] = useState<number>(() => ExerciseSearchEngine.count());
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [detailExercise, setDetailExercise] = useState<{ id: string; name: string } | null>(null);

  // Fetch full 1,500+ animated GIF exercise catalog from Supabase PostgreSQL database
  useEffect(() => {
    let isMounted = true;
    setIsLoadingDb(true);
    fetchAllCatalogExercises()
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          setDbLoadedCount(items.length);
        }
      })
      .catch((err) => {
        console.warn('Could not load database exercises:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDb(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => ExerciseSearchEngine.getCategories(), [dbLoadedCount]);

  // Return ALL matching results without any slicing or artificial caps
  const allSearchResults = useMemo(() => {
    return ExerciseSearchEngine.search({
      query: searchTerm,
      category: selectedCategory === 'All' ? null : selectedCategory,
      limit: null,
    });
  }, [searchTerm, selectedCategory, dbLoadedCount]);

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
              <span>{allSearchResults.length} exercises (100% Animated GIFs)</span>
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
          onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={() => setSelectedCategory(cat)}
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
        {allSearchResults.length > 0 ? (
          allSearchResults.map((item) => {
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
      {searchTerm && allSearchResults.length > 0 && (
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
