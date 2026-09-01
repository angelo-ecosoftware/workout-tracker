import Fuse from 'fuse.js';
import { WGER_EXERCISE_CATALOG, CatalogExercise } from '../data/exerciseCatalog.ts';

export interface ExerciseSearchParams {
  query: string;
  category?: string | null;
  limit?: number;
}

// Instantiate and configure Fuse.js for high-recall fuzzy matching
const fuseOptions = {
  keys: [
    { name: 'name', weight: 0.55 },
    { name: 'muscles', weight: 0.30 },
    { name: 'category', weight: 0.10 },
    { name: 'equipment', weight: 0.05 }
  ],
  threshold: 0.45, // allows typo matches like "brenk pres" -> "Bench Press"
  distance: 100,
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true,
  useExtendedSearch: true
};

const exerciseIndex = new Fuse(WGER_EXERCISE_CATALOG, fuseOptions);

export const ExerciseSearchEngine = {
  /**
   * Search exercises with typo tolerance, muscle group matching, and category filtering.
   */
  search(params: ExerciseSearchParams): CatalogExercise[] {
    const { query = '', category = null, limit = 15 } = params;
    const cleanQuery = query.trim();

    // 1. If query is empty and category is specified, return all items in that category
    if (!cleanQuery && category && category !== 'All') {
      return WGER_EXERCISE_CATALOG
        .filter(ex => ex.category.toLowerCase() === category.toLowerCase())
        .slice(0, limit);
    }

    // 2. If both query and category are empty, return top standard exercises
    if (!cleanQuery) {
      return WGER_EXERCISE_CATALOG.slice(0, limit);
    }

    // 3. Perform fuzzy search
    let results = exerciseIndex.search(cleanQuery);

    // Filter by category if requested
    if (category && category !== 'All') {
      results = results.filter(r => r.item.category.toLowerCase() === category.toLowerCase());
    }

    return results.slice(0, limit).map(r => r.item);
  },

  /**
   * Fetch categories available in catalog
   */
  getCategories(): string[] {
    const set = new Set<string>();
    WGER_EXERCISE_CATALOG.forEach(ex => set.add(ex.category));
    return ['All', ...Array.from(set)];
  },

  /**
   * Get all exercises in catalog
   */
  getAll(): CatalogExercise[] {
    return WGER_EXERCISE_CATALOG;
  }
};
