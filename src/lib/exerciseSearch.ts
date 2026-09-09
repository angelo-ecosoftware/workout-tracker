import Fuse from 'fuse.js';
import { MASTER_EXERCISE_CATALOG, CatalogExercise } from '../data/exerciseCatalog.ts';

export interface ExerciseSearchParams {
  query: string;
  category?: string | null;
  limit?: number | null;
}

// Instantiate and configure Fuse.js for high-recall fuzzy matching over the 900+ exercise dataset
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

const exerciseIndex = new Fuse(MASTER_EXERCISE_CATALOG, fuseOptions);

export const ExerciseSearchEngine = {
  /**
   * Search exercises with typo tolerance, muscle group matching, and category filtering.
   * If limit is null or undefined, returns ALL matching exercises.
   */
  search(params: ExerciseSearchParams): CatalogExercise[] {
    const { query = '', category = null, limit = null } = params;
    const cleanQuery = query.trim();

    // 1. If query is empty and category is specified, return all items in that category
    if (!cleanQuery && category && category !== 'All') {
      const filtered = MASTER_EXERCISE_CATALOG
        .filter(ex => ex.category.toLowerCase() === category.toLowerCase());
      return limit ? filtered.slice(0, limit) : filtered;
    }

    // 2. If both query and category are empty, return all exercises
    if (!cleanQuery) {
      return limit ? MASTER_EXERCISE_CATALOG.slice(0, limit) : MASTER_EXERCISE_CATALOG;
    }

    // 3. Perform fuzzy search
    let results = exerciseIndex.search(cleanQuery);

    // Filter by category if requested
    if (category && category !== 'All') {
      results = results.filter(r => r.item.category.toLowerCase() === category.toLowerCase());
    }

    const mapped = results.map(r => r.item);
    return limit ? mapped.slice(0, limit) : mapped;
  },

  /**
   * Fetch categories available in catalog
   */
  getCategories(): string[] {
    const set = new Set<string>();
    MASTER_EXERCISE_CATALOG.forEach(ex => set.add(ex.category));
    return ['All', ...Array.from(set)];
  },

  /**
   * Get all exercises in catalog
   */
  getAll(): CatalogExercise[] {
    return MASTER_EXERCISE_CATALOG;
  },

  /**
   * Total exercises available
   */
  count(): number {
    return MASTER_EXERCISE_CATALOG.length;
  }
};

export const CANONICAL_SINGLE_EXERCISE_MAP: Record<string, string> = {
  'bench press (barbell or dumbbell)': 'Barbell Bench Press',
  'pull-ups / lat pulldown': 'Pull-ups',
  'seated cable row / dumbbell row': 'Seated Cable Row',
  'triceps pushdown or dips': 'Triceps Pushdown',
  'back squat or goblet squat': 'Barbell Back Squat',
  'leg curl (machine or nordic)': 'Lying Leg Curl',
  'chest-supported row or rear-delt fly': 'Chest-Supported Row',
  'deadlift or romanian deadlift': 'Barbell Deadlift',
  'front squat or leg press': 'Front Squat',
  'dips (chest / triceps)': 'Chest Dips',
  'rear delt flyes (machine or dumbbell)': 'Rear Delt Flyes',
  'leg curl (lying or seated)': 'Lying Leg Curl',
  'hanging leg / knee raises': 'Hanging Knee Raises',
  'overhead press / military press': 'Overhead Press',
};

/**
 * Normalizes exercise names to ensure strictly ONE exercise is represented per entry.
 * Disallows compound sentences with "or" or "/" (e.g. "Bench Press (barbell or dumbbell)" -> "Barbell Bench Press").
 */
export function formatSingleExerciseName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct canonical lookup
  if (CANONICAL_SINGLE_EXERCISE_MAP[lower]) {
    return CANONICAL_SINGLE_EXERCISE_MAP[lower];
  }

  // 2. If it contains parentheticals with "or" (e.g. "Bench Press (barbell or dumbbell)")
  let result = trimmed.replace(/\s*\([^)]*\bor\b[^)]*\)/gi, '').trim();

  // 3. If it contains slashes indicating multiple choices (e.g. "Pull-ups / Lat Pulldown")
  if (result.includes('/')) {
    result = result.split('/')[0].trim();
  }

  // 4. If it contains standalone " or " indicating alternate exercises (e.g. "Back Squat or Goblet Squat")
  if (/\s+or\s+/i.test(result)) {
    result = result.split(/\s+or\s+/i)[0].trim();
  }

  // 5. Clean up any leftover empty brackets or dangling punctuation
  result = result.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '').trim();

  return result || trimmed;
}

/**
 * Validates whether an exercise name contains multi-exercise compound phrasing ("or", "/").
 */
export function isCompoundExerciseName(name: string): boolean {
  if (!name) return false;
  return /\b(or)\b/i.test(name) || name.includes('/');
}
