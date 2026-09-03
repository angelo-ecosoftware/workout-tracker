import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseDutchNutritionTable,
  extractSchemaAndHeadings,
  extractPackageSizing,
} from '../../../api/scraperRegistry.ts';

describe('Server API Scraper Utilities & HTML Parser Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Parses Dutch nutritional tables from HTML table structure', () => {
    const mockHtml = `
      <table>
        <tr><th>Voedingswaarden</th><th>Per 100g</th></tr>
        <tr><td>Energie</td><td>150 kcal</td></tr>
        <tr><td>Vetten</td><td>3.5 g</td></tr>
        <tr><td>Waarvan verzadigd</td><td>1.0 g</td></tr>
        <tr><td>Koolhydraten</td><td>12.0 g</td></tr>
        <tr><td>Waarvan suikers</td><td>4.5 g</td></tr>
        <tr><td>Voedingsvezel</td><td>2.0 g</td></tr>
        <tr><td>Eiwitten</td><td>18.0 g</td></tr>
      </table>
    `;

    const parsed = parseDutchNutritionTable(mockHtml);
    expect(parsed.kcalPer100g).toBe(150);
    expect(parsed.fatPer100g).toBe(3.5);
    expect(parsed.carbsPer100g).toBe(12.0);
    expect(parsed.sugarPer100g).toBe(4.5);
    expect(parsed.fiberPer100g).toBe(2.0);
    expect(parsed.proteinPer100g).toBe(18.0);
  });

  it('2. Extracts JSON-LD schema product metadata and brand naming', () => {
    const htmlWithSchema = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Magere Franse Kwark 500g | Albert Heijn",
              "brand": {
                "@type": "Brand",
                "name": "De Zaanse Hoeve"
              }
            }
          </script>
        </head>
      </html>
    `;

    const { title, brand } = extractSchemaAndHeadings(htmlWithSchema, 'AH');
    expect(title).toBe('Magere Franse Kwark 500g');
    expect(brand).toBe('De Zaanse Hoeve');
  });

  it('3. Extracts package weight and pieces from product text strings', () => {
    const title = 'AH Proteïne Repen Karamel 3 stuks 150g';
    const html = '<div>Inhoud: 150 g - 3 stuks</div>';

    const sizing = extractPackageSizing(title, html);
    expect(sizing.packageWeightGrams).toBe(150);
    expect(sizing.pieceCount).toBe(3);
  });
});
