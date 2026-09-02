import { describe, it, expect } from 'vitest';
import { scrapeProductFromUrl } from '../api/scraperRegistry';

describe('PLUS Scraper Extraction', () => {
  it('extracts PLUS Boerentrots Kipfilet from live PLUS.nl product URL', async () => {
    const url = 'https://www.plus.nl/product/plus-boerentrots-kipfilet-1-stuk-tray-200-g-296701';
    const product = await scrapeProductFromUrl(url);

    console.log('PLUS Extracted Result:', product);

    expect(product.name).toBe('PLUS Boerentrots Kipfilet 1 stuk');
    expect(product.brand).toBe('PLUS Boerentrots');
    expect(product.kcalPer100g).toBe(112);
    expect(product.proteinPer100g).toBe(24.6);
    expect(product.fatPer100g).toBe(1.2);
    expect(product.carbsPer100g).toBe(0);
    expect(product.fiberPer100g).toBe(1.6);
    expect(product.servingUnit).toBe('gram');
  }, 15000);
});
