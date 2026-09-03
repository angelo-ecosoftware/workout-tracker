import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeProductFromHtml } from '../../../api/scraperRegistry.ts';
import {
  saveHiveMindFoodItem,
  saveHiveMindFoodItems,
  fetchHiveMindFoodCatalog,
  fetchDailyDietaryLog,
  persistDailyDietaryLog,
} from '../../../src/lib/dietaryData.ts';
import { FoodItemNutrition, DailyDietaryLog } from '../../../src/models.ts';

// -----------------------------------------------------------------------------
// In-Memory Database Store for Clean-Room Testing
// -----------------------------------------------------------------------------
let mockFoodItemsTable: any[] = [];
let mockDietaryLogsTable: any[] = [];
let mockDietaryEntriesTable: any[] = [];
let shouldSimulateDbError = false;
let simulatedDbErrorMessage = 'Database transaction deadlock / connection timeout';

// Mock localStorage polyfill for Node test runner
const memoryStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (k: string) => memoryStorage[k] || null,
  setItem: (k: string, v: string) => { memoryStorage[k] = String(v); },
  removeItem: (k: string) => { delete memoryStorage[k]; },
  clear: () => {
    for (const key in memoryStorage) delete memoryStorage[key];
  },
  key: (i: number) => Object.keys(memoryStorage)[i] || null,
  length: 0,
};

vi.mock('../../../src/lib/supabase.ts', () => {
  const createQueryBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      _searchClause: null as string | null,
      _limit: null as number | null,

      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      or: vi.fn((clause: string) => {
        builder._searchClause = clause;
        return builder;
      }),
      order: vi.fn(() => builder),
      limit: vi.fn((num: number) => {
        builder._limit = num;
        return builder;
      }),
      _getData: () => {
        let currentData =
          table === 'food_items'
            ? [...mockFoodItemsTable]
            : table === 'dietary_logs'
            ? [...mockDietaryLogsTable]
            : [...mockDietaryEntriesTable];

        for (const f of builder._filters) {
          currentData = currentData.filter((r) => r[f.field] === f.val);
        }

        if (builder._searchClause) {
          const match = builder._searchClause.match(/%([^%]+)%/);
          const search = match ? match[1].toLowerCase() : '';
          currentData = currentData.filter((row) => {
            return (
              (row.name && row.name.toLowerCase().includes(search)) ||
              (row.brand && row.brand.toLowerCase().includes(search))
            );
          });
        }

        if (builder._limit != null) {
          currentData = currentData.slice(0, builder._limit);
        }
        return currentData;
      },
      maybeSingle: vi.fn(() => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
        }
        const data = builder._getData();
        return Promise.resolve({ data: data[0] || null, error: null, status: 200 });
      }),
      single: vi.fn(() => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 });
        }
        const data = builder._getData();
        if (data.length === 0) {
          return Promise.resolve({ data: null, error: { message: 'Row not found', code: 'PGRST116' }, status: 404 });
        }
        return Promise.resolve({ data: data[0], error: null, status: 200 });
      }),
      upsert: vi.fn((payload: any) => {
        if (shouldSimulateDbError) {
          return {
            select: () => Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }),
            data: null,
            error: { message: simulatedDbErrorMessage, code: '500' },
            status: 500,
          };
        }
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const targetTable = table === 'food_items' ? mockFoodItemsTable : mockDietaryLogsTable;
          const idx = targetTable.findIndex((r) => {
            if (item.id && r.id) return r.id === item.id;
            if (r.user_id && r.log_date && item.user_id && item.log_date) {
              return r.user_id === item.user_id && r.log_date === item.log_date;
            }
            return false;
          });
          if (idx >= 0) {
            targetTable[idx] = { ...targetTable[idx], ...item, updated_at: new Date().toISOString() };
          } else {
            targetTable.push({ ...item, created_at: new Date().toISOString() });
          }
        });
        return {
          select: () => Promise.resolve({ data: items, error: null, status: 200 }),
          data: items,
          error: null,
          status: 200,
        };
      }),
      delete: vi.fn(() => {
        const deleteChain: any = {
          _filters: [] as { field: string; val: any }[],
          eq: vi.fn((field: string, val: any) => {
            deleteChain._filters.push({ field, val });
            if (shouldSimulateDbError) {
              deleteChain.then = (onfulfilled: any) =>
                Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }).then(onfulfilled);
              return deleteChain;
            }

            if (table === 'food_items') {
              const beforeCount = mockFoodItemsTable.length;
              mockFoodItemsTable = mockFoodItemsTable.filter((r) => r[field] !== val);
              const deletedCount = beforeCount - mockFoodItemsTable.length;
              deleteChain.then = (onfulfilled: any) =>
                Promise.resolve({ data: { count: deletedCount }, error: null, status: 200 }).then(onfulfilled);
              return deleteChain;
            }
            if (table === 'dietary_logs') {
              mockDietaryLogsTable = mockDietaryLogsTable.filter((r) => {
                return !deleteChain._filters.every((f: any) => r[f.field] === f.val);
              });
              deleteChain.then = (onfulfilled: any) =>
                Promise.resolve({ data: null, error: null, status: 200 }).then(onfulfilled);
              return deleteChain;
            }
            if (table === 'dietary_log_entries') {
              mockDietaryEntriesTable = mockDietaryEntriesTable.filter((r) => {
                return !deleteChain._filters.every((f: any) => r[f.field] === f.val);
              });
              deleteChain.then = (onfulfilled: any) =>
                Promise.resolve({ data: null, error: null, status: 200 }).then(onfulfilled);
              return deleteChain;
            }
            deleteChain.then = (onfulfilled: any) =>
              Promise.resolve({ data: null, error: null, status: 200 }).then(onfulfilled);
            return deleteChain;
          }),
        };
        return deleteChain;
      }),
      then: (onfulfilled: any) => {
        if (shouldSimulateDbError) {
          return Promise.resolve({ data: null, error: { message: simulatedDbErrorMessage, code: '500' }, status: 500 }).then(onfulfilled);
        }
        const data = builder._getData();
        return Promise.resolve({ data, error: null, status: 200 }).then(onfulfilled);
      },
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createQueryBuilder(table)),
    },
  };
});

