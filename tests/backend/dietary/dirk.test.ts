import { describe, it, expect } from 'vitest';
import { scrapeProductFromHtml, dirkAdapter } from '../../../api/scraperRegistry.ts';

describe('Dirk Scraper Extraction', () => {
  it('extracts Vleeschmeesters Kipfilet accurately from live Dirk.nl URL', async () => {
    const url = 'https://www.dirk.nl/boodschappen/vlees-vis/kip-kalkoen/vleeschmeesters%20kipfilet/112179';
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
    });
    expect(res.status).toBe(200);

    const html = await res.text();
    const product = scrapeProductFromHtml(html, url);

    console.log('Dirk Extracted Result:', product);

    expect(product.name).toContain('Kipfilet');
    expect(product.brand).toBe('Vleeschmeesters');
    expect(product.kcalPer100g).toBe(108);
    expect(product.proteinPer100g).toBe(23.9);
    expect(product.fatPer100g).toBe(1.4);
    expect(product.carbsPer100g).toBe(0);
  }, 15000);
});
