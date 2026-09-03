import { describe, it, expect } from 'vitest';
import { FoodItemNutrition } from '../../../src/models.ts';

interface ValidationResult {
  valid: boolean;
  statusCode: number;
  error?: string;
}

function validateFoodCreationPayload(payload: Partial<FoodItemNutrition>): ValidationResult {
  if (!payload.name || payload.name.trim().length === 0) {
    return { valid: false, statusCode: 400, error: 'Food item name is required' };
  }
  if (payload.kcalPer100g === undefined || payload.kcalPer100g < 0) {
    return { valid: false, statusCode: 422, error: 'kcalPer100g must be a non-negative number' };
  }
  if (payload.proteinPer100g === undefined || payload.proteinPer100g < 0) {
    return { valid: false, statusCode: 422, error: 'proteinPer100g must be a non-negative number' };
  }
  if (payload.carbsPer100g === undefined || payload.carbsPer100g < 0) {
    return { valid: false, statusCode: 422, error: 'carbsPer100g must be a non-negative number' };
  }
  if (payload.fatPer100g === undefined || payload.fatPer100g < 0) {
    return { valid: false, statusCode: 422, error: 'fatPer100g must be a non-negative number' };
  }
  // Theoretical max validation
  if (payload.proteinPer100g + payload.carbsPer100g + payload.fatPer100g > 105) {
    return { valid: false, statusCode: 422, error: 'Macronutrients total cannot exceed 100g per 100g serving' };
  }

  return { valid: true, statusCode: 201 };
}

describe('Dietary Creation Status Codes & Input Validation', () => {

  it('returns 201 Created for a valid food item payload', () => {
    const validItem: Partial<FoodItemNutrition> = {
      name: 'Magere Kwark',
      brand: 'AH',
      kcalPer100g: 52,
      proteinPer100g: 8.9,
      carbsPer100g: 3.5,
      fatPer100g: 0.2
    };

    const result = validateFoodCreationPayload(validItem);
    expect(result.valid).toBe(true);
    expect(result.statusCode).toBe(201);
  });

  it('returns 400 Bad Request when food name is missing or blank', () => {
    const missingName: Partial<FoodItemNutrition> = {
      name: '   ',
      kcalPer100g: 100,
      proteinPer100g: 10,
      carbsPer100g: 10,
      fatPer100g: 2
    };

    const result = validateFoodCreationPayload(missingName);
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(400);
    expect(result.error).toContain('Food item name is required');
  });

  it('returns 422 Unprocessable Entity when macro values are negative', () => {
    const negativeMacro: Partial<FoodItemNutrition> = {
      name: 'Invalid Protein Bar',
      kcalPer100g: 200,
      proteinPer100g: -5,
      carbsPer100g: 20,
      fatPer100g: 5
    };

    const result = validateFoodCreationPayload(negativeMacro);
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(422);
    expect(result.error).toContain('proteinPer100g must be a non-negative number');
  });

  it('returns 422 Unprocessable Entity when sum of macros per 100g exceeds physically possible limits', () => {
    const impossibleMacros: Partial<FoodItemNutrition> = {
      name: 'Overloaded Matrix Food',
      kcalPer100g: 900,
      proteinPer100g: 60,
      carbsPer100g: 60,
      fatPer100g: 30 // 60 + 60 + 30 = 150g > 105g
    };

    const result = validateFoodCreationPayload(impossibleMacros);
    expect(result.valid).toBe(false);
    expect(result.statusCode).toBe(422);
    expect(result.error).toContain('Macronutrients total cannot exceed 100g');
  });
});
