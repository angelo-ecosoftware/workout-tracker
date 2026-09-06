import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  lidlAdapter,
  aldiAdapter,
  scrapeProductFromHtml,
} from '../../../api/scraperRegistry.ts';
import {
  resolveLidlBarcode,
  resolveAldiBarcode,
} from '../../../api/barcode-lookup.ts';
import {
  getStoreMetadata,
  isHouseBrand,
  getProductExternalUrl,
} from '../../../src/lib/storeBranding.ts';

describe('Phase 2: Lidl & Aldi Nederland Ingestion & Fallback Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('1. Lidl Nederland Adapter & HTML Parser', () => {
    it('correctly detects Lidl URLs', () => {
      expect(lidlAdapter.canHandle('https://www.lidl.nl/p/milbona-high-protein-kwark/p10036367')).toBe(true);
      expect(lidlAdapter.canHandle('https://www.jumbo.com/producten/kwark')).toBe(false);
    });

    it('extracts Schema.org JSON-LD and Dutch nutrition table from Lidl HTML', () => {
      const lidlHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Milbona High Protein Kwark 200 g bestellen | Lidl</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Milbona High Protein Kwark 200 g",
                "brand": { "@type": "Brand", "name": "Milbona" },
                "gtin13": "4056489382194",
                "weight": { "@type": "QuantitativeValue", "value": "200 g" }
              }
            </script>
          </head>
          <body>
            <h1>Milbona High Protein Kwark 200 g</h1>
            <div class="nutrition-section">
              Voedingswaarden per 100 gram:
              <table>
                <tr><td>Energie</td><td>340 kJ / 80 kcal</td></tr>
                <tr><td>Vetten</td><td>0.2 g</td></tr>
                <tr><td>Waarvan verzadigde vetzuren</td><td>0.1 g</td></tr>
                <tr><td>Koolhydraten</td><td>4.5 g</td></tr>
                <tr><td>Waarvan suikers</td><td>4.0 g</td></tr>
                <tr><td>Eiwitten</td><td>15.0 g</td></tr>
                <tr><td>Voedingsvezels</td><td>0.0 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      const result = scrapeProductFromHtml(lidlHtml, 'https://www.lidl.nl/p/milbona-high-protein-kwark/p10036367');

      expect(result.name).toBe('Milbona High Protein Kwark 200 g');
      expect(result.brand).toBe('Milbona');
      expect(result.barcode).toBe('4056489382194');
      expect(result.kcalPer100g).toBe(80);
      expect(result.proteinPer100g).toBe(15.0);
      expect(result.carbsPer100g).toBe(4.5);
      expect(result.fatPer100g).toBe(0.2);
      expect(result.packageWeightGrams).toBe(200);
    });
  });

  describe('2. Aldi Nederland Adapter & HTML Parser', () => {
    it('correctly detects Aldi URLs', () => {
      expect(aldiAdapter.canHandle('https://www.aldi.nl/producten/zuivel-eieren/milsani-magere-kwark.html')).toBe(true);
      expect(aldiAdapter.canHandle('https://www.ah.nl/producten/product/wi123')).toBe(false);
    });

    it('extracts nutrition and sizing from Aldi HTML table and headings', () => {
      const aldiHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Milsani Magere Franse Kwark 500 g | ALDI</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Milsani Magere Franse Kwark 500 g",
                "brand": "Milsani",
                "gtin13": "23048912"
              }
            </script>
          </head>
          <body>
            <h1>Milsani Magere Franse Kwark 500 g</h1>
            <div>
              Voedingswaarden per 100g:
              <table>
                <tr><td>Energie</td><td>220 kJ / 52 kcal</td></tr>
                <tr><td>Vetten</td><td>0.1 g</td></tr>
                <tr><td>Koolhydraten</td><td>4.0 g</td></tr>
                <tr><td>Suikers</td><td>4.0 g</td></tr>
                <tr><td>Eiwitten</td><td>8.9 g</td></tr>
                <tr><td>Vezels</td><td>0.0 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      const result = scrapeProductFromHtml(aldiHtml, 'https://www.aldi.nl/producten/zuivel/milsani-kwark-500g');

      expect(result.name).toBe('Milsani Magere Franse Kwark 500 g');
      expect(result.brand).toBe('Milsani');
      expect(result.barcode).toBe('23048912');
      expect(result.kcalPer100g).toBe(52);
      expect(result.proteinPer100g).toBe(8.9);
      expect(result.carbsPer100g).toBe(4.0);
      expect(result.fatPer100g).toBe(0.1);
      expect(result.packageWeightGrams).toBe(500);
    });
  });

  describe('3. Lidl & Aldi Barcode Search Fallbacks', () => {
    it('resolves product details from Lidl barcode search', async () => {
      const mockSearchHtml = `
        <html>
          <body>
            <a href="/p/milbona-protein-drink/p987654">Milbona Protein Drink</a>
          </body>
        </html>
      `;
      const mockProductHtml = `
        <html>
          <head>
            <title>Milbona Protein Drink 330 ml | Lidl</title>
          </head>
          <body>
            <h1>Milbona Protein Drink 330 ml</h1>
            <div>
              Voedingswaarden per 100 ml:
              <table>
                <tr><td>Energie</td><td>60 kcal</td></tr>
                <tr><td>Eiwitten</td><td>10.0 g</td></tr>
                <tr><td>Koolhydraten</td><td>4.8 g</td></tr>
                <tr><td>Vetten</td><td>0.2 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      (global.fetch as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => mockSearchHtml,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => mockProductHtml,
        });

      const res = await resolveLidlBarcode('4056489382194');

      expect(res).not.toBeNull();
      expect(res?.name).toBe('Milbona Protein Drink 330 ml');
      expect(res?.proteinPer100g).toBe(10.0);
      expect(res?.kcalPer100g).toBe(60);
      expect(res?.barcode).toBe('4056489382194');
    });

    it('resolves product details from Aldi barcode search', async () => {
      const mockSearchHtml = `
        <html>
          <body>
            <a href="/producten/zuivel/milsani-proteine-kwark">Milsani Proteine Kwark</a>
          </body>
        </html>
      `;
      const mockProductHtml = `
        <html>
          <head>
            <title>Milsani Proteine Kwark Aardbei | ALDI</title>
          </head>
          <body>
            <h1>Milsani Proteine Kwark Aardbei</h1>
            <div>
              Voedingswaarden per 100g:
              <table>
                <tr><td>Energie</td><td>75 kcal</td></tr>
                <tr><td>Eiwitten</td><td>11.2 g</td></tr>
                <tr><td>Koolhydraten</td><td>5.5 g</td></tr>
                <tr><td>Vetten</td><td>0.2 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      (global.fetch as unknown as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => mockSearchHtml,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => mockProductHtml,
        });

      const res = await resolveAldiBarcode('23048912');

      expect(res).not.toBeNull();
      expect(res?.name).toBe('Milsani Proteine Kwark Aardbei');
      expect(res?.proteinPer100g).toBe(11.2);
      expect(res?.kcalPer100g).toBe(75);
    });
  });

  describe('4. Store Metadata & Branding for Lidl and Aldi', () => {
    it('detects Lidl store metadata and house brands', () => {
      const meta = getStoreMetadata('https://www.lidl.nl/p/milbona-pudding/p123');
      expect(meta?.id).toBe('lidl');
      expect(meta?.badgeLabel).toBe('LIDL');

      expect(isHouseBrand('Milbona', meta)).toBe(true);
      expect(isHouseBrand('Vemondo', meta)).toBe(true);
      expect(isHouseBrand('Crownfield', meta)).toBe(true);
    });

    it('detects Aldi store metadata and house brands', () => {
      const meta = getStoreMetadata('https://www.aldi.nl/producten/milsani-kwark');
      expect(meta?.id).toBe('aldi');
      expect(meta?.badgeLabel).toBe('ALDI');

      expect(isHouseBrand('Milsani', meta)).toBe(true);
      expect(isHouseBrand('Cucina Nobile', meta)).toBe(true);
      expect(isHouseBrand('Gut Bio', meta)).toBe(true);
    });

    it('generates accurate search URLs for Lidl and Aldi items', () => {
      const lidlUrl = getProductExternalUrl({
        id: 'lidl_123',
        name: 'Milbona Proteine Pudding Choco',
        brand: 'Milbona',
      });
      expect(lidlUrl?.url).toContain('lidl.nl/q/search?q=');
      expect(lidlUrl?.label).toBe('Zoek op Lidl.nl');

      const aldiUrl = getProductExternalUrl({
        id: 'aldi_456',
        name: 'Milsani Kwark Vanille',
        brand: 'Milsani',
      });
      expect(aldiUrl?.url).toContain('aldi.nl/zoekresultaten.html?query=');
      expect(aldiUrl?.label).toBe('Zoek op Aldi.nl');
    });
  });
});
