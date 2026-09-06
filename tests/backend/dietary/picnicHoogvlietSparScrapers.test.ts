import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  picnicAdapter,
  hoogvlietAdapter,
  sparAdapter,
  scrapeProductFromHtml,
} from '../../../api/scraperRegistry.ts';
import {
  resolvePicnicBarcode,
  resolveHoogvlietBarcode,
  resolveSparBarcode,
} from '../../../api/barcode-lookup.ts';
import {
  getStoreMetadata,
  isHouseBrand,
  getProductExternalUrl,
} from '../../../src/lib/storeBranding.ts';

describe('Phase 3: Picnic, Hoogvliet & Spar Ingestion & Fallback Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('1. Picnic Adapter & HTML Scraper', () => {
    it('detects Picnic URLs', () => {
      expect(picnicAdapter.canHandle('https://picnic.app/nl/p/halfvolle-melk/12345')).toBe(true);
      expect(picnicAdapter.canHandle('https://www.hoogvliet.com/product/123')).toBe(false);
    });

    it('extracts nutrition and package sizing from Picnic product HTML', () => {
      const picnicHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Picnic Halfvolle Melk 1L | Picnic</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Picnic Halfvolle Melk 1L",
                "brand": { "@type": "Brand", "name": "Picnic" },
                "gtin13": "8719326123456",
                "weight": { "@type": "QuantitativeValue", "value": "1000 ml" }
              }
            </script>
          </head>
          <body>
            <h1>Picnic Halfvolle Melk 1L</h1>
            <div>
              Voedingswaarden per 100 ml:
              <table>
                <tr><td>Energie</td><td>198 kJ / 47 kcal</td></tr>
                <tr><td>Vetten</td><td>1.5 g</td></tr>
                <tr><td>Koolhydraten</td><td>4.8 g</td></tr>
                <tr><td>Eiwitten</td><td>3.5 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      const result = scrapeProductFromHtml(picnicHtml, 'https://picnic.app/nl/p/halfvolle-melk/12345');

      expect(result.name).toBe('Picnic Halfvolle Melk 1L');
      expect(result.brand).toBe('Picnic');
      expect(result.barcode).toBe('8719326123456');
      expect(result.kcalPer100g).toBe(47);
      expect(result.proteinPer100g).toBe(3.5);
      expect(result.servingUnit).toBe('ml');
      expect(result.packageWeightGrams).toBe(1000);
    });
  });

  describe('2. Hoogvliet Adapter & HTML Scraper', () => {
    it('detects Hoogvliet URLs', () => {
      expect(hoogvlietAdapter.canHandle('https://www.hoogvliet.com/product/kipfilet-naturel-450g')).toBe(true);
      expect(hoogvlietAdapter.canHandle('https://www.spar.nl/producten/kip')).toBe(false);
    });

    it('extracts Schema.org and Dutch nutrition table from Hoogvliet HTML', () => {
      const hoogvlietHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Hoogvliet Kipfilet Naturel 450 g</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Hoogvliet Kipfilet Naturel 450 g",
                "brand": "Hoogvliet",
                "gtin13": "8712345678901"
              }
            </script>
          </head>
          <body>
            <h1>Hoogvliet Kipfilet Naturel 450 g</h1>
            <div>
              Voedingswaarden per 100g:
              <table>
                <tr><td>Energie</td><td>460 kJ / 110 kcal</td></tr>
                <tr><td>Vetten</td><td>1.2 g</td></tr>
                <tr><td>Eiwitten</td><td>24.0 g</td></tr>
                <tr><td>Koolhydraten</td><td>0.0 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      const result = scrapeProductFromHtml(hoogvlietHtml, 'https://www.hoogvliet.com/product/kipfilet-450g');

      expect(result.name).toBe('Hoogvliet Kipfilet Naturel 450 g');
      expect(result.brand).toBe('Hoogvliet');
      expect(result.kcalPer100g).toBe(110);
      expect(result.proteinPer100g).toBe(24.0);
      expect(result.packageWeightGrams).toBe(450);
    });
  });

  describe('3. Spar Nederland Adapter & HTML Scraper', () => {
    it('detects Spar URLs', () => {
      expect(sparAdapter.canHandle('https://www.spar.nl/producten/zuivel/spar-magere-kwark-500g-12345/')).toBe(true);
      expect(sparAdapter.canHandle('https://www.ah.nl/producten/product/wi123')).toBe(false);
    });

    it('extracts nutrition and sizing from Spar HTML', () => {
      const sparHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>SPAR Magere Kwark 500 g</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "SPAR Magere Kwark 500 g",
                "brand": "SPAR",
                "gtin13": "8710200300400"
              }
            </script>
          </head>
          <body>
            <h1>SPAR Magere Kwark 500 g</h1>
            <div>
              Voedingswaarden per 100g:
              <table>
                <tr><td>Energie</td><td>230 kJ / 54 kcal</td></tr>
                <tr><td>Vetten</td><td>0.1 g</td></tr>
                <tr><td>Koolhydraten</td><td>4.2 g</td></tr>
                <tr><td>Eiwitten</td><td>9.0 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      const result = scrapeProductFromHtml(sparHtml, 'https://www.spar.nl/producten/spar-magere-kwark-500g-12345/');

      expect(result.name).toBe('SPAR Magere Kwark 500 g');
      expect(result.brand).toBe('SPAR');
      expect(result.kcalPer100g).toBe(54);
      expect(result.proteinPer100g).toBe(9.0);
      expect(result.packageWeightGrams).toBe(500);
    });
  });

  describe('4. Picnic, Hoogvliet & Spar Barcode Lookups', () => {
    it('resolves product details from Picnic barcode search', async () => {
      const mockSearchHtml = `
        <html><body><a href="/p/picnic-havermout/556677">Havermout</a></body></html>
      `;
      const mockProductHtml = `
        <html>
          <body>
            <h1>Picnic Havermout 500 g</h1>
            <div>
              Voedingswaarden per 100g:
              <table>
                <tr><td>Energie</td><td>365 kcal</td></tr>
                <tr><td>Eiwitten</td><td>13.5 g</td></tr>
                <tr><td>Koolhydraten</td><td>58 g</td></tr>
                <tr><td>Vetten</td><td>7 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      (global.fetch as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => mockSearchHtml })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => mockProductHtml });

      const res = await resolvePicnicBarcode('8719326123456');
      expect(res).not.toBeNull();
      expect(res?.name).toBe('Picnic Havermout 500 g');
      expect(res?.proteinPer100g).toBe(13.5);
    });

    it('resolves product details from Hoogvliet barcode search', async () => {
      const mockSearchHtml = `
        <html><body><a href="/product/hoogvliet-eieren-10st">Eieren</a></body></html>
      `;
      const mockProductHtml = `
        <html>
          <body>
            <h1>Hoogvliet Scharreleieren 10 stuks</h1>
            <div>
              Voedingswaarden per 100g:
              <table>
                <tr><td>Energie</td><td>145 kcal</td></tr>
                <tr><td>Eiwitten</td><td>12.5 g</td></tr>
                <tr><td>Vetten</td><td>10.0 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      (global.fetch as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => mockSearchHtml })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => mockProductHtml });

      const res = await resolveHoogvlietBarcode('8712345678901');
      expect(res).not.toBeNull();
      expect(res?.name).toBe('Hoogvliet Scharreleieren 10 stuks');
      expect(res?.proteinPer100g).toBe(12.5);
    });

    it('resolves product details from Spar barcode search', async () => {
      const mockSearchHtml = `
        <html><body><a href="/producten/spar-tonijn-12345">Tonijn</a></body></html>
      `;
      const mockProductHtml = `
        <html>
          <body>
            <h1>SPAR Tonijnstukken in water 160 g</h1>
            <div>
              Voedingswaarden per 100g:
              <table>
                <tr><td>Energie</td><td>105 kcal</td></tr>
                <tr><td>Eiwitten</td><td>24.5 g</td></tr>
                <tr><td>Vetten</td><td>0.8 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      (global.fetch as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => mockSearchHtml })
        .mockResolvedValueOnce({ ok: true, status: 200, text: async () => mockProductHtml });

      const res = await resolveSparBarcode('8710200300400');
      expect(res).not.toBeNull();
      expect(res?.name).toBe('SPAR Tonijnstukken in water 160 g');
      expect(res?.proteinPer100g).toBe(24.5);
    });
  });

  describe('5. Store Metadata & Branding for Picnic, Hoogvliet & Spar', () => {
    it('detects metadata and badges correctly', () => {
      const picnicMeta = getStoreMetadata('https://picnic.app/nl/p/item/123');
      expect(picnicMeta?.id).toBe('picnic');
      expect(picnicMeta?.badgeLabel).toBe('PICNIC');

      const hoogvlietMeta = getStoreMetadata('https://www.hoogvliet.com/product/item');
      expect(hoogvlietMeta?.id).toBe('hoogvliet');
      expect(hoogvlietMeta?.badgeLabel).toBe('HOOGVLIET');

      const sparMeta = getStoreMetadata('https://www.spar.nl/producten/item');
      expect(sparMeta?.id).toBe('spar');
      expect(sparMeta?.badgeLabel).toBe('SPAR');
    });

    it('generates accurate direct search links', () => {
      const picnicUrl = getProductExternalUrl({
        id: 'picnic_123',
        name: 'Picnic Magere Melk',
        brand: 'Picnic',
      });
      expect(picnicUrl?.url).toContain('picnic.app/nl/zoeken?q=');
      expect(picnicUrl?.label).toBe('Zoek op Picnic');

      const hoogvlietUrl = getProductExternalUrl({
        id: 'hoogvliet_456',
        name: 'Hoogvliet Witbrood',
        brand: 'Hoogvliet',
      });
      expect(hoogvlietUrl?.url).toContain('hoogvliet.com/zoeken?q=');
      expect(hoogvlietUrl?.label).toBe('Zoek op Hoogvliet.com');

      const sparUrl = getProductExternalUrl({
        id: 'spar_789',
        name: 'Spar Bananen',
        brand: 'Spar',
      });
      expect(sparUrl?.url).toContain('spar.nl/zoeken/?q=');
      expect(sparUrl?.label).toBe('Zoek op Spar.nl');
    });
  });
});
