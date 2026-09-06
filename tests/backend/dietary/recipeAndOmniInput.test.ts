import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractSchemaAndHeadings,
  genericAdapter,
  scrapeProductFromHtml,
} from '../../../api/scraperRegistry.ts';

describe('🍲 Recipe & Schema.org Structured Data Resolution Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('1. Schema.org Recipe Structured Data Parsing', () => {
    it('extracts recipe title, publisher brand, servings yield, and per-portion macros', () => {
      const recipeHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Romige Kip Pasta met Broccoli - Lekker en Simpel</title>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Recipe",
                "name": "Romige Kip Pasta met Broccoli",
                "author": {
                  "@type": "Person",
                  "name": "Lekker en Simpel"
                },
                "recipeYield": "4 porties",
                "nutrition": {
                  "@type": "NutritionInformation",
                  "calories": "520 kcal",
                  "proteinContent": "38 g",
                  "carbohydrateContent": "54 g",
                  "sugarContent": "6 g",
                  "fatContent": "16 g",
                  "fiberContent": "7 g",
                  "servingSize": "1 portie"
                }
              }
            </script>
          </head>
          <body>
            <h1>Romige Kip Pasta met Broccoli</h1>
            <p>Heerlijk eiwitrijk pastagerecht met broccoli en kipfilet.</p>
          </body>
        </html>
      `;

      const result = scrapeProductFromHtml(recipeHtml, 'https://www.lekkerensimpel.com/romige-kip-pasta');

      expect(result.name).toBe('Romige Kip Pasta met Broccoli');
      expect(result.brand).toBe('Lekker en Simpel');
      expect(result.kcalPer100g).toBe(520);
      expect(result.proteinPer100g).toBe(38);
      expect(result.carbsPer100g).toBe(54);
      expect(result.sugarPer100g).toBe(6);
      expect(result.fatPer100g).toBe(16);
      expect(result.fiberPer100g).toBe(7);
      expect(result.pieceCount).toBe(4); // 4 servings
    });

    it('extracts Schema.org @graph Recipe metadata from Dutch cooking websites (e.g. 24Kitchen / Allerhande)', () => {
      const graphRecipeHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@graph": [
                  {
                    "@type": "WebSite",
                    "name": "24Kitchen"
                  },
                  {
                    "@type": ["Recipe", "NewsArticle"],
                    "name": "Gegrilde Zalm met Zoete Aardappel",
                    "publisher": {
                      "name": "24Kitchen"
                    },
                    "recipeYield": 2,
                    "nutrition": {
                      "@type": "NutritionInformation",
                      "calories": 610,
                      "proteinContent": "44.5 g",
                      "carbohydrateContent": "42 g",
                      "fatContent": "28 g",
                      "fiberContent": "5 g"
                    }
                  }
                ]
              }
            </script>
          </head>
          <body>
            <h1>Gegrilde Zalm met Zoete Aardappel</h1>
          </body>
        </html>
      `;

      const result = scrapeProductFromHtml(graphRecipeHtml, 'https://www.24kitchen.nl/recepten/gegrilde-zalm');

      expect(result.name).toBe('Gegrilde Zalm met Zoete Aardappel');
      expect(result.brand).toBe('24Kitchen');
      expect(result.kcalPer100g).toBe(610);
      expect(result.proteinPer100g).toBe(44.5);
      expect(result.carbsPer100g).toBe(42);
      expect(result.fatPer100g).toBe(28);
      expect(result.fiberPer100g).toBe(5);
      expect(result.pieceCount).toBe(2);
    });

    it('handles recipes with nutrition table in HTML body when Schema.org nutrition object is absent', () => {
      const tableRecipeHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "Recipe",
                "name": "Eiwitrijke Kwark Pannenkoekjes",
                "author": { "name": "FitChef" },
                "recipeYield": "1 portie"
              }
            </script>
          </head>
          <body>
            <h1>Eiwitrijke Kwark Pannenkoekjes</h1>
            <div class="nutrition-box">
              Voedingswaarden per portie:
              <table>
                <tr><td>Energie</td><td>380 kcal</td></tr>
                <tr><td>Eiwitten</td><td>32 g</td></tr>
                <tr><td>Koolhydraten</td><td>35 g</td></tr>
                <tr><td>Vetten</td><td>8 g</td></tr>
                <tr><td>Vezels</td><td>4 g</td></tr>
              </table>
            </div>
          </body>
        </html>
      `;

      const result = genericAdapter.parse(tableRecipeHtml, 'https://www.fitchef.nl/kwark-pannenkoekjes');

      expect(result.name).toBe('Eiwitrijke Kwark Pannenkoekjes');
      expect(result.brand).toBe('FitChef');
      expect(result.kcalPer100g).toBe(380);
      expect(result.proteinPer100g).toBe(32);
      expect(result.carbsPer100g).toBe(35);
      expect(result.fatPer100g).toBe(8);
      expect(result.fiberPer100g).toBe(4);
      expect(result.pieceCount).toBe(1);
    });
  });
});
