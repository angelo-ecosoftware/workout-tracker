import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  saveHiveMindFoodItem,
  fetchHiveMindFoodCatalog,
  calculatePortionNutrients,
  computeDailyTotals,
} from '../../../src/lib/dietaryData.ts';
import { FoodItemNutrition, LoggedDietaryEntry } from '../../../src/models.ts';
import { foodItemFactory } from '../../shared/fixtures/factories.ts';

let mockFoodItemsDb: any[] = [];
let shouldFailDb = false;

vi.mock('../../../src/lib/supabase.ts', () => {
  const createBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      limit: vi.fn(() => {
        if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
        let res = [...mockFoodItemsDb];
        for (const f of builder._filters) res = res.filter((r) => r[f.field] === f.val);
        return Promise.resolve({ data: res, error: null });
      }),
      or: vi.fn(() => builder),
      order: vi.fn(() => builder),
      upsert: vi.fn((payload: any) => {
        if (shouldFailDb) return { select: () => Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } }) };
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockFoodItemsDb.findIndex((r) => r.id === item.id);
          if (idx >= 0) mockFoodItemsDb[idx] = { ...mockFoodItemsDb[idx], ...item };
          else mockFoodItemsDb.push(item);
        });
        return {
          select: () => Promise.resolve({ data: items, error: null }),
          then: (resolve: any) => resolve({ data: items, error: null }),
        };
      }),
      delete: vi.fn(() => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
          mockFoodItemsDb = mockFoodItemsDb.filter((r) => r[field] !== val);
          return Promise.resolve({ data: null, error: null });
        },
      })),
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

describe('Dietary Journal Management & Custom Nutrition Engine', () => {
  beforeEach(() => {
    mockFoodItemsDb = [];
    shouldFailDb = false;
    vi.clearAllMocks();
  });

  it('1. Creates and persists a custom nutritional food item', async () => {
    const item: FoodItemNutrition = {
      id: 'food_whey_isolate',
      userId: 'usr_diet_1',
      name: 'Pure Whey Isolate',
      brand: 'GymFuel',
      kcalPer100g: 375,
      proteinPer100g: 88.0,
      carbsPer100g: 2.5,
      sugarPer100g: 0.5,
      fatPer100g: 1.0,
      fiberPer100g: 0.5,
      packageWeightGrams: 1000,
      isCustom: true,
    };

    await saveHiveMindFoodItem(item, 'usr_diet_1');

    expect(mockFoodItemsDb).toHaveLength(1);
    expect(mockFoodItemsDb[0].name).toBe('Pure Whey Isolate');
    expect(mockFoodItemsDb[0].protein_per_100g).toBe(88.0);
  });

  it('2. Calculates portion nutrients correctly from 100g base values', () => {
    const base = {
      kcalPer100g: 400,
      proteinPer100g: 20,
      carbsPer100g: 50,
      sugarPer100g: 10,
      fatPer100g: 12,
      fiberPer100g: 8,
    };

    const calculated = calculatePortionNutrients(base, 50);
    expect(calculated.calculatedKcal).toBe(200);
    expect(calculated.calculatedProtein).toBe(10);
    expect(calculated.calculatedCarbs).toBe(25);
    expect(calculated.calculatedFiber).toBe(4);
  });

  it('3. Computes daily macro totals for multiple logged entries', () => {
    const entries: LoggedDietaryEntry[] = [
      {
        id: 'ent_1',
        name: 'Oatmeal',
        foodItemId: 'f_oats',
        amountGrams: 80,
        kcalPer100g: 370,
        proteinPer100g: 13,
        carbsPer100g: 68,
        sugarPer100g: 1,
        fatPer100g: 7,
        fiberPer100g: 10,
        calculatedKcal: 296,
        calculatedProtein: 10.4,
        calculatedCarbs: 54.4,
        calculatedSugar: 0.8,
        calculatedFat: 5.6,
        calculatedFiber: 8.0,
      },
      {
        id: 'ent_2',
        name: 'Whey Shake',
        foodItemId: 'f_whey',
        amountGrams: 30,
        kcalPer100g: 380,
        proteinPer100g: 80,
        carbsPer100g: 4,
        sugarPer100g: 2,
        fatPer100g: 3,
        fiberPer100g: 0,
        calculatedKcal: 114,
        calculatedProtein: 24.0,
        calculatedCarbs: 1.2,
        calculatedSugar: 0.6,
        calculatedFat: 0.9,
        calculatedFiber: 0,
      },
    ];

    const totals = computeDailyTotals(entries);
    expect(totals.totalKcal).toBe(410);
    expect(totals.totalProtein).toBe(34.4);
    expect(totals.totalCarbs).toBe(55.6);
  });

  it('4. Queries food catalog with privacy filtering for custom vs verified items', async () => {
    mockFoodItemsDb = [
      { id: 'f1', name: 'Verified Banana', is_custom: false, user_id: null },
      { id: 'f2', name: 'Private Secret Recipe', is_custom: true, user_id: 'usr_diet_1' },
      { id: 'f3', name: 'Other User Custom Item', is_custom: true, user_id: 'usr_other' },
    ];

    const userCatalog = await fetchHiveMindFoodCatalog(undefined, 'usr_diet_1');
    expect(userCatalog).toHaveLength(2);
    expect(userCatalog.map((i) => i.name)).toContain('Verified Banana');
    expect(userCatalog.map((i) => i.name)).toContain('Private Secret Recipe');
    expect(userCatalog.map((i) => i.name)).not.toContain('Other User Custom Item');
  });
});
