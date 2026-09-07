import { describe, it, expect } from 'vitest';
import {
  kruidvatAdapter,
  etosAdapter,
  hollandAndBarrettAdapter,
  validateScraperTargetUrl,
} from '../../../api/scraperRegistry.ts';
import { getStoreMetadata, isHouseBrand, cleanProductTitle } from '../../../src/lib/storeBranding.ts';

describe('P2.3: Drugstore Nutrition & Vitamins (Kruidvat, Etos, Holland & Barrett)', () => {
  describe('Store Branding & Detection', () => {
    it('detects Kruidvat metadata from URL and product ID', () => {
      const metaUrl = getStoreMetadata('https://www.kruidvat.nl/p/protein-bar-crunchy');
      expect(metaUrl?.id).toBe('kruidvat');
      expect(metaUrl?.badgeLabel).toBe('KRUIDVAT');

      const metaId = getStoreMetadata(undefined, 'kruidvat_12345');
      expect(metaId?.id).toBe('kruidvat');
    });

    it('detects Etos metadata from URL and product ID', () => {
      const metaUrl = getStoreMetadata('https://www.etos.nl/producten/etos-multivitamine');
      expect(metaUrl?.id).toBe('etos');
      expect(metaUrl?.badgeLabel).toBe('ETOS');

      const metaId = getStoreMetadata(undefined, 'etos_9999');
      expect(metaId?.id).toBe('etos');
    });

    it('detects Holland & Barrett metadata from URL and product ID', () => {
      const metaUrl = getStoreMetadata('https://www.hollandandbarrett.nl/shop/product/creatine-monohydrate');
      expect(metaUrl?.id).toBe('hollandandbarrett');
      expect(metaUrl?.badgeLabel).toBe('H&B');

      const metaId = getStoreMetadata(undefined, 'hb_creatine_01');
      expect(metaId?.id).toBe('hollandandbarrett');
    });

    it('identifies house brands and cleans product titles', () => {
      expect(isHouseBrand('Kruidvat')).toBe(true);
      expect(isHouseBrand('Etos')).toBe(true);
      expect(isHouseBrand('Holland & Barrett')).toBe(true);
      expect(isHouseBrand('De Tuinen')).toBe(true);

      expect(cleanProductTitle('Kruidvat Eiwitreep Choco 50g')).toBe('Eiwitreep Choco 50g');
      expect(cleanProductTitle('Etos Magnesium 400mg')).toBe('Magnesium 400mg');
    });
  });

  describe('Drugstore Scraper Adapters', () => {
    it('kruidvatAdapter correctly identifies and parses Kruidvat product HTML', () => {
      expect(kruidvatAdapter.canHandle('https://www.kruidvat.nl/p/kruidvat-protein-bar-50g')).toBe(true);
      expect(kruidvatAdapter.canHandle('https://www.jumbo.com/producten')).toBe(false);

      const html = `
        <html>
          <head><title>Kruidvat Proteïne Reep Caramel - Kruidvat</title></head>
          <body>
            <h1>Kruidvat Proteïne Reep Caramel</h1>
            <table>
              <tr><td>Voedingswaarden per 100g</td></tr>
              <tr><td>Energie</td><td>380 kcal</td></tr>
              <tr><td>Eiwitten</td><td>32 g</td></tr>
              <tr><td>Koolhydraten</td><td>35 g</td></tr>
              <tr><td>waarvan suikers</td><td>2.5 g</td></tr>
              <tr><td>Vetten</td><td>14 g</td></tr>
              <tr><td>Voedingsvezel</td><td>8 g</td></tr>
            </table>
          </body>
        </html>
      `;

      const result = kruidvatAdapter.parse(html, 'https://www.kruidvat.nl/p/kruidvat-protein-bar-50g');
      expect(result.brand).toBe('Kruidvat');
      expect(result.kcalPer100g).toBe(380);
      expect(result.proteinPer100g).toBe(32);
      expect(result.carbsPer100g).toBe(35);
      expect(result.fatPer100g).toBe(14);
      expect(result.fiberPer100g).toBe(8);
      expect(result.servingUnit).toBe('gram');
    });

    it('etosAdapter correctly identifies and parses Etos product HTML', () => {
      expect(etosAdapter.canHandle('https://www.etos.nl/producten/etos-vitamine-c-1000mg')).toBe(true);

      const html = `
        <html>
          <head><title>Etos Whey Isolate Vanille - Etos</title></head>
          <body>
            <h1>Etos Whey Isolate Vanille</h1>
            <table>
              <tr><td>Voedingswaarde per 100g</td></tr>
              <tr><td>Energie</td><td>370 kcal</td></tr>
              <tr><td>Eiwit</td><td>85 g</td></tr>
              <tr><td>Koolhydraten</td><td>3 g</td></tr>
              <tr><td>Vetten</td><td>1.5 g</td></tr>
            </table>
          </body>
        </html>
      `;

      const result = etosAdapter.parse(html, 'https://www.etos.nl/producten/etos-whey-isolate-vanille');
      expect(result.brand).toBe('Etos');
      expect(result.kcalPer100g).toBe(370);
      expect(result.proteinPer100g).toBe(85);
      expect(result.carbsPer100g).toBe(3);
      expect(result.fatPer100g).toBe(1.5);
    });

    it('hollandAndBarrettAdapter correctly identifies and parses H&B product HTML', () => {
      expect(hollandAndBarrettAdapter.canHandle('https://www.hollandandbarrett.nl/shop/product/pure-creatine-powder')).toBe(true);
      expect(hollandAndBarrettAdapter.canHandle('https://www.hollandandbarrett.com/shop/product/omega-3')).toBe(true);

      const html = `
        <html>
          <head><title>Holland & Barrett Vegan Protein Shake Chocolade</title></head>
          <body>
            <h1>Vegan Protein Shake Chocolade</h1>
            <table>
              <tr><td>Voedingswaarden per 100g</td></tr>
              <tr><td>Energie</td><td>390 kcal</td></tr>
              <tr><td>Eiwitten</td><td>72 g</td></tr>
              <tr><td>Koolhydraten</td><td>8 g</td></tr>
              <tr><td>Vetten</td><td>6 g</td></tr>
            </table>
          </body>
        </html>
      `;

      const result = hollandAndBarrettAdapter.parse(html, 'https://www.hollandandbarrett.nl/shop/product/vegan-protein-123');
      expect(result.brand).toBe('Holland & Barrett');
      expect(result.kcalPer100g).toBe(390);
      expect(result.proteinPer100g).toBe(72);
      expect(result.servingUnit).toBe('ml'); // 'shake' in title resolves to 'ml'
    });
  });
});
