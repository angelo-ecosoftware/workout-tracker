import { supabase } from '../supabase.ts';
import { CatalogExercise, WGER_EXERCISE_CATALOG } from '../../data/exerciseCatalog.ts';

export interface CatalogExercisePage {
  items: CatalogExercise[];
  total: number;
}

const mapCatalogRow = (row: Record<string, unknown>): CatalogExercise => {
  const name = String(row.name || 'Unnamed exercise');
  const base = WGER_EXERCISE_CATALOG.find((item) => item.name.toLowerCase().trim() === name.toLowerCase().trim());
  const category = String(row.category || base?.category || 'Full Body') as CatalogExercise['category'];
  return {
    ...(base || {}),
    id: String(row.id),
    name,
    category,
    muscles: base?.muscles || [category],
    equipment: base?.equipment || 'Free Weights / Machine',
    type: row.type === 'timed' ? 'timed' : (base?.type || 'strength'),
    defaultSets: Number(row.target_sets || base?.defaultSets || 3),
    defaultRepMin: Number(row.target_rep_min || base?.defaultRepMin || 8),
    defaultRepMax: Number(row.target_rep_max || base?.defaultRepMax || 12),
    images: row.image_url ? [String(row.image_url)] : base?.images,
  };
};

export async function fetchCatalogExercisePage(
  page: number,
  pageSize: number,
  search = '',
  muscle = ''
): Promise<CatalogExercisePage> {
  const from = Math.max(0, page - 1) * pageSize;
  let query = supabase
    .from('exercises')
    .select('id, name, type, target_sets, target_rep_min, target_rep_max, category, image_url', { count: 'exact' })
    .order('name', { ascending: true })
    .range(from, from + pageSize - 1);

  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
  if (muscle) query = query.eq('category', muscle);

  const { data, error, count } = await query;
  if (error) throw new Error(`Could not load exercises: ${error.message}`);

  return {
    items: ((data || []) as Record<string, unknown>[]).map(mapCatalogRow),
    total: count || 0,
  };
}
