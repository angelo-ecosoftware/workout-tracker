import { FoodItemNutrition, LoggedDietaryEntry, DailyDietaryLog } from '../models.ts';
import { supabase } from './supabase.ts';

// Default empty starter food catalog (dynamically populated by Hive-Mind database indexes & user additions)
export const DEFAULT_FOOD_CATALOG: FoodItemNutrition[] = [];

// Helper to calculate exact portion values given grams and 100g base
export function calculatePortionNutrients(
  base: Pick<FoodItemNutrition, 'kcalPer100g' | 'proteinPer100g' | 'carbsPer100g' | 'sugarPer100g' | 'fatPer100g' | 'fiberPer100g'>,
  grams: number
) {
  const factor = Math.max(0, grams) / 100;
  return {
    calculatedKcal: Math.round(base.kcalPer100g * factor * 10) / 10,
    calculatedProtein: Math.round(base.proteinPer100g * factor * 10) / 10,
    calculatedCarbs: Math.round(base.carbsPer100g * factor * 10) / 10,
    calculatedSugar: Math.round(base.sugarPer100g * factor * 10) / 10,
    calculatedFat: Math.round(base.fatPer100g * factor * 10) / 10,
    calculatedFiber: Math.round(base.fiberPer100g * factor * 10) / 10,
  };
}

export function computeDailyTotals(entries: LoggedDietaryEntry[]) {
  return entries.reduce(
    (acc, cur) => ({
      totalKcal: Math.round((acc.totalKcal + (cur.calculatedKcal || 0)) * 10) / 10,
      totalProtein: Math.round((acc.totalProtein + (cur.calculatedProtein || 0)) * 10) / 10,
      totalCarbs: Math.round((acc.totalCarbs + (cur.calculatedCarbs || 0)) * 10) / 10,
      totalSugar: Math.round((acc.totalSugar + (cur.calculatedSugar || 0)) * 10) / 10,
      totalFat: Math.round((acc.totalFat + (cur.calculatedFat || 0)) * 10) / 10,
      totalFiber: Math.round((acc.totalFiber + (cur.calculatedFiber || 0)) * 10) / 10,
    }),
    { totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalSugar: 0, totalFat: 0, totalFiber: 0 }
  );
}

// Supabase Hive-Mind Food Item Database Mappers & API
export function mapSupabaseRowToFoodItem(row: any): FoodItemNutrition {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || '',
    servingUnit: (row.serving_unit === 'ml' ? 'ml' : 'gram') as 'gram' | 'ml',
    kcalPer100g: Number(row.kcal_per_100g) || 0,
    proteinPer100g: Number(row.protein_per_100g) || 0,
    carbsPer100g: Number(row.carbs_per_100g) || 0,
    sugarPer100g: Number(row.sugar_per_100g) || 0,
    fatPer100g: Number(row.fat_per_100g) || 0,
    fiberPer100g: Number(row.fiber_per_100g) || 0,
    sourceUrl: row.source_url,
    barcode: row.barcode || undefined,
    packageWeightGrams: row.package_weight_grams ? Number(row.package_weight_grams) : undefined,
    pieceCount: row.piece_count ? Number(row.piece_count) : undefined,
    isCustom: Boolean(row.is_custom),
    userId: row.user_id || undefined,
  };
}

export function mapFoodItemToSupabaseRow(item: FoodItemNutrition, createdByUserId?: string) {
  const isCustom = Boolean(item.isCustom);
  const resolvedUserId = isCustom ? (item.userId || createdByUserId || null) : null;

  return {
    id: item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
    name: item.name,
    brand: item.brand || '',
    serving_unit: item.servingUnit || 'gram',
    kcal_per_100g: item.kcalPer100g || 0,
    protein_per_100g: item.proteinPer100g || 0,
    carbs_per_100g: item.carbsPer100g || 0,
    sugar_per_100g: item.sugarPer100g || 0,
    fat_per_100g: item.fatPer100g || 0,
    fiber_per_100g: item.fiberPer100g || 0,
    source_url: item.sourceUrl || null,
    barcode: item.barcode || null,
    package_weight_grams: item.packageWeightGrams || null,
    piece_count: item.pieceCount || null,
    is_custom: isCustom,
    user_id: resolvedUserId,
    created_by: isCustom ? (resolvedUserId || 'user') : 'community',
    updated_at: new Date().toISOString(),
  };
}

