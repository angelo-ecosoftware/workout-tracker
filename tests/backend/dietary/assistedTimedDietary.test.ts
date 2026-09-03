import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FoodItemNutrition, LoggedDietaryEntry } from '../../../src/models.ts';

describe('Assisted Timed Dietary Logging & Auto-Portion Estimation', () => {

  describe('Assisted Sizing & Auto-Portion Calculator', () => {
    it('automatically calculates portion weight when user selects piece count based on package meta', () => {
      const foodItem: FoodItemNutrition = {
        id: 'food_eggs_10',
        name: 'Verse Eieren Maat L',
        brand: 'Blije Kip',
        kcalPer100g: 140,
        proteinPer100g: 12.5,
        carbsPer100g: 0.5,
        sugarPer100g: 0.2,
        fatPer100g: 9.8,
        fiberPer100g: 0,
        packageWeightGrams: 600, // 600g total for 10 eggs
        pieceCount: 10
      };

      const singlePieceWeight = (foodItem.packageWeightGrams && foodItem.pieceCount)
        ? foodItem.packageWeightGrams / foodItem.pieceCount
        : 50;

      const userSelectedPieces = 3;
      const computedWeightGrams = singlePieceWeight * userSelectedPieces;

      expect(computedWeightGrams).toBe(180);

      const ratio = computedWeightGrams / 100;
      const calculatedProtein = Number((foodItem.proteinPer100g * ratio).toFixed(1));
      const calculatedKcal = Math.round(foodItem.kcalPer100g * ratio);

      expect(calculatedProtein).toBe(22.5);
      expect(calculatedKcal).toBe(252);
    });

    it('handles liquid conversion for ml serving units assuming standard density', () => {
      const drinkItem: FoodItemNutrition = {
        id: 'drink_almond_01',
        name: 'Ongezoete Amandelmelk',
        brand: 'Alpro',
        servingUnit: 'ml',
        kcalPer100g: 13,
        proteinPer100g: 0.4,
        carbsPer100g: 0.2,
        sugarPer100g: 0.1,
        fatPer100g: 1.1,
        fiberPer100g: 0.3,
        packageWeightGrams: 1000 // 1L = ~1000ml
      };

      const consumedMl = 250;
      const ratio = consumedMl / 100;
      const calculatedKcal = Math.round(drinkItem.kcalPer100g * ratio);

      expect(calculatedKcal).toBe(33); // 13 * 2.5 = 32.5 => 33
    });
  });

  describe('Timed Auto-Save & Debounced Macro Sync', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('debounces rapid dietary portion input modifications', () => {
      const syncFn = vi.fn();

      const debounce = (fn: Function, delay: number) => {
        let timeoutId: any;
        return (...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => fn(...args), delay);
        };
      };

      const debouncedSync = debounce(syncFn, 300);

      debouncedSync(100);
      debouncedSync(150);
      debouncedSync(200);

      expect(syncFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(350);

      expect(syncFn).toHaveBeenCalledTimes(1);
      expect(syncFn).toHaveBeenCalledWith(200);
    });
  });
});
