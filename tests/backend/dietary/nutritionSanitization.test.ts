import { describe, it, expect } from 'vitest';
import { sanitizeNutritionMacros, calculatePortionNutrients } from '../../../src/lib/dietaryData.ts';
import { sanitizeNutritionMacros as scraperSanitize } from '../../../api/scraperRegistry.ts';

describe('Nutrition Macro Sanitization & Atwater Verification (BUG-004)', () => {
  it('1. Computes expected calories from Atwater factors when reported kcal is 0', () => {
    const raw = {
      kcalPer100g: 0,
      proteinPer100g: 20, // 80 kcal
      carbsPer100g: 10,   // 40 kcal
      sugarPer100g: 5,
      fatPer100g: 5,      // 45 kcal
      fiberPer100g: 2,    // 4 kcal
    };

    const sanitized = sanitizeNutritionMacros(raw);
    // (20 * 4) + (10 * 4) + (5 * 9) + (2 * 2) = 80 + 40 + 45 + 4 = 169 kcal
    expect(sanitized.kcalPer100g).toBe(169);
    expect(sanitized.proteinPer100g).toBe(20);
    expect(sanitized.carbsPer100g).toBe(10);
    expect(sanitized.sugarPer100g).toBe(5);
    expect(sanitized.fatPer100g).toBe(5);
    expect(sanitized.fiberPer100g).toBe(2);
  });

  it('2. Clamps sugar if retailer table parsing reports sugar > carbs', () => {
    const raw = {
      kcalPer100g: 100,
      proteinPer100g: 5,
      carbsPer100g: 10,
      sugarPer100g: 15, // Anomaly: sugar exceeds total carbs
      fatPer100g: 2,
      fiberPer100g: 0,
    };

    const sanitized = sanitizeNutritionMacros(raw);
    expect(sanitized.sugarPer100g).toBe(10);
    expect(sanitized.carbsPer100g).toBe(10);
  });

  it('3. Fixes extreme discrepancies where retailer confuses per-serving or kJ with per-100g kcal', () => {
    const raw = {
      kcalPer100g: 1200, // Anomaly: likely kJ reported instead of kcal
      proteinPer100g: 10, // 40
      carbsPer100g: 30,  // 120
      sugarPer100g: 5,
      fatPer100g: 5,     // 45
      fiberPer100g: 2,   // 4
    };
    // Expected ≈ 209 kcal vs reported 1200 (deviation > 60%)
    const sanitized = sanitizeNutritionMacros(raw);
    expect(sanitized.kcalPer100g).toBe(209);
  });

  it('4. Preserves accurate reported kcal within reasonable Atwater tolerance', () => {
    const raw = {
      kcalPer100g: 215, // Reported 215 vs expected 209 (within tolerance)
      proteinPer100g: 10,
      carbsPer100g: 30,
      sugarPer100g: 5,
      fatPer100g: 5,
      fiberPer100g: 2,
    };

    const sanitized = sanitizeNutritionMacros(raw);
    expect(sanitized.kcalPer100g).toBe(215);
  });

  it('5. Prevents negative macro values', () => {
    const raw = {
      kcalPer100g: -50,
      proteinPer100g: -10,
      carbsPer100g: -5,
      sugarPer100g: -2,
      fatPer100g: -3,
      fiberPer100g: -1,
    };

    const sanitized = sanitizeNutritionMacros(raw);
    expect(sanitized.kcalPer100g).toBe(0);
    expect(sanitized.proteinPer100g).toBe(0);
    expect(sanitized.carbsPer100g).toBe(0);
    expect(sanitized.sugarPer100g).toBe(0);
    expect(sanitized.fatPer100g).toBe(0);
    expect(sanitized.fiberPer100g).toBe(0);
  });

  it('6. Scraper registry sanitizeNutritionMacros matches dietaryData implementation', () => {
    const raw = {
      kcalPer100g: 0,
      proteinPer100g: 25,
      carbsPer100g: 0,
      sugarPer100g: 0,
      fatPer100g: 2,
      fiberPer100g: 0,
    };
    const res = scraperSanitize(raw);
    // 25 * 4 + 2 * 9 = 100 + 18 = 118 kcal
    expect(res.kcalPer100g).toBe(118);
  });
});
