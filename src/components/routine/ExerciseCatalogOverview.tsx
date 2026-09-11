import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { CatalogExercise } from '../../data/exerciseCatalog.ts';
import { fetchCatalogExercisePage } from '../../lib/db/exerciseCatalog.ts';

interface ExerciseCatalogOverviewProps {
  selectedExerciseIds: Set<string>;
  onAddExercise?: (exercise: CatalogExercise) => void;
}

const PAGE_SIZES = [5, 10, 25, 50, 100];
const MUSCLE_FILTERS = ['All muscles', 'Arms', 'Back', 'Cardio', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders'];

export const ExerciseCatalogOverview: React.FC<ExerciseCatalogOverviewProps> = ({
  selectedExerciseIds,
  onAddExercise,
}) => {
  const [search, setSearch] = useState('');
  const [muscle, setMuscle] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CatalogExercise[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchCatalogExercisePage(page, pageSize, search, muscle)
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load exercises.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, search, muscle]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstIndex = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastIndex = Math.min(page * pageSize, total);
  const pageButtons = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  }, [page, totalPages]);

  const updateSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const updateMuscle = (value: string) => {
    setMuscle(value);
    setPage(1);
  };

  return (
    <section className="space-y-4 border-t border-[#262626] pt-6" aria-labelledby="exercise-catalog-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C0FF00]">Exercise index</p>
          <h2 id="exercise-catalog-title" className="mt-1 text-xl font-display font-black uppercase text-white">
            {onAddExercise ? 'Add exercises' : 'Exercises'}
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            {onAddExercise
              ? 'Search the catalog, filter by muscle group, and add directly to this routine.'
              : 'Browse the exercise catalog by name, muscle group, and page.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <span className="sr-only">Search exercises</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search exercises"
              className="w-52 rounded-xl border border-[#333] bg-[#111] py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-[#C0FF00]"
            />
          </label>
          <label>
            <span className="sr-only">Filter by muscle</span>
            <select
              value={muscle}
              onChange={(event) => updateMuscle(event.target.value)}
              className="rounded-xl border border-[#333] bg-[#111] px-3 py-2 text-xs text-white outline-none focus:border-[#C0FF00]"
            >
              {MUSCLE_FILTERS.map((filter) => (
                <option key={filter} value={filter === 'All muscles' ? '' : filter}>
                  {filter}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#111]">
        <div className={`hidden gap-3 border-b border-[#262626] px-4 py-3 text-[9px] font-mono font-bold uppercase tracking-widest text-gray-500 sm:grid ${
          onAddExercise ? 'sm:grid-cols-[1fr_140px_100px_90px]' : 'sm:grid-cols-[1fr_180px_120px]'
        }`}>
          <span>Exercise</span>
          <span>Muscle</span>
          <span>Type</span>
          {onAddExercise && <span className="text-right">Action</span>}
        </div>
        {loading ? (
          <div className="px-4 py-10 text-center text-xs font-mono text-gray-500">Loading exercise index…</div>
        ) : error ? (
          <div className="px-4 py-10 text-center text-xs font-mono text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-4 py-10 text-center text-xs font-mono text-gray-500">No exercises match these filters.</div>
        ) : (
          <div>
            {items.map((exercise, index) => {
              const added = selectedExerciseIds.has(exercise.id);
              return (
                <div
                  key={exercise.id}
                  className={`grid gap-2 border-b border-[#202020] px-4 py-3 last:border-b-0 sm:items-center sm:gap-3 ${
                    onAddExercise ? 'sm:grid-cols-[1fr_140px_100px_90px]' : 'sm:grid-cols-[1fr_180px_120px]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 shrink-0 text-[10px] font-mono text-gray-600">{(page - 1) * pageSize + index + 1}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{exercise.name}</p>
                      <p className="text-[10px] font-mono text-gray-500">{exercise.defaultSets} sets · {exercise.defaultRepMin}-{exercise.defaultRepMax} reps</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{exercise.category}</span>
                  <span className="text-xs uppercase text-gray-500">{exercise.type}</span>
                  {onAddExercise && (
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => onAddExercise(exercise)}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                        added ? 'cursor-default border border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'bg-[#C0FF00] text-black hover:bg-[#a6dc00]'
                      }`}
                    >
                      {added ? <><Check className="h-3 w-3" /> Added</> : 'Add'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-[#333] bg-[#111] px-2 py-1 text-xs text-white"
          >
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <span>{firstIndex}-{lastIndex} of {total}</span>
        </div>
        <nav className="flex items-center gap-1" aria-label="Exercise pages">
          <button type="button" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border border-[#333] p-1.5 disabled:opacity-30" aria-label="Previous page">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {pageButtons.map((pageNumber) => (
            <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`min-w-7 rounded-lg border px-2 py-1 text-[10px] ${pageNumber === page ? 'border-[#C0FF00] bg-[#C0FF00] text-black' : 'border-[#333] text-gray-400'}`}>
              {pageNumber}
            </button>
          ))}
          <button type="button" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="rounded-lg border border-[#333] p-1.5 disabled:opacity-30" aria-label="Next page">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      </div>
    </section>
  );
};
