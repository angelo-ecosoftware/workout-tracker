import { describe, it, expect } from 'vitest';
import { extractScalePluCandidates, matchBakeryPlu, BAKERY_PLU_DICTIONARY } from '../../../src/lib/bakeryPluDictionary';

describe('Bakery PLU and GS1 In-Store Scale Barcode Resolution', () => {
  it('extracts correct PLU candidates from 13-digit in-store scale barcodes', () => {
    // Barcode: 2285623001452 (22 = scale prefix, 285623 = PLU, 00145 = €1.45 price, 2 = check digit)
    const candidates = extractScalePluCandidates('2285623001452');
    expect(candidates).toContain('285623');
    expect(candidates).toContain('28562');
  });

  it('matches user scanned Waldkorn bread barcode 2285623001452 to AH Vloer waldkorn half', () => {
    const match = matchBakeryPlu('2285623001452');
    expect(match).not.toBeNull();
    expect(match?.name).toBe('AH Vloer waldkorn half');
    expect(match?.webshopId).toBe('561020');
    expect(match?.masterGtin).toBe('08718927029937');
    expect(match?.brand).toBe('Albert Heijn');
  });

  it('matches various common bakery breads by PLU or scale code', () => {
    // Heel waldkorn
    expect(matchBakeryPlu('2285624002891')?.name).toBe('AH Vloer waldkorn heel');

    // Tijgerbrood half
    expect(matchBakeryPlu('2285700001350')?.name).toBe('AH Vloer tijger half');

    // Maisbrood half
    expect(matchBakeryPlu('2285610001402')?.name).toBe('AH Vloer mais half');

    // Meergranen half
    expect(matchBakeryPlu('2285630001458')?.name).toBe('AH Vloer meergranen half');

    // Volkoren half
    expect(matchBakeryPlu('2285600001309')?.name).toBe('AH Vloer volkoren half');

    // Spelt half
    expect(matchBakeryPlu('2285640001655')?.name).toBe('AH Vloer spelt half');
  });

  it('returns null for non-scale non-bakery barcodes', () => {
    expect(matchBakeryPlu('8718927029937')).toBeNull();
    expect(matchBakeryPlu('123456')).toBeNull();
    expect(matchBakeryPlu('')).toBeNull();
  });
});
