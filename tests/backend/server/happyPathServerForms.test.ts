import { describe, it, expect } from 'vitest';
import { parseDutchNutritionTable, extractSchemaAndHeadings, extractPackageSizing } from '../../../api/scraperRegistry.ts';

describe('Happy Path Server Forms: Scraper Parsing, Schemas & Sizing Pipelines', () => {

  describe('Form 1: Product Nutritional Table Parsing Pipeline', () => {
    it('accurately parses standard Dutch food nutrition table from HTML payload', () => {
      const html = `
        <div class="product-info">
          <table>
            <thead><tr><th>Voedingswaarden</th><th>Per 100g</th></tr></thead>
            <tbody>
              <tr><td>Energie</td><td>220 kcal</td></tr>
              <tr><td>Vetten</td><td>4.2 g</td></tr>
              <tr><td>Waarvan verzadigd</td><td>1.1 g</td></tr>
              <tr><td>Koolhydraten</td><td>18.5 g</td></tr>
              <tr><td>Waarvan suikers</td><td>3.2 g</td></tr>
              <tr><td>Voedingsvezel</td><td>3.5 g</td></tr>
              <tr><td>Eiwitten</td><td>24.0 g</td></tr>
            </tbody>
          </table>
        </div>
      `;

      const nutrition = parseDutchNutritionTable(html);
      expect(nutrition.kcalPer100g).toBe(220);
      expect(nutrition.fatPer100g).toBe(4.2);
      expect(nutrition.carbsPer100g).toBe(18.5);
      expect(nutrition.sugarPer100g).toBe(3.2);
      expect(nutrition.fiberPer100g).toBe(3.5);
      expect(nutrition.proteinPer100g).toBe(24.0);
    });
  });

  describe('Form 2: JSON-LD Schema & Headings Extraction Pipeline', () => {
    it('extracts clean product title and brand from Schema.org metadata', () => {
      const html = `
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "AH Biologische Magere Melk 1L | Albert Heijn",
                "brand": "AH Biologisch"
              }
            </script>
          </head>
        </html>
      `;

      const result = extractSchemaAndHeadings(html, 'AH');
      expect(result.title).toBe('Biologische Magere Melk 1L');
      expect(result.brand).toBe('AH Biologisch');
    });
  });

  describe('Form 3: Package Sizing & Quantity Parsing Pipeline', () => {
    it('extracts gram weight and piece count from titles and html content', () => {
      const title = 'Plus Boerenkaas 45+ 400g';
      const html = '<div>Verpakking: 400 g - 8 stuks</div>';

      const sizing = extractPackageSizing(title, html);
      expect(sizing.packageWeightGrams).toBe(400);
      expect(sizing.pieceCount).toBe(8);
    });
  });
});
