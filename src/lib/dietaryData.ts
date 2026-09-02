import { FoodItemNutrition, LoggedDietaryEntry, DailyDietaryLog } from '../models.ts';

// Comprehensive starter food items with accurate Dutch NEVO / AH 100g nutrition labels
export const DEFAULT_FOOD_CATALOG: FoodItemNutrition[] = [
  // Gevogelte & Vlees (Poultry & Meat)
  {
    id: 'food_ah_kipfilet',
    name: 'Kipfilet (rauw / gebakken)',
    brand: 'AH / Slager',
    servingUnit: 'gram',
    kcalPer100g: 110,
    proteinPer100g: 23.5,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 1.8,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_ah_kippendijen',
    name: 'Kippendijfilet',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 155,
    proteinPer100g: 19.5,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 8.5,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_mager_rundergehakt',
    name: 'Mager Rundergehakt',
    brand: 'AH / Slager',
    servingUnit: 'gram',
    kcalPer100g: 180,
    proteinPer100g: 20.5,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 11.0,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_biefstuk',
    name: 'Biefstuk (Runderbiefstuk)',
    brand: 'AH / Slager',
    servingUnit: 'gram',
    kcalPer100g: 120,
    proteinPer100g: 23.0,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 3.0,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_kipfilet_vleeswaren',
    name: 'Kipfilet vleeswaren (beleg)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 105,
    proteinPer100g: 21.0,
    carbsPer100g: 1.5,
    sugarPer100g: 0.5,
    fatPer100g: 2.0,
    fiberPer100g: 0.0,
  },

  // Vis (Fish & Seafood)
  {
    id: 'food_zalmfilet',
    name: 'Zalmfilet (vers)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 208,
    proteinPer100g: 20.0,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 14.0,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_tonijn_water',
    name: 'Tonijnstukken in water (blik)',
    brand: 'John West / AH',
    servingUnit: 'gram',
    kcalPer100g: 102,
    proteinPer100g: 24.0,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 0.8,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_kabeljauw',
    name: 'Kabeljauwfilet',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 78,
    proteinPer100g: 17.5,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 0.8,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_garnalen',
    name: 'Garnalen / Scampi (gekookt)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 75,
    proteinPer100g: 16.5,
    carbsPer100g: 0.5,
    sugarPer100g: 0.0,
    fatPer100g: 0.8,
    fiberPer100g: 0.0,
  },

  // Eieren & Zuivel (Eggs & Dairy)
  {
    id: 'food_ei',
    name: 'Ei (heel ei, gekookt/gebakken)',
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
    id: 'food_eiwit_vloeibaar',
    name: 'Eiwit (vloeibaar egg whites)',
    brand: 'Two Chicks / AH',
    servingUnit: 'gram',
    kcalPer100g: 50,
    proteinPer100g: 11.0,
    carbsPer100g: 0.7,
    sugarPer100g: 0.7,
    fatPer100g: 0.2,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_magere_kwark',
    name: 'Magere Franse Kwark',
    brand: 'AH / Melkunie',
    servingUnit: 'gram',
    kcalPer100g: 52,
    proteinPer100g: 9.0,
    carbsPer100g: 4.0,
    sugarPer100g: 4.0,
    fatPer100g: 0.1,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_griekse_yoghurt_0',
    name: 'Griekse Yoghurt 0% vet',
    brand: 'Total Fage / AH',
    servingUnit: 'gram',
    kcalPer100g: 57,
    proteinPer100g: 10.3,
    carbsPer100g: 3.0,
    sugarPer100g: 3.0,
    fatPer100g: 0.0,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_campina_halfvol',
    name: 'Halfvolle melk',
    brand: 'Campina / AH',
    servingUnit: 'ml',
    kcalPer100g: 47,
    proteinPer100g: 3.6,
    carbsPer100g: 4.8,
    sugarPer100g: 4.8,
    fatPer100g: 1.5,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_amandelmelk_ongezoet',
    name: 'Amandelmelk ongezoet',
    brand: 'Alpro / AH',
    servingUnit: 'ml',
    kcalPer100g: 13,
    proteinPer100g: 0.4,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 1.1,
    fiberPer100g: 0.3,
  },
  {
    id: 'food_cottage_cheese',
    name: 'Hüttenkäse / Cottage Cheese',
    brand: 'Danone / AH',
    servingUnit: 'gram',
    kcalPer100g: 92,
    proteinPer100g: 12.3,
    carbsPer100g: 2.4,
    sugarPer100g: 2.4,
    fatPer100g: 3.5,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_whey_proteine',
    name: 'Whey Protein Poeder',
    brand: 'Generic / XXL',
    servingUnit: 'gram',
    kcalPer100g: 390,
    proteinPer100g: 80.0,
    carbsPer100g: 6.0,
    sugarPer100g: 4.0,
    fatPer100g: 5.0,
    fiberPer100g: 0.5,
  },

  // Granen, Rijst, Pasta & Brood (Carbs & Grains)
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
    id: 'food_witte_rijst_gekookt',
    name: 'Witte Rijst (gekookt)',
    brand: 'Basis',
    servingUnit: 'gram',
    kcalPer100g: 130,
    proteinPer100g: 2.7,
    carbsPer100g: 28.0,
    sugarPer100g: 0.1,
    fatPer100g: 0.3,
    fiberPer100g: 0.4,
  },
  {
    id: 'food_zilvervliesrijst',
    name: 'Zilvervliesrijst (ongekookt)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 350,
    proteinPer100g: 7.8,
    carbsPer100g: 72.0,
    sugarPer100g: 0.7,
    fatPer100g: 2.5,
    fiberPer100g: 3.5,
  },
  {
    id: 'food_havermout',
    name: 'Havermout (Havervlokken)',
    brand: 'Quaker / AH',
    servingUnit: 'gram',
    kcalPer100g: 370,
    proteinPer100g: 13.0,
    carbsPer100g: 60.0,
    sugarPer100g: 1.0,
    fatPer100g: 7.0,
    fiberPer100g: 9.0,
  },
  {
    id: 'food_volkoren_pasta',
    name: 'Volkoren Pasta (ongekookt)',
    brand: 'Grand\'Italia / AH',
    servingUnit: 'gram',
    kcalPer100g: 348,
    proteinPer100g: 13.5,
    carbsPer100g: 64.0,
    sugarPer100g: 3.0,
    fatPer100g: 2.5,
    fiberPer100g: 8.0,
  },
  {
    id: 'food_volkoren_brood',
    name: 'Volkoren Brood (1 snee = ~35g)',
    brand: 'Bakker / AH',
    servingUnit: 'gram',
    kcalPer100g: 240,
    proteinPer100g: 10.0,
    carbsPer100g: 41.0,
    sugarPer100g: 2.5,
    fatPer100g: 2.2,
    fiberPer100g: 6.5,
  },
  {
    id: 'food_zoete_aardappel',
    name: 'Zoete Aardappel (Bataat)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 86,
    proteinPer100g: 1.6,
    carbsPer100g: 17.5,
    sugarPer100g: 4.2,
    fatPer100g: 0.1,
    fiberPer100g: 3.0,
  },
  {
    id: 'food_aardappel_gekookt',
    name: 'Aardappel (gekookt)',
    brand: 'Basis',
    servingUnit: 'gram',
    kcalPer100g: 82,
    proteinPer100g: 2.0,
    carbsPer100g: 17.0,
    sugarPer100g: 0.8,
    fatPer100g: 0.1,
    fiberPer100g: 1.8,
  },

  // Vetten & Noten (Fats, Nuts & Spreads)
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
  {
    id: 'food_olijfolie',
    name: 'Olijfolie (Extra Vierge)',
    brand: 'Bertolli / AH',
    servingUnit: 'ml',
    kcalPer100g: 884,
    proteinPer100g: 0.0,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 100.0,
    fiberPer100g: 0.0,
  },
  {
    id: 'food_avocado',
    name: 'Avocado',
    brand: 'Eetrijp',
    servingUnit: 'gram',
    kcalPer100g: 160,
    proteinPer100g: 2.0,
    carbsPer100g: 1.8,
    sugarPer100g: 0.7,
    fatPer100g: 15.0,
    fiberPer100g: 6.7,
  },
  {
    id: 'food_amandelen',
    name: 'Amandelen (ongebrand/ongezouten)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 609,
    proteinPer100g: 21.0,
    carbsPer100g: 7.0,
    sugarPer100g: 4.0,
    fatPer100g: 52.0,
    fiberPer100g: 10.0,
  },
  {
    id: 'food_walnoten',
    name: 'Walnoten',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 675,
    proteinPer100g: 15.0,
    carbsPer100g: 5.0,
    sugarPer100g: 2.6,
    fatPer100g: 65.0,
    fiberPer100g: 6.0,
  },

  // Groenten & Fruit (Vegetables & Fruits)
  {
    id: 'food_banaan',
    name: 'Banaan',
    brand: 'Chiquita / AH',
    servingUnit: 'gram',
    kcalPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 20.0,
    sugarPer100g: 12.2,
    fatPer100g: 0.3,
    fiberPer100g: 2.6,
  },
  {
    id: 'food_appel',
    name: 'Appel (Elstar / Jonagold)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 52,
    proteinPer100g: 0.3,
    carbsPer100g: 12.0,
    sugarPer100g: 10.0,
    fatPer100g: 0.2,
    fiberPer100g: 2.0,
  },
  {
    id: 'food_blauwe_bessen',
    name: 'Blauwe Bessen (vers / diepvries)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 57,
    proteinPer100g: 0.7,
    carbsPer100g: 11.5,
    sugarPer100g: 9.9,
    fatPer100g: 0.3,
    fiberPer100g: 2.4,
  },
  {
    id: 'food_broccoli',
    name: 'Broccoli',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 34,
    proteinPer100g: 2.8,
    carbsPer100g: 2.4,
    sugarPer100g: 1.4,
    fatPer100g: 0.4,
    fiberPer100g: 3.0,
  },
  {
    id: 'food_spinazie',
    name: 'Spinazie (vers)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 23,
    proteinPer100g: 2.9,
    carbsPer100g: 0.8,
    sugarPer100g: 0.4,
    fatPer100g: 0.4,
    fiberPer100g: 2.2,
  },
  {
    id: 'food_paprika',
    name: 'Paprika (rood)',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 31,
    proteinPer100g: 1.0,
    carbsPer100g: 4.5,
    sugarPer100g: 4.2,
    fatPer100g: 0.3,
    fiberPer100g: 2.0,
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

// Local Storage helpers with user separation (merges default catalog with custom items)
export function getSavedFoodCatalog(userId: string): FoodItemNutrition[] {
  try {
    const raw = localStorage.getItem(`food_catalog_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge saved custom foods with default catalog by ID or Name
        const map = new Map<string, FoodItemNutrition>();
        // Add defaults first
        for (const item of DEFAULT_FOOD_CATALOG) {
          map.set(item.name.toLowerCase(), item);
        }
        // Override or add user items
        for (const item of parsed) {
          map.set(item.name.toLowerCase(), item);
        }
        return Array.from(map.values());
      }
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