describe('Full-Matrix CRUD and Error Status Code Coverage for Food & Dietary Entities', () => {
  beforeEach(() => {
    mockFoodItemsTable = [];
    mockDietaryLogsTable = [];
    mockDietaryEntriesTable = [];
    shouldSimulateDbError = false;
    localStorage.clear();
    vi.clearAllMocks();
  });

  const ahKwarkItem: FoodItemNutrition = {
    id: 'ah_wi456789',
    name: 'AH Biologische Magere Kwark',
    brand: 'AH Biologisch',
    servingUnit: 'gram',
    kcalPer100g: 56,
    proteinPer100g: 10.0,
    carbsPer100g: 3.5,
    sugarPer100g: 3.5,
    fatPer100g: 0.2,
    fiberPer100g: 0,
    packageWeightGrams: 500,
    sourceUrl: 'https://www.ah.nl/producten/product/wi456789/ah-biologische-magere-kwark',
    isCustom: false,
  };

  const jumboChickenItem: FoodItemNutrition = {
    id: 'jumbo_109283',
    name: 'Jumbo Scharrel Kipfilet',
    brand: 'Jumbo',
    servingUnit: 'gram',
    kcalPer100g: 110,
    proteinPer100g: 23.5,
    carbsPer100g: 0.0,
    sugarPer100g: 0.0,
    fatPer100g: 1.8,
    fiberPer100g: 0,
    packageWeightGrams: 400,
    sourceUrl: 'https://www.jumbo.com/producten/jumbo-scharrel-kipfilet-109283',
    isCustom: false,
  };

  const userCustomShake: FoodItemNutrition = {
    id: 'custom_shake_999',
    name: 'Post-Workout Anabolic Whey Shake',
    brand: 'Optimum Nutrition',
    servingUnit: 'gram',
    kcalPer100g: 380,
    proteinPer100g: 78.0,
    carbsPer100g: 6.5,
    sugarPer100g: 3.2,
    fatPer100g: 4.5,
    fiberPer100g: 1.0,
    packageWeightGrams: 1000,
    isCustom: true,
    userId: 'usr_alpha_1',
  };

  // =========================================================================
  // 1. CREATE (INSERT) - ALL OUTCOMES & STATUS CODES
  // =========================================================================
  describe('1. CREATE / INSERT Operations', () => {
    it('200 OK: Inserts a verified Albert Heijn product into Hive Mind catalog', async () => {
      const saved = await saveHiveMindFoodItem(ahKwarkItem);
      expect(saved).toBeDefined();
      expect(saved.id).toBe('ah_wi456789');
      expect(saved.name).toBe('AH Biologische Magere Kwark');
      expect(saved.kcalPer100g).toBe(56);
      expect(mockFoodItemsTable).toHaveLength(1);
      expect(mockFoodItemsTable[0].created_by).toBe('community');
      expect(mockFoodItemsTable[0].user_id).toBeNull();
    });

    it('200 OK: Inserts a custom private user item with strictly assigned userId', async () => {
      const saved = await saveHiveMindFoodItem(userCustomShake, 'usr_alpha_1');
      expect(saved).toBeDefined();
      expect(saved.isCustom).toBe(true);
      expect(mockFoodItemsTable).toHaveLength(1);
      expect(mockFoodItemsTable[0].user_id).toBe('usr_alpha_1');
      expect(mockFoodItemsTable[0].created_by).toBe('usr_alpha_1');
    });

    it('200 OK: Bulk inserts multiple supermarket items simultaneously (AH + Jumbo)', async () => {
      await saveHiveMindFoodItems([ahKwarkItem, jumboChickenItem]);
      expect(mockFoodItemsTable).toHaveLength(2);
      expect(mockFoodItemsTable.map((f) => f.name)).toContain('AH Biologische Magere Kwark');
      expect(mockFoodItemsTable.map((f) => f.name)).toContain('Jumbo Scharrel Kipfilet');
    });

    it('500 Internal Server Error: Handles database persistence breakdown when inserting', async () => {
      shouldSimulateDbError = true;
      await expect(saveHiveMindFoodItem(ahKwarkItem)).rejects.toThrow(
        /Database transaction deadlock/
      );
    });

    it('400 Bad Request / Empty Payload: Gracefully ignores empty bulk insert arrays', async () => {
      await saveHiveMindFoodItems([]);
      expect(mockFoodItemsTable).toHaveLength(0);
    });
  });

  // =========================================================================
  // 2. READ / QUERY - ALL OUTCOMES & STATUS CODES
  // =========================================================================
  describe('2. READ / QUERY Operations', () => {
    beforeEach(async () => {
      await saveHiveMindFoodItem(ahKwarkItem);
      await saveHiveMindFoodItem(jumboChickenItem);
      await saveHiveMindFoodItem(userCustomShake, 'usr_alpha_1');
    });

    it('200 OK: Queries full catalog for authenticated user with both public and private items', async () => {
      const results = await fetchHiveMindFoodCatalog(undefined, 'usr_alpha_1');
      expect(results).toHaveLength(3);
      expect(results.some((r) => r.id === 'ah_wi456789')).toBe(true);
      expect(results.some((r) => r.id === 'jumbo_109283')).toBe(true);
      expect(results.some((r) => r.id === 'custom_shake_999')).toBe(true);
    });

    it('401/403 Data Isolation: Prevents other users from reading private custom food items', async () => {
      // User usr_beta_2 querying catalog should ONLY see public AH and Jumbo, NOT usr_alpha_1's custom shake
      const results = await fetchHiveMindFoodCatalog(undefined, 'usr_beta_2');
      expect(results).toHaveLength(2);
      expect(results.some((r) => r.id === 'ah_wi456789')).toBe(true);
      expect(results.some((r) => r.id === 'jumbo_109283')).toBe(true);
      expect(results.some((r) => r.id === 'custom_shake_999')).toBe(false);
    });

    it('200 OK: Performs filtered search matching AH name or brand', async () => {
      const results = await fetchHiveMindFoodCatalog('kwark', 'usr_alpha_1');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('AH Biologische Magere Kwark');
      expect(results[0].kcalPer100g).toBe(56);
    });

    it('404 Not Found: Returns empty set when search query yields no matching supermarket products', async () => {
      const results = await fetchHiveMindFoodCatalog('nonexistent_dragon_fruit_item', 'usr_alpha_1');
      expect(results).toHaveLength(0);
    });

    it('500 Fallback: Gracefully falls back to local cache if database is down during search', async () => {
      // Pre-seed local cache
      localStorage.setItem('hive_mind_food_catalog_cache', JSON.stringify([ahKwarkItem]));
      shouldSimulateDbError = true;

      const fallbackCatalog = await fetchHiveMindFoodCatalog(undefined, 'usr_alpha_1');
      expect(fallbackCatalog).toHaveLength(1);
      expect(fallbackCatalog[0].id).toBe('ah_wi456789');
    });
  });

  // =========================================================================
  // 3. UPDATE / MUTATE - ALL OUTCOMES & STATUS CODES
  // =========================================================================
  describe('3. UPDATE / MUTATE Operations', () => {
    beforeEach(async () => {
      await saveHiveMindFoodItem(ahKwarkItem);
    });

    it('200 OK: Updates existing AH product attributes (price, updated macros, new formula)', async () => {
      const updatedKwark: FoodItemNutrition = {
        ...ahKwarkItem,
        kcalPer100g: 58,
        proteinPer100g: 10.5,
        fatPer100g: 0.3,
      };

      await saveHiveMindFoodItem(updatedKwark);

      expect(mockFoodItemsTable).toHaveLength(1);
      expect(mockFoodItemsTable[0].kcal_per_100g).toBe(58);
      expect(mockFoodItemsTable[0].protein_per_100g).toBe(10.5);
      expect(mockFoodItemsTable[0].fat_per_100g).toBe(0.3);
    });

    it('200 OK: Daily Dietary Log creation, entry addition, and automated macro calculations', async () => {
      const dateStr = '2026-09-03';
      const initialLog: DailyDietaryLog = {
        date: dateStr,
        entries: [
          {
            id: 'entry_1',
            foodItemId: 'ah_wi456789',
            foodItemName: 'AH Biologische Magere Kwark',
            brand: 'AH Biologisch',
            grams: 500, // 5 * 10g protein = 50g, 5 * 56kcal = 280kcal
            calculatedKcal: 280,
            calculatedProtein: 50,
            calculatedCarbs: 17.5,
            calculatedSugar: 17.5,
            calculatedFat: 1.0,
            calculatedFiber: 0,
            loggedAt: new Date().toISOString(),
          },
        ],
        totalKcal: 280,
        totalProtein: 50,
        totalCarbs: 17.5,
        totalSugar: 17.5,
        totalFat: 1.0,
        totalFiber: 0,
      };

      await persistDailyDietaryLog('usr_athlete_123', initialLog);

      const fetched = await fetchDailyDietaryLog('usr_athlete_123', dateStr);
      expect(fetched).toBeDefined();
      expect(fetched.totalKcal).toBe(280);
      expect(fetched.totalProtein).toBe(50);
      expect(fetched.entries).toHaveLength(1);

      // Now mutate/update: add a second meal (Jumbo Chicken 200g -> +47g protein, +220kcal)
      const updatedEntries = [
        ...fetched.entries,
        {
          id: 'entry_2',
          foodItemId: 'jumbo_109283',
          foodItemName: 'Jumbo Scharrel Kipfilet',
          brand: 'Jumbo',
          grams: 200,
          calculatedKcal: 220,
          calculatedProtein: 47,
          calculatedCarbs: 0,
          calculatedSugar: 0,
          calculatedFat: 3.6,
          calculatedFiber: 0,
          loggedAt: new Date().toISOString(),
        },
      ];

      const mutatedLog: DailyDietaryLog = {
        date: dateStr,
        entries: updatedEntries,
        totalKcal: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalSugar: 0,
        totalFat: 0,
        totalFiber: 0,
      };

      await persistDailyDietaryLog('usr_athlete_123', mutatedLog);

      const updatedDailyLog = await fetchDailyDietaryLog('usr_athlete_123', dateStr);
      expect(updatedDailyLog.entries).toHaveLength(2);
      expect(updatedDailyLog.totalKcal).toBe(500); // 280 + 220
      expect(updatedDailyLog.totalProtein).toBe(97); // 50 + 47
    });
  });

  // =========================================================================
  // 4. DELETE / CLEANUP - ALL OUTCOMES & STATUS CODES
  // =========================================================================
  describe('4. DELETE / CASCADE Operations', () => {
    it('200 OK: Cleans up daily dietary log when all entries are removed by user', async () => {
      const dateStr = '2026-09-03';
      const userId = 'usr_clean_123';

      // Seed a log first
      const fullLog: DailyDietaryLog = {
        date: dateStr,
        entries: [
          {
            id: 'entry_to_del',
            foodItemId: 'ah_wi456789',
            foodItemName: 'AH Kwark',
            brand: 'AH',
            grams: 250,
            calculatedKcal: 140,
            calculatedProtein: 25,
            calculatedCarbs: 8.7,
            calculatedSugar: 8.7,
            calculatedFat: 0.5,
            calculatedFiber: 0,
            loggedAt: new Date().toISOString(),
          },
        ],
        totalKcal: 140,
        totalProtein: 25,
        totalCarbs: 8.7,
        totalSugar: 8.7,
        totalFat: 0.5,
        totalFiber: 0,
      };

      await persistDailyDietaryLog(userId, fullLog);
      expect(mockDietaryLogsTable.length).toBe(1);

      // User deletes all entries for the day -> persist empty log
      const emptyLog: DailyDietaryLog = {
        date: dateStr,
        entries: [],
        totalKcal: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalSugar: 0,
        totalFat: 0,
        totalFiber: 0,
      };

      await persistDailyDietaryLog(userId, emptyLog);

      // Verify the record is completely removed from database
      expect(mockDietaryLogsTable.length).toBe(0);
      const fetched = await fetchDailyDietaryLog(userId, dateStr);
      expect(fetched.entries).toHaveLength(0);
      expect(fetched.totalKcal).toBe(0);
    });

    it('200 OK: Deletes a supermarket food item by primary key ID', async () => {
      const { supabase } = await import('../../../src/lib/supabase.ts');
      mockFoodItemsTable = [{ ...ahKwarkItem }];
      expect(mockFoodItemsTable).toHaveLength(1);

      const { data, error } = await supabase.from('food_items').delete().eq('id', 'ah_wi456789');
      expect(error).toBeNull();
      expect(mockFoodItemsTable).toHaveLength(0);
    });

    it('404 Safe Delete: Attempting to delete non-existent food item returns 0 deleted count without crashing', async () => {
      const { supabase } = await import('../../../src/lib/supabase.ts');
      mockFoodItemsTable = [{ ...ahKwarkItem }];

      const { data, error } = await supabase.from('food_items').delete().eq('id', 'non_existent_id');
      expect(error).toBeNull();
      expect(data?.count).toBe(0);
      expect(mockFoodItemsTable).toHaveLength(1);
    });
  });
});
