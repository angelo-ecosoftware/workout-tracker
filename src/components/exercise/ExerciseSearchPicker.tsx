import React, { useState, useMemo } from 'react';
import { Search, Plus, Check, Dumbbell, Sparkles, X, Tag } from 'lucide-react';
import { ExerciseSearchEngine } from '../../services/exerciseSearchService.ts';
import { CatalogExercise } from '../../constants/exerciseCatalog.ts';
import { Exercise } from '../../types/index.ts';

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

  const categories = useMemo(() => ExerciseSearchEngine.getCategories(), []);

  const searchResults = useMemo(() => {
    return ExerciseSearchEngine.search({
      query: searchTerm,
      category: selectedCategory === 'All' ? null : selectedCategory,
      limit: 20
    });
  }, [searchTerm, selectedCategory]);

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
          <span className="font-display font-bold uppercase italic text-xs tracking-wider text-white">
            Exercise Catalog & Fuzzy Search
          </span>
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

      {/* Results List */}
      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
        {searchResults.length > 0 ? (
          searchResults.map((item) => (
            <div
              key={item.id}
              onClick={() => handlePickCatalogItem(item)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#181818] hover:bg-[#202020] border border-[#262626] hover:border-[#C0FF00]/40 transition-all cursor-pointer group"
            >
              <div className="flex flex-col gap-0.5">
                <div className="font-display font-bold text-xs text-white group-hover:text-[#C0FF00] transition-colors">
                  {item.name}
                </div>
                <div className="flex items-center gap-2 text-[9px] font-mono text-gray-400">
                  <span className="bg-[#111] px-1.5 py-0.5 rounded text-gray-300 border border-[#222]">
                    {item.category}
                  </span>
                  <span>{item.muscles.slice(0, 2).join(', ')}</span>
                  <span className="text-gray-500">• {item.equipment}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-gray-500 hidden sm:inline">
                  {item.defaultSets}×{item.defaultRepMin}-{item.defaultRepMax}
                </span>
                <div className="w-6 h-6 rounded-lg bg-[#222] group-hover:bg-[#C0FF00] group-hover:text-black flex items-center justify-center text-gray-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))
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
      {searchTerm && searchResults.length > 0 && (
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
    </div>
  );
};
