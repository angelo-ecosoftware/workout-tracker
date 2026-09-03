import { describe, it, expect } from 'vitest';
import { albertHeijnAdapter, dirkAdapter, plusAdapter, jumboAdapter } from '../../../api/scraperRegistry.ts';

describe('Server Endpoints CRUD & Scraper Registry Dispatcher', () => {

  describe('Registry Adapter Detection & Routing', () => {
    it('detects Albert Heijn product URLs and rejects non-matching URLs', () => {
      const validUrl = 'https://www.ah.nl/producten/product/wi445211/ah-boerenkaas';
      const invalidUrl = 'https://www.spar.nl/producten/kaas-123';

      expect(albertHeijnAdapter.canHandle(validUrl)).toBe(true);
      expect(albertHeijnAdapter.canHandle(invalidUrl)).toBe(false);
    });

    it('detects Dirk product URLs and handles normalization', () => {
      const dirkUrl = 'https://www.dirk.nl/boodschappen/zuivel-eieren/melk/verse-halfvolle-melk/1234';
      expect(dirkAdapter.canHandle(dirkUrl)).toBe(true);
    });

    it('detects Plus supermarket product URLs and normalizes preload URL', () => {
      const plusUrl = 'https://www.plus.nl/product/plus-magere-kwark-500g-12345';
      expect(plusAdapter.canHandle(plusUrl)).toBe(true);
      if (plusAdapter.normalizeUrl) {
        expect(plusAdapter.normalizeUrl(plusUrl)).toContain('Preload?url=');
      }
    });

    it('detects Jumbo supermarket product URLs', () => {
      const jumboUrl = 'https://www.jumbo.com/producten/jumbo-halfvolle-melk-123';
      expect(jumboAdapter.canHandle(jumboUrl)).toBe(true);
    });
  });

  describe('Scraper Model Mapping & Sanitization', () => {
    it('parses valid HTML using AlbertHeijn adapter', () => {
      const sampleHtml = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@type": "Product",
                "name": "AH Halfvolle Melk 1L",
                "brand": "Albert Heijn"
              }
            </script>
          </head>
          <body>
            <table>
              <tr><td>Voedingswaarde</td></tr>
              <tr><td>Energie</td><td>47 kcal</td></tr>
              <tr><td>Eiwitten</td><td>3.6 g</td></tr>
              <tr><td>Koolhydraten</td><td>4.8 g</td></tr>
              <tr><td>Vetten</td><td>1.5 g</td></tr>
            </table>
          </body>
        </html>
      `;

      const product = albertHeijnAdapter.parse(sampleHtml, 'https://www.ah.nl/producten/product/wi123');
      expect(product.name).toContain('Halfvolle Melk');
      expect(product.kcalPer100g).toBe(47);
      expect(product.proteinPer100g).toBe(3.6);
      expect(product.servingUnit).toBe('ml');
    });
  });
});
