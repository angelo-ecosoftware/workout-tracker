import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  lookupBarcodeProduct,
  normalizeOpenFoodFactsProduct,
  reportMissingProductToDev,
} from '../../../src/lib/barcodeService.ts';
import { supabase } from '../../../src/lib/supabase.ts';
import * as dietaryData from '../../../src/lib/dietaryData.ts';

vi.mock('../../../src/lib/supabase.ts', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('../../../src/lib/dietaryData.ts', () => ({
  mapSupabaseRowToFoodItem: vi.fn(),
  saveHiveMindFoodItem: vi.fn(),
}));

describe('barcodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeOpenFoodFactsProduct', () => {
    it('correctly maps Open Food Facts raw JSON to FoodItemNutrition', () => {
      const rawPayload = {
        status: 1,
        product: {
          code: '8710400000001',
          product_name: 'Griekse Yoghurt 0% Vet',
          brands: 'Albert Heijn',
          quantity: '500g',
          nutriments: {
            'energy-kcal_100g': 57,
            'proteins_100g': 10.3,
            'carbohydrates_100g': 4.0,
            'sugars_100g': 4.0,
            'fat_100g': 0.1,
            'fiber_100g': 0,
          },
        },
      };

      const normalized = normalizeOpenFoodFactsProduct(rawPayload, '8710400000001');

      expect(normalized).not.toBeNull();
      expect(normalized?.barcode).toBe('8710400000001');
      expect(normalized?.name).toBe('Griekse Yoghurt 0% Vet');
      expect(normalized?.brand).toBe('Albert Heijn');
      expect(normalized?.kcalPer100g).toBe(57);
      expect(normalized?.proteinPer100g).toBe(10.3);
      expect(normalized?.carbsPer100g).toBe(4.0);
      expect(normalized?.sugarPer100g).toBe(4.0);
      expect(normalized?.fatPer100g).toBe(0.1);
      expect(normalized?.fiberPer100g).toBe(0);
      expect(normalized?.packageWeightGrams).toBe(500);
      expect(normalized?.servingUnit).toBe('gram');
    });

    it('handles alternative nutriments keys and fallback values', () => {
      const rawPayload = {
        status: 1,
        product: {
          code: '123456789',
          product_name_nl: 'Volkoren Brood',
          quantity: '1.5 kg',
          nutriments: {
            'energy-kcal': 220,
            proteins: 9.5,
            carbohydrates: 40.2,
            sugars: 2.1,
            fat: 2.0,
            fiber: 7.0,
          },
        },
      };

      const normalized = normalizeOpenFoodFactsProduct(rawPayload, '123456789');

      expect(normalized).not.toBeNull();
      expect(normalized?.barcode).toBe('123456789');
      expect(normalized?.name).toBe('Volkoren Brood');
      expect(normalized?.kcalPer100g).toBe(220);
      expect(normalized?.proteinPer100g).toBe(9.5);
      expect(normalized?.carbsPer100g).toBe(40.2);
      expect(normalized?.sugarPer100g).toBe(2.1);
      expect(normalized?.fatPer100g).toBe(2.0);
      expect(normalized?.fiberPer100g).toBe(7.0);
      expect(normalized?.packageWeightGrams).toBe(1500);
    });

    it('returns null for empty or invalid data', () => {
      expect(normalizeOpenFoodFactsProduct(null, '123')).toBeNull();
      expect(normalizeOpenFoodFactsProduct({}, '123')).toBeNull();
    });
  });

  describe('lookupBarcodeProduct (multi-tier resolution)', () => {
    it('returns item directly from database if found', async () => {
      const mockRow = {
        id: 'ean_8718907000000',
        name: 'Magere Kwark',
        brand: 'Albert Heijn',
        barcode: '8718907000000',
        kcal_per_100g: 52,
        protein_per_100g: 8.5,
        carbs_per_100g: 4.0,
        fat_per_100g: 0.2,
      };

      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: mockRow, error: null }),
          }),
        }),
      });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);
      vi.mocked(dietaryData.mapSupabaseRowToFoodItem).mockReturnValue({
        id: 'ean_8718907000000',
        name: 'Magere Kwark',
        brand: 'Albert Heijn',
        barcode: '8718907000000',
        kcalPer100g: 52,
        proteinPer100g: 8.5,
        carbsPer100g: 4.0,
        sugarPer100g: 4.0,
        fatPer100g: 0.2,
        fiberPer100g: 0,
      });

      const result = await lookupBarcodeProduct('8718907000000', 'user-123');

      expect(result.found).toBe(true);
      expect(result.source).toBe('database');
      expect(result.item?.name).toBe('Magere Kwark');
    });

    it('queries Open Food Facts and auto-saves if not found in database', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name: 'High Protein Pudding',
            brands: 'Jumbo',
            quantity: '200g',
            nutriments: {
              'energy-kcal_100g': 78,
              'proteins_100g': 10.0,
              'carbohydrates_100g': 5.5,
              'sugars_100g': 4.0,
              'fat_100g': 1.5,
              'fiber_100g': 0,
            },
          },
        }),
      });
      global.fetch = mockFetch;

      const result = await lookupBarcodeProduct('8718452000000', 'user-123');

      expect(result.found).toBe(true);
      expect(result.source).toBe('openfoodfacts');
      expect(result.item?.name).toBe('High Protein Pudding');
      expect(dietaryData.saveHiveMindFoodItem).toHaveBeenCalled();
    });

    it('returns not found result when barcode does not exist', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 0,
          status_verbose: 'product not found',
        }),
      });
      global.fetch = mockFetch;

      const result = await lookupBarcodeProduct('0000000000000', 'user-123');
      expect(result.found).toBe(false);
      expect(result.item).toBeNull();
    });
  });

  describe('reportMissingProductToDev', () => {
    it('successfully posts report to developer API endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          message: 'Missing product report successfully submitted to developer API for indexing.',
        }),
      });
      global.fetch = mockFetch;

      const response = await reportMissingProductToDev({
        barcode: '8712345678901',
        name: 'Skyr Vanille',
        userId: 'user-456',
      });

      expect(response.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/report-missing-product',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            barcode: '8712345678901',
            name: 'Skyr Vanille',
            userId: 'user-456',
          }),
        })
      );
    });

    it('falls back gracefully when API network error occurs', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const response = await reportMissingProductToDev({
        barcode: '8712345678901',
      });

      expect(response.success).toBe(true);
      expect(response.message).toContain('Report noted!');
    });
  });
});
