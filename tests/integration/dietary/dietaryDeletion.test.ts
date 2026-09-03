import { describe, it, expect, beforeEach } from 'vitest';
import { FoodItemNutrition, LoggedDietaryEntry, DailyDietaryLog } from '../../../src/models.ts';

class MockDietaryStore {
  private customFoods = new Map<string, FoodItemNutrition>();
  private dailyLogs = new Map<string, DailyDietaryLog>(); // date -> log

  public addCustomFood(food: FoodItemNutrition) {
    this.customFoods.set(food.id, food);
  }

  public getCustomFood(id: string): FoodItemNutrition | undefined {
    return this.customFoods.get(id);
  }

  public deleteCustomFood(id: string): boolean {
    return this.customFoods.delete(id);
  }

  public addEntryToDate(date: string, entry: LoggedDietaryEntry) {
    let log = this.dailyLogs.get(date);
    if (!log) {
      log = {
        date,
        entries: [],
        totalKcal: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalSugar: 0,
        totalFat: 0,
        totalFiber: 0
      };
      this.dailyLogs.set(date, log);
    }
    log.entries.push(entry);
    this.recalculateDailyTotals(date);
  }

  public deleteEntry(date: string, entryId: string): boolean {
    const log = this.dailyLogs.get(date);
    if (!log) return false;

    const initialLength = log.entries.length;
    log.entries = log.entries.filter(e => e.id !== entryId);
    if (log.entries.length !== initialLength) {
      this.recalculateDailyTotals(date);
      return true;
    }
    return false;
  }

  public getDailyLog(date: string): DailyDietaryLog | undefined {
    return this.dailyLogs.get(date);
  }

  private recalculateDailyTotals(date: string) {
    const log = this.dailyLogs.get(date);
    if (!log) return;

    log.totalKcal = log.entries.reduce((acc, e) => acc + e.calculatedKcal, 0);
    log.totalProtein = Number(log.entries.reduce((acc, e) => acc + e.calculatedProtein, 0).toFixed(1));
    log.totalCarbs = Number(log.entries.reduce((acc, e) => acc + e.calculatedCarbs, 0).toFixed(1));
    log.totalSugar = Number(log.entries.reduce((acc, e) => acc + e.calculatedSugar, 0).toFixed(1));
    log.totalFat = Number(log.entries.reduce((acc, e) => acc + e.calculatedFat, 0).toFixed(1));
    log.totalFiber = Number(log.entries.reduce((acc, e) => acc + e.calculatedFiber, 0).toFixed(1));
  }
}

describe('Dietary Deletion Workflows & Cascading Journal Recalculation', () => {
  let store: MockDietaryStore;

  beforeEach(() => {
    store = new MockDietaryStore();
  });

  describe('Custom Food Deletion', () => {
    it('deletes a custom food item from user catalog', () => {
      const food: FoodItemNutrition = {
        id: 'cust_food_99',
        name: 'Homemade Banana Bread',
        kcalPer100g: 220,
        proteinPer100g: 6,
        carbsPer100g: 42,
        sugarPer100g: 18,
        fatPer100g: 4,
        fiberPer100g: 2,
        isCustom: true
      };

      store.addCustomFood(food);
      expect(store.getCustomFood('cust_food_99')).toBeDefined();

      const deleted = store.deleteCustomFood('cust_food_99');
      expect(deleted).toBe(true);
      expect(store.getCustomFood('cust_food_99')).toBeUndefined();
    });
  });

  describe('Logged Entry Deletion & Daily Totals Recomputation', () => {
    it('removes an individual entry from a daily log and immediately recalculates macros', () => {
      const date = '2026-09-03';

      const entry1: LoggedDietaryEntry = {
        id: 'entry_101',
        foodItemId: 'food_1',
        name: 'Whey Shake',
        amountGrams: 30,
        kcalPer100g: 400,
        proteinPer100g: 80,
        carbsPer100g: 5,
        sugarPer100g: 2,
        fatPer100g: 3,
        fiberPer100g: 0,
        calculatedKcal: 120,
        calculatedProtein: 24,
        calculatedCarbs: 1.5,
        calculatedSugar: 0.6,
        calculatedFat: 0.9,
        calculatedFiber: 0
      };

      const entry2: LoggedDietaryEntry = {
        id: 'entry_102',
        foodItemId: 'food_2',
        name: 'Rijstwafels',
        amountGrams: 50,
        kcalPer100g: 380,
        proteinPer100g: 8,
        carbsPer100g: 82,
        sugarPer100g: 1,
        fatPer100g: 3,
        fiberPer100g: 3,
        calculatedKcal: 190,
        calculatedProtein: 4,
        calculatedCarbs: 41,
        calculatedSugar: 0.5,
        calculatedFat: 1.5,
        calculatedFiber: 1.5
      };

      store.addEntryToDate(date, entry1);
      store.addEntryToDate(date, entry2);

      const initialLog = store.getDailyLog(date);
      expect(initialLog?.totalKcal).toBe(310);
      expect(initialLog?.totalProtein).toBe(28);

      // Delete entry1
      const deleted = store.deleteEntry(date, 'entry_101');
      expect(deleted).toBe(true);

      const updatedLog = store.getDailyLog(date);
      expect(updatedLog?.entries).toHaveLength(1);
      expect(updatedLog?.totalKcal).toBe(190);
      expect(updatedLog?.totalProtein).toBe(4);
      expect(updatedLog?.totalCarbs).toBe(41);
    });
  });
});
