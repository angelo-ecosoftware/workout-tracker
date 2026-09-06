import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateGtinCheckDigit,
  isValidGtinChecksum,
  sanitizeBarcode,
  generateBarcodeVariants,
} from '../../../src/lib/barcodeNormalizer.ts';
import { lookupBarcodeProduct } from '../../../src/lib/barcodeService.ts';
import { supabase } from '../../../src/lib/supabase.ts';

vi.mock('../../../src/lib/supabase.ts', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Phase 1: UPC/EAN Barcode Normalization & Checksum Verification Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('1. calculateGtinCheckDigit & Checksum Validation', () => {
    it('calculates exact GS1 check digit for 12-digit EAN-13 payload (871040001662 -> 5)', () => {
      const checkDigit = calculateGtinCheckDigit('871040001662');
      expect(checkDigit).toBe(5);
    });

    it('calculates exact GS1 check digit for 11-digit UPC-A payload (01200000013 -> 3)', () => {
      const checkDigit = calculateGtinCheckDigit('01200000013');
      expect(checkDigit).toBe(3);
    });

    it('calculates exact GS1 check digit for 7-digit EAN-8 payload (9638507 -> 4)', () => {
      const checkDigit = calculateGtinCheckDigit('9638507');
      expect(checkDigit).toBe(4);
    });

    it('validates authentic GS1 barcodes via isValidGtinChecksum', () => {
      expect(isValidGtinChecksum('8710400016625')).toBe(true); // EAN-13
      expect(isValidGtinChecksum('012000000133')).toBe(true);  // UPC-A (12-digit)
      expect(isValidGtinChecksum('96385074')).toBe(true);      // EAN-8
      expect(isValidGtinChecksum('08710400016625')).toBe(true);// GTIN-14
    });

    it('rejects corrupted barcodes with invalid checksums or invalid lengths', () => {
      expect(isValidGtinChecksum('8710400016629')).toBe(false); // wrong check digit
      expect(isValidGtinChecksum('12345')).toBe(false);         // too short
      expect(isValidGtinChecksum('8710400016625999')).toBe(false); // too long
      expect(isValidGtinChecksum('87104A0016625')).toBe(false); // non-numeric
    });
  });

  describe('2. sanitizeBarcode formatting cleanup', () => {
    it('cleans whitespace, hyphens, and formatting noise from scanned barcodes', () => {
      expect(sanitizeBarcode(' 8710-400-016625 ')).toBe('8710400016625');
      expect(sanitizeBarcode('0 11110 00001 8')).toBe('011110000018');
      expect(sanitizeBarcode('')).toBe('');
    });
  });

  describe('3. generateBarcodeVariants cross-format resolution', () => {
    it('generates 13-digit EAN and 14-digit GTIN variants for 12-digit UPC-A', () => {
      const variants = generateBarcodeVariants('011110000018');
      expect(variants).toContain('011110000018');        // Original 12-digit
      expect(variants).toContain('0011110000018');       // 13-digit zero-padded EAN
      expect(variants).toContain('00011110000018');      // 14-digit GTIN
    });

    it('generates 12-digit UPC variant for 13-digit EAN starting with 0', () => {
      const variants = generateBarcodeVariants('0011110000018');
      expect(variants).toContain('0011110000018');       // Original 13-digit
      expect(variants).toContain('011110000018');        // Stripped 12-digit UPC
      expect(variants).toContain('00011110000018');      // 14-digit GTIN
    });

    it('generates zero-padded EAN-13 and GTIN-14 for 8-digit EAN-8', () => {
      const variants = generateBarcodeVariants('96385074');
      expect(variants).toContain('96385074');            // Original EAN-8
      expect(variants).toContain('0000096385074');       // 13-digit representation
      expect(variants).toContain('00000096385074');      // 14-digit representation
    });
  });

  describe('4. Multi-variant Supabase & OpenFoodFacts Lookup Integration', () => {
    it('queries Supabase with all GTIN/UPC variants in OR filter', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: 'ean_0011110000018',
            name: 'Protein Supplement Drink',
            brand: 'Optimum Nutrition',
            barcode: '0011110000018',
            kcal_per_100g: 80,
            protein_per_100g: 10,
            carbs_per_100g: 2,
            fat_per_100g: 1,
            fiber_per_100g: 0,
            sugar_per_100g: 1,
          },
          error: null,
        }),
      };

      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryBuilder);

      // Search with 12-digit UPC
      const res = await lookupBarcodeProduct('011110000018');

      expect(res.found).toBe(true);
      expect(res.source).toBe('database');
      expect(res.item?.name).toBe('Protein Supplement Drink');

      // Verify the OR filter included both 12-digit and 13-digit padded variants
      expect(mockQueryBuilder.or).toHaveBeenCalledWith(
        expect.stringContaining('barcode.eq.011110000018')
      );
      expect(mockQueryBuilder.or).toHaveBeenCalledWith(
        expect.stringContaining('barcode.eq.0011110000018')
      );
    });

    it('tries zero-padded variant against OpenFoodFacts when initial query fails', async () => {
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      (supabase.from as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockQueryBuilder);

      // Mock first fetch failing (supermarket & first OFF call 404), second OFF call succeeding with padded code
      (global.fetch as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: false, status: 404 }) // Supermarket resolver 404
        .mockResolvedValueOnce({ ok: false, status: 404 }) // OFF first variant (12-digit) 404
        .mockResolvedValueOnce({                           // OFF second variant (13-digit zero-padded) 200
          ok: true,
          status: 200,
          json: async () => ({
            status: 1,
            product: {
              product_name: 'Clear Whey Isolate',
              brands: 'MyProtein',
              nutriments: {
                'energy-kcal_100g': 85,
                proteins_100g: 20,
                carbohydrates_100g: 0.5,
                fat_100g: 0.1,
              },
            },
          }),
        });

      const res = await lookupBarcodeProduct('011110000018');

      expect(res.found).toBe(true);
      expect(res.source).toBe('openfoodfacts');
      expect(res.item?.name).toBe('Clear Whey Isolate');
      expect(res.item?.proteinPer100g).toBe(20);
    });
  });
});