// Fetch the food catalog from Supabase (shared verified items + private items created by the user)
export async function fetchHiveMindFoodCatalog(searchQuery?: string, currentUserId?: string): Promise<FoodItemNutrition[]> {
  try {
    let query = supabase
      .from('food_items')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim();
      query = query.or(`name.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      const mapped = data
        .map(mapSupabaseRowToFoodItem)
        .filter((item) => {
          // If item is marked custom, it is strictly private to the user who created it
          if (item.isCustom) {
            return currentUserId && (item.userId === currentUserId);
          }
          return true; // Public verified store items (user_id IS NULL or 'community') visible to everyone
        });

      // Update local storage cache with general catalog to stay in sync with the database
      if (!searchQuery) {
        try {
          localStorage.setItem('hive_mind_food_catalog_cache', JSON.stringify(mapped));
        } catch (e) {}
      }
      return mapped;
    }
  } catch (err) {
    console.warn('Error fetching hive mind foods:', err);
  }

  // Fallback to local cache ONLY if offline/fetch error
  try {
    const raw = localStorage.getItem('hive_mind_food_catalog_cache');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item: FoodItemNutrition) => {
          if (item.isCustom) {
            return currentUserId && item.userId === currentUserId;
          }
          return true;
        });
      }
    }
  } catch (e) {}

  return DEFAULT_FOOD_CATALOG;
}

// Save a single food item to the Supabase food_items database
// For barcode & link resolution, if an item with the same name already exists in the community index, overwrite it to prevent duplicates
export async function saveHiveMindFoodItem(item: FoodItemNutrition, userId?: string): Promise<FoodItemNutrition> {
  const isCustom = Boolean(item.isCustom);

  // If this is a community item (from barcode / supermarket link / scraper), check if an item with the exact same name already exists
  if (!isCustom && item.name) {
    try {
      const { data: existing } = await supabase
        .from('food_items')
        .select('id')
        .eq('is_custom', false)
        .ilike('name', item.name.trim())
        .limit(1)
        .maybeSingle();

      if (existing && existing.id) {
        // Reuse existing ID to overwrite and update the existing product row
        item.id = existing.id;
      }
    } catch (findErr) {
      console.warn('Could not check for existing food item by name:', findErr);
    }
  }

  const row = mapFoodItemToSupabaseRow(item, userId || 'community');
  const { data, error } = await supabase.from('food_items').upsert(row, { onConflict: 'id' }).select();
  if (error) {
    console.error('Supabase food_items upsert error:', error);
    throw new Error(`Failed to save food to database: ${error.message}`);
  }
  return item;
}

// Bulk save multiple food items to the Supabase food_items database
export async function saveHiveMindFoodItems(items: FoodItemNutrition[], userId?: string): Promise<void> {
  if (!items || items.length === 0) return;
  const rows = items.map((it) => mapFoodItemToSupabaseRow(it, userId || 'community'));
  const { error } = await supabase.from('food_items').upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Supabase bulk food_items upsert error:', error);
    throw new Error(`Failed to save food items to database: ${error.message}`);
  }
}

// Local Storage helpers with user separation (returns indexed/cached items)
export function getSavedFoodCatalog(userId: string): FoodItemNutrition[] {
  try {
    const rawCache = localStorage.getItem('hive_mind_food_catalog_cache');
    if (rawCache) {
      const parsed = JSON.parse(rawCache);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const raw = localStorage.getItem(`food_catalog_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load food catalog from storage:', e);
  }
  return [];
}

export function saveFoodCatalog(userId: string, catalog: FoodItemNutrition[]) {
  try {
    localStorage.setItem(`food_catalog_${userId}`, JSON.stringify(catalog));
    localStorage.setItem('hive_mind_food_catalog_cache', JSON.stringify(catalog));
  } catch (e) {
    console.warn('Failed to save food catalog to storage:', e);
  }
}

export function getDailyDietaryLog(userId: string, dateStr: string): DailyDietaryLog {
  try {
    const raw = localStorage.getItem(`diet_log_${userId}_${dateStr}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.entries)) {
        const totals = computeDailyTotals(parsed.entries);
        return {
          date: dateStr,
          entries: parsed.entries,
          ...totals,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load daily dietary log:', e);
  }

  return {
    date: dateStr,
    entries: [],
    totalKcal: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalSugar: 0,
    totalFat: 0,
    totalFiber: 0,
  };
}

export function saveDailyDietaryLog(userId: string, log: DailyDietaryLog) {
  try {
    const totals = computeDailyTotals(log.entries);
    const updated = {
      ...log,
      ...totals,
    };
    localStorage.setItem(`diet_log_${userId}_${log.date}`, JSON.stringify(updated));

    // Also update 90-day history index of logged dietary days for fast calendar access
    const indexKey = `diet_days_index_${userId}`;
    const rawIndex = localStorage.getItem(indexKey);
    const days: string[] = rawIndex ? JSON.parse(rawIndex) : [];
    if (!days.includes(log.date)) {
      days.push(log.date);
      localStorage.setItem(indexKey, JSON.stringify(days));
    }
  } catch (e) {
    console.warn('Failed to save daily dietary log:', e);
  }
}

export async function fetchDailyDietaryLog(userId: string, dateStr: string): Promise<DailyDietaryLog> {
  // 1. Check database first
  try {
    const { data: dbLog, error } = await supabase
      .from('dietary_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', dateStr)
      .maybeSingle();

    if (!error && dbLog) {
      const entries = Array.isArray(dbLog.entries_json) ? dbLog.entries_json : [];
      const totals = computeDailyTotals(entries);
      const fullLog: DailyDietaryLog = {
        date: dateStr,
        entries,
        totalKcal: dbLog.total_kcal != null ? Number(dbLog.total_kcal) : totals.totalKcal,
        totalProtein: dbLog.total_protein != null ? Number(dbLog.total_protein) : totals.totalProtein,
        totalCarbs: dbLog.total_carbs != null ? Number(dbLog.total_carbs) : totals.totalCarbs,
        totalSugar: dbLog.total_sugar != null ? Number(dbLog.total_sugar) : totals.totalSugar,
        totalFat: dbLog.total_fat != null ? Number(dbLog.total_fat) : totals.totalFat,
        totalFiber: dbLog.total_fiber != null ? Number(dbLog.total_fiber) : totals.totalFiber,
      };
      // Keep local storage in sync
      localStorage.setItem(`diet_log_${userId}_${dateStr}`, JSON.stringify(fullLog));
      return fullLog;
    }
  } catch (err) {
    console.warn('Failed to fetch daily dietary log from Supabase, falling back to local storage:', err);
  }

  // 2. Fallback to localStorage
  return getDailyDietaryLog(userId, dateStr);
}

export async function persistDailyDietaryLog(userId: string, log: DailyDietaryLog): Promise<void> {
  const totals = computeDailyTotals(log.entries);
  const updatedLog: DailyDietaryLog = {
    ...log,
    ...totals,
  };

  // 1. Instant optimistic save to local storage for offline & responsive UI
  saveDailyDietaryLog(userId, updatedLog);

  // 2. Persist to Supabase PostgreSQL database
  try {
    const logId = `diet_${userId}_${log.date}`;

    // If the user deleted all food items from this day, clean up the empty record from the database
    if (log.entries.length === 0) {
      await supabase.from('dietary_log_entries').delete().eq('user_id', userId).eq('dietary_log_id', logId);
      await supabase.from('dietary_logs').delete().eq('user_id', userId).eq('log_date', log.date);
      return;
    }

    const payload = {
      id: logId,
      user_id: userId,
      log_date: log.date,
      total_kcal: totals.totalKcal,
      total_protein: totals.totalProtein,
      total_carbs: totals.totalCarbs,
      total_sugar: totals.totalSugar,
      total_fat: totals.totalFat,
      total_fiber: totals.totalFiber,
      entries_json: log.entries,
      updated_at: new Date().toISOString(),
    };

    const { error: logErr } = await supabase
      .from('dietary_logs')
      .upsert(payload, { onConflict: 'user_id,log_date' });

    if (logErr) {
      console.warn('Failed to upsert dietary_logs in database:', logErr);
    }

    // Also sync granular entries to dietary_log_entries table
    try {
      // Delete existing entries for this log date to replace cleanly
      await supabase.from('dietary_log_entries').delete().eq('user_id', userId).eq('dietary_log_id', logId);

      if (log.entries.length > 0) {
        const rows = log.entries.map((e) => ({
          id: e.id && !e.id.startsWith('entry_') && !e.id.startsWith('diet_entry_')
            ? e.id
            : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `diet_entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
          dietary_log_id: logId,
          user_id: userId,
          food_item_id: e.foodItemId,
          name: e.name,
          brand: e.brand || null,
          amount_grams: e.amountGrams,
          kcal_per_100g: e.kcalPer100g,
          protein_per_100g: e.proteinPer100g,
          carbs_per_100g: e.carbsPer100g,
          sugar_per_100g: e.sugarPer100g,
          fat_per_100g: e.fatPer100g,
          fiber_per_100g: e.fiberPer100g,
          calculated_kcal: e.calculatedKcal,
          calculated_protein: e.calculatedProtein,
          calculated_carbs: e.calculatedCarbs,
          calculated_sugar: e.calculatedSugar,
          calculated_fat: e.calculatedFat,
          calculated_fiber: e.calculatedFiber,
          logged_at: e.loggedAt || new Date().toISOString(),
        }));

        const { error: entriesErr } = await supabase.from('dietary_log_entries').insert(rows);
        if (entriesErr) {
          console.warn('Failed to insert dietary_log_entries rows:', entriesErr);
        }
      }
    } catch (entriesCatch) {
      console.warn('Error syncing dietary_log_entries table:', entriesCatch);
    }
  } catch (err) {
    console.error('Failed to persist daily dietary log to database:', err);
  }
}
