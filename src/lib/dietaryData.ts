import { FoodItemNutrition, LoggedDietaryEntry, DailyDietaryLog } from '../models.ts';

// Initial starter food items with accurate 100g Dutch nutrition labels
export const DEFAULT_FOOD_CATALOG: FoodItemNutrition[] = [
  {
    id: 'food_ah_basmati',
    name: 'AH Basmatirijst (ongekookt)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 355,
    proteinPer100g: 8.5,
    carbsPer100g: 77.0,
    sugarPer100g: 0.5,
    fatPer100g: 0.8,
    fiberPer100g: 1.5,
  },
  {
    id: 'food_ah_kipfilet',
    name: 'AH Scharrel kipfilet',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 110,
    proteinPer100g: 23.5,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 1.8,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_campina_halfvol',
    name: 'Campina Halfvolle melk',
    brand: 'Campina',
    servingUnit: 'ml',
    kcalPer100g: 47,
    proteinPer100g: 3.6,
    carbsPer100g: 4.8,
    sugarPer100g: 4.8,
    fatPer100g: 1.5,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_havermout',
    name: 'Havermout (Quaker / AH)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 370,
    proteinPer100g: 13.0,
    carbsPer100g: 60.0,
    sugarPer100g: 1.0,
    fatPer100g: 7.0,
    fiberPer100g: 9.0,
  },
  {
    id: 'food_ei',
    name: 'Ei (Gekookt of Gebakken)',
    brand: 'Basis',
    servingUnit: 'gram',
    kcalPer100g: 143,
    proteinPer100g: 12.6,
    carbsPer100g: 0.7,
    sugarPer100g: 0.7,
    fatPer100g: 9.9,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_pindakaas',
    name: '100% Pindakaas',
    brand: 'AH / Calvé',
    servingUnit: 'gram',
    kcalPer100g: 625,
    proteinPer100g: 26.0,
    carbsPer100g: 11.0,
    sugarPer100g: 5.0,
    fatPer100g: 52.0,
    fiberPer100g: 7.0,
  },
];

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

// Local Storage helpers with user separation
export function getSavedFoodCatalog(userId: string): FoodItemNutrition[] {
  try {
    const raw = localStorage.getItem(`food_catalog_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load food catalog from storage:', e);
  }
  return DEFAULT_FOOD_CATALOG;
}

export function saveFoodCatalog(userId: string, catalog: FoodItemNutrition[]) {
  try {
    localStorage.setItem(`food_catalog_${userId}`, JSON.stringify(catalog));
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
