import Fuse from 'fuse.js';
import { WGER_EXERCISE_CATALOG, CatalogExercise } from '../constants/exerciseCatalog.ts';

export interface ExerciseSearchParams {
  query: string;
  category?: string | null;
  limit?: number;
}

const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.55 },
    { name: 'muscles', weight: 0.30 },
    { name: 'category', weight: 0.10 },
    { name: 'equipment', weight: 0.05 }
  ],
  threshold: 0.45,
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true,
  useExtendedSearch: true
};

const exerciseIndex = new Fuse(WGER_EXERCISE_CATALOG, fuseOptions);

export const ExerciseSearchEngine = {
  search(params: ExerciseSearchParams): CatalogExercise[] {
    const { query = '', category = null, limit = 15 } = params;
    const cleanQuery = query.trim();

    // If query is empty and category is specified, return all items in that category
    if (!cleanQuery && category && category !== 'All') {
      return WGER_EXERCISE_CATALOG
        .filter(ex => ex.category.toLowerCase() === category.toLowerCase())
        .slice(0, limit);
    }

    // If both query and category are empty, return top standard exercises
    if (!cleanQuery) {
      return WGER_EXERCISE_CATALOG.slice(0, limit);
    }

    let results = exerciseIndex.search(cleanQuery);

    if (category && category !== 'All') {
      results = results.filter(r => r.item.category.toLowerCase() === category.toLowerCase());
    }

    return results.slice(0, limit).map(r => r.item);
  },

  getCategories(): string[] {
    const set = new Set<string>();
    WGER_EXERCISE_CATALOG.forEach(ex => set.add(ex.category));
    return ['All', ...Array.from(set)];
  },

  getAll(): CatalogExercise[] {
    return WGER_EXERCISE_CATALOG;
  }
};
