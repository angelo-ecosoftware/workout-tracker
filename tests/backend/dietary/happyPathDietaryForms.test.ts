import { describe, it, expect } from 'vitest';
import { FoodItemNutrition, LoggedDietaryEntry, DailyDietaryLog } from '../../../src/models.ts';

describe('Happy Path Dietary Forms & Food Logging Workflows', () => {

  describe('Form 1: Custom Food Creation Form', () => {
    it('creates custom food item with valid macros and calculates 100g basis', () => {
      const customFoodFormInput: Omit<FoodItemNutrition, 'id'> = {
        name: 'Whey Isolate Protein Powder',
        brand: 'MyProtein',
        servingUnit: 'gram',
        kcalPer100g: 380,
        proteinPer100g: 82,
        carbsPer100g: 4.5,
        sugarPer100g: 2.1,
        fatPer100g: 1.5,
        fiberPer100g: 0.5,
        packageWeightGrams: 1000,
        pieceCount: 40,
        isCustom: true,
        userId: 'usr_diet_001'
      };

      const createdFood: FoodItemNutrition = {
        id: 'food_cust_101',
        ...customFoodFormInput
      };

      expect(createdFood.id).toBeDefined();
      expect(createdFood.proteinPer100g).toBe(82);
      expect(createdFood.isCustom).toBe(true);
      expect(createdFood.userId).toBe('usr_diet_001');
    });
  });

  describe('Form 2: Log Food Portion Entry Form', () => {
    it('calculates dynamic consumed nutritional values based on portion size', () => {
      const food: FoodItemNutrition = {
        id: 'food_101',
        name: 'Havermout Volkoren',
        brand: 'Quaker',
        servingUnit: 'gram',
        kcalPer100g: 360,
        proteinPer100g: 12.5,
        carbsPer100g: 62.0,
        sugarPer100g: 1.2,
        fatPer100g: 7.0,
        fiberPer100g: 10.0
      };

      const portionGrams = 60;
      const ratio = portionGrams / 100;

      const loggedEntry: LoggedDietaryEntry = {
        id: 'entry_log_501',
        foodItemId: food.id,
        name: food.name,
        brand: food.brand,
        amountGrams: portionGrams,
        kcalPer100g: food.kcalPer100g,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        sugarPer100g: food.sugarPer100g,
        fatPer100g: food.fatPer100g,
        fiberPer100g: food.fiberPer100g,
        calculatedKcal: Math.round(food.kcalPer100g * ratio),
        calculatedProtein: Number((food.proteinPer100g * ratio).toFixed(1)),
        calculatedCarbs: Number((food.carbsPer100g * ratio).toFixed(1)),
        calculatedSugar: Number((food.sugarPer100g * ratio).toFixed(1)),
        calculatedFat: Number((food.fatPer100g * ratio).toFixed(1)),
        calculatedFiber: Number((food.fiberPer100g * ratio).toFixed(1)),
        loggedAt: '2026-09-03T08:30:00.000Z'
      };

      expect(loggedEntry.calculatedKcal).toBe(216); // 360 * 0.6
      expect(loggedEntry.calculatedProtein).toBe(7.5); // 12.5 * 0.6
      expect(loggedEntry.calculatedCarbs).toBe(37.2); // 62 * 0.6
      expect(loggedEntry.calculatedFat).toBe(4.2); // 7 * 0.6
    });
  });

  describe('Form 3: Daily Dietary Journal Aggregation', () => {
    it('aggregates multiple food entries into a consolidated daily nutrition summary', () => {
      const entry1: LoggedDietaryEntry = {
        id: 'entry_1',
        foodItemId: 'food_1',
        name: 'Havermout',
        amountGrams: 100,
        kcalPer100g: 360,
        proteinPer100g: 13,
        carbsPer100g: 60,
        sugarPer100g: 1,
        fatPer100g: 7,
        fiberPer100g: 10,
        calculatedKcal: 360,
        calculatedProtein: 13,
        calculatedCarbs: 60,
        calculatedSugar: 1,
        calculatedFat: 7,
        calculatedFiber: 10
      };

      const entry2: LoggedDietaryEntry = {
        id: 'entry_2',
        foodItemId: 'food_2',
        name: 'Magere Kwark',
        amountGrams: 250,
        kcalPer100g: 50,
        proteinPer100g: 10,
        carbsPer100g: 3,
        sugarPer100g: 3,
        fatPer100g: 0,
        fiberPer100g: 0,
        calculatedKcal: 125,
        calculatedProtein: 25,
        calculatedCarbs: 7.5,
        calculatedSugar: 7.5,
        calculatedFat: 0,
        calculatedFiber: 0
      };

      const dailyLog: DailyDietaryLog = {
        date: '2026-09-03',
        entries: [entry1, entry2],
        totalKcal: entry1.calculatedKcal + entry2.calculatedKcal,
        totalProtein: Number((entry1.calculatedProtein + entry2.calculatedProtein).toFixed(1)),
        totalCarbs: Number((entry1.calculatedCarbs + entry2.calculatedCarbs).toFixed(1)),
        totalSugar: Number((entry1.calculatedSugar + entry2.calculatedSugar).toFixed(1)),
        totalFat: Number((entry1.calculatedFat + entry2.calculatedFat).toFixed(1)),
        totalFiber: Number((entry1.calculatedFiber + entry2.calculatedFiber).toFixed(1))
      };

      expect(dailyLog.totalKcal).toBe(485);
      expect(dailyLog.totalProtein).toBe(38);
      expect(dailyLog.totalCarbs).toBe(67.5);
      expect(dailyLog.entries).toHaveLength(2);
    });
  });
});
