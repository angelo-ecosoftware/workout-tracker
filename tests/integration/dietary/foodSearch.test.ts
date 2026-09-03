import { describe, it, expect } from 'vitest';
import { searchFoodItems } from '../../../src/lib/foodSearch.ts';
import { FoodItemNutrition } from '../../../src/models.ts';

const mockCatalog: FoodItemNutrition[] = [
  {
    id: 'food_1',
    name: 'Kipfilet',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 110,
    proteinPer100g: 23,
    carbsPer100g: 0,
    sugarPer100g: 0,
    fatPer100g: 1.5,
    fiberPer100g: 0,
    sourceUrl: 'https://www.ah.nl/producten/product/wi123/kipfilet',
  },
  {
    id: 'food_2',
    name: 'Magere Franse Kwark',
    brand: 'Melkan',
    servingUnit: 'gram',
    kcalPer100g: 50,
    proteinPer100g: 9,
    carbsPer100g: 3.5,
    sugarPer100g: 3.5,
    fatPer100g: 0.1,
    fiberPer100g: 0,
  },
  {
    id: 'food_3',
    name: 'Gerookte Kipfilet Reepjes',
    brand: 'AH',
    servingUnit: 'gram',
    kcalPer100g: 115,
    proteinPer100g: 24,
    carbsPer100g: 0.5,
    sugarPer100g: 0.5,
    fatPer100g: 2,
    fiberPer100g: 0,
  },
  {
    id: 'food_4',
    name: 'Halfvolle Melk',
    brand: 'Campina',
    servingUnit: 'ml',
    kcalPer100g: 47,
    proteinPer100g: 3.6,
    carbsPer100g: 4.8,
    sugarPer100g: 4.8,
    fatPer100g: 1.5,
    fiberPer100g: 0,
  },
  {
    id: 'food_5',
    name: 'Banaan',
    brand: 'Chiquita',
    servingUnit: 'gram',
    kcalPer100g: 89,
    proteinPer100g: 1.1,
    carbsPer100g: 22.8,
    sugarPer100g: 12.2,
    fatPer100g: 0.3,
    fiberPer100g: 2.6,
  },
];

describe('searchFoodItems', () => {
  it('should return exact match at the top for "Kipfilet"', () => {
    const results = searchFoodItems(mockCatalog, 'Kipfilet');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Kipfilet');
  });

  it('should rank "Kipfilet" before "Gerookte Kipfilet Reepjes" when searching "kip"', () => {
    const results = searchFoodItems(mockCatalog, 'kip');
    expect(results.length).toBe(2);
    expect(results[0].name).toBe('Kipfilet');
    expect(results[1].name).toBe('Gerookte Kipfilet Reepjes');
  });

  it('should find kwark with typo "kwrk" or "kwark"', () => {
    const results = searchFoodItems(mockCatalog, 'kwark');
    expect(results.length).toBe(1);
    expect(results[0].name).toContain('Kwark');
  });

  it('should narrow down results and not show non-matching items', () => {
    const results = searchFoodItems(mockCatalog, 'banaan');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Banaan');
  });

  it('should match brand names like "campina"', () => {
    const results = searchFoodItems(mockCatalog, 'campina');
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Halfvolle Melk');
  });

  it('should return all items when query is empty', () => {
    const results = searchFoodItems(mockCatalog, '');
    expect(results.length).toBe(mockCatalog.length);
  });
});
