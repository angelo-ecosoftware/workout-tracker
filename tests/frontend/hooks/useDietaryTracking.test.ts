import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDietaryTracking } from '../../../src/components/dietary/useDietaryTracking.ts';
import { foodItemFactory } from '../../shared/fixtures/factories.ts';
import { DailyDietaryLog, FoodItemNutrition } from '../../../src/models.ts';

let mockDailyLog: DailyDietaryLog = {
  date: new Date().toISOString().split('T')[0],
  entries: [],
  totalKcal: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalSugar: 0,
  totalFat: 0,
  totalFiber: 0,
};

let mockCatalog: FoodItemNutrition[] = [];

vi.mock('../../../src/lib/dietaryData.ts', () => ({
  fetchDailyDietaryLog: vi.fn(async (_userId: string, date: string) => {
    return { ...mockDailyLog, date };
  }),
  persistDailyDietaryLog: vi.fn(async (_userId: string, log: DailyDietaryLog) => {
    mockDailyLog = { ...log };
  }),
  fetchHiveMindFoodCatalog: vi.fn(async (query: string) => {
    if (!query) return mockCatalog;
    return mockCatalog.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  }),
  saveHiveMindFoodItem: vi.fn(async (item: FoodItemNutrition) => {
    mockCatalog.push(item);
  }),
  saveHiveMindFoodItems: vi.fn(async (items: FoodItemNutrition[]) => {
    mockCatalog.push(...items);
  }),
  calculatePortionNutrients: (food: any, grams: number) => {
    const ratio = (grams || 0) / 100;
    return {
      calculatedKcal: Math.round((food.kcalPer100g || 0) * ratio),
      calculatedProtein: Number(((food.proteinPer100g || 0) * ratio).toFixed(1)),
      calculatedCarbs: Number(((food.carbsPer100g || 0) * ratio).toFixed(1)),
      calculatedSugar: Number(((food.sugarPer100g || 0) * ratio).toFixed(1)),
      calculatedFat: Number(((food.fatPer100g || 0) * ratio).toFixed(1)),
      calculatedFiber: Number(((food.fiberPer100g || 0) * ratio).toFixed(1)),
    };
  },
  computeDailyTotals: (entries: any[]) => {
    return entries.reduce(
      (acc, entry) => ({
        totalKcal: acc.totalKcal + (entry.calculatedKcal || 0),
        totalProtein: Number((acc.totalProtein + (entry.calculatedProtein || 0)).toFixed(1)),
        totalCarbs: Number((acc.totalCarbs + (entry.calculatedCarbs || 0)).toFixed(1)),
        totalSugar: Number((acc.totalSugar + (entry.calculatedSugar || 0)).toFixed(1)),
        totalFat: Number((acc.totalFat + (entry.calculatedFat || 0)).toFixed(1)),
        totalFiber: Number((acc.totalFiber + (entry.calculatedFiber || 0)).toFixed(1)),
      }),
      {
        totalKcal: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalSugar: 0,
        totalFat: 0,
        totalFiber: 0,
      }
    );
  },
}));

describe('useDietaryTracking Hook (Dynamic Reactive State Machine)', () => {
  const testUserId = `usr_${Math.random().toString(36).substring(7)}`;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDailyLog = {
      date: new Date().toISOString().split('T')[0],
      entries: [],
      totalKcal: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalSugar: 0,
      totalFat: 0,
      totalFiber: 0,
    };
    mockCatalog = [
      foodItemFactory.build({ name: 'Chicken Breast Raw', kcalPer100g: 120, proteinPer100g: 22.5 }),
      foodItemFactory.build({ name: 'Greek Yogurt 0%', kcalPer100g: 59, proteinPer100g: 10.3 }),
    ];
  });

  it('initializes with today date and empty summary state', async () => {
    const { result } = renderHook(() => useDietaryTracking(testUserId));

    expect(result.current.isToday).toBe(true);
    expect(result.current.selectedDate).toBe(new Date().toISOString().split('T')[0]);
    expect(result.current.entries).toEqual([]);
    expect(result.current.summary.totalKcal).toBe(0);
  });

  it('dynamically adds food entries and calculates macro totals in real time', async () => {
    const { result } = renderHook(() => useDietaryTracking(testUserId));

    const chicken = foodItemFactory.build({
      name: 'Chicken Breast Raw',
      kcalPer100g: 120,
      proteinPer100g: 25,
      carbsPer100g: 0,
      fatPer100g: 2,
    });

    // Add 200g of chicken
    act(() => {
      result.current.handleAddEntryToLog(chicken, 200);
    });

    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0].name).toBe('Chicken Breast Raw');
    expect(result.current.entries[0].amountGrams).toBe(200);
    expect(result.current.entries[0].calculatedKcal).toBe(240);
    expect(result.current.entries[0].calculatedProtein).toBe(50);
    expect(result.current.summary.totalKcal).toBe(240);
    expect(result.current.summary.totalProtein).toBe(50);
  });

  it('dynamically modifies portion grams and recalculates totals', async () => {
    const { result } = renderHook(() => useDietaryTracking(testUserId));

    const rice = foodItemFactory.build({
      name: 'Basmati Rice Cooked',
      kcalPer100g: 130,
      proteinPer100g: 2.7,
      carbsPer100g: 28,
      fatPer100g: 0.3,
    });

    act(() => {
      result.current.handleAddEntryToLog(rice, 100);
    });

    const entryId = result.current.entries[0].id;
    expect(result.current.summary.totalKcal).toBe(130);

    // Update portion from 100g to 250g (2.5x)
    act(() => {
      result.current.handleUpdateEntryGrams(entryId, 250);
    });

    expect(result.current.entries[0].amountGrams).toBe(250);
    expect(result.current.entries[0].calculatedKcal).toBe(325);
    expect(result.current.summary.totalKcal).toBe(325);
  });

  it('deletes an entry and updates the daily macro totals dynamically', async () => {
    const { result } = renderHook(() => useDietaryTracking(testUserId));

    const egg = foodItemFactory.build({
      name: 'Whole Egg',
      kcalPer100g: 143,
      proteinPer100g: 12.6,
      fatPer100g: 9.5,
    });

    act(() => {
      result.current.handleAddEntryToLog(egg, 100);
    });

    expect(result.current.entries).toHaveLength(1);
    const entryId = result.current.entries[0].id;

    act(() => {
      result.current.handleDeleteEntry(entryId);
    });

    expect(result.current.entries).toHaveLength(0);
    expect(result.current.summary.totalKcal).toBe(0);
    expect(result.current.summary.totalProtein).toBe(0);
  });

  it('shifts dates backwards and prevents navigating into future dates', async () => {
    const { result } = renderHook(() => useDietaryTracking(testUserId));

    // Shift 1 day into the past
    act(() => {
      result.current.handleDateShift(-1);
    });

    expect(result.current.isToday).toBe(false);

    // Shift 5 days forward (attempting future date beyond today)
    act(() => {
      result.current.handleDateShift(5);
    });

    // Should stay bounded to today or past
    const todayStr = new Date().toISOString().split('T')[0];
    expect(result.current.selectedDate <= todayStr).toBe(true);
  });
});
