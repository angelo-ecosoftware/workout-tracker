import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scrapeProductFromHtml, albertHeijnAdapter } from '../../../api/scraperRegistry.ts';
import { saveHiveMindFoodItem, fetchHiveMindFoodCatalog } from '../../../src/lib/dietaryData.ts';
import { FoodItemNutrition } from '../../../src/models.ts';

// Deterministic in-memory database to simulate Supabase persistence layer
let mockFoodItems: any[] = [];

vi.mock('../../../src/lib/supabase.ts', () => {
  const createQueryBuilder = (table: string) => {
    let currentData = [...mockFoodItems];

    const builder: any = {
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        currentData = currentData.filter((row) => row[field] === val);
        return builder;
      }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      upsert: vi.fn((payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockFoodItems.findIndex((r) => r.id === item.id);
          if (idx >= 0) {
            mockFoodItems[idx] = { ...mockFoodItems[idx], ...item };
          } else {
            mockFoodItems.push({ ...item, created_at: new Date().toISOString() });
          }
        });
        return {
          select: () => Promise.resolve({ data: items, error: null, status: 200 }),
          error: null,
          status: 200,
        };
      }),
      then: (onfulfilled: any) => {
        return Promise.resolve({ data: currentData, error: null, status: 200 }).then(onfulfilled);
      },
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createQueryBuilder(table)),
    },
  };
});

describe('Albert Heijn (AH) Product Ingestion & Database Insert Test', () => {
  beforeEach(() => {
    mockFoodItems = [];
    vi.clearAllMocks();
  });
  const sampleAhHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>AH Biologische Magere Kwark - Albert Heijn</title>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "AH Biologische Magere Kwark",
          "brand": {
            "@type": "Brand",
            "name": "AH Biologisch"
          }
        }
        </script>
      </head>
      <body>
        <h1>AH Biologische Magere Kwark 500 g</h1>
        <div class="product-info-nutrition">
          <table>
            <thead>
              <tr><th>Voedingswaarde</th><th>Per 100g</th></tr>
            </thead>
            <tbody>
              <tr><td>Energie</td><td>235 kJ (56 kcal)</td></tr>
              <tr><td>Vetten</td><td>0.2 g</td></tr>
              <tr><td>waarvan verzadigd</td><td>0.1 g</td></tr>
              <tr><td>Koolhydraten</td><td>3.5 g</td></tr>
              <tr><td>waarvan suikers</td><td>3.5 g</td></tr>
              <tr><td>Eiwitten</td><td>10.0 g</td></tr>
              <tr><td>Zout</td><td>0.10 g</td></tr>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  it('1. Parses raw AH product HTML into canonical FoodItemNutrition schema', () => {
    const parsed = scrapeProductFromHtml(
      sampleAhHtml,
      'https://www.ah.nl/producten/product/wi456789/ah-biologische-magere-kwark'
    );

    expect(parsed).toBeDefined();
    expect(parsed.id).toBe('ah_wi456789');
    expect(parsed.name).toContain('Biologische Magere Kwark');
    expect(parsed.brand).toBe('AH Biologisch');
    expect(parsed.kcalPer100g).toBe(56);
    expect(parsed.proteinPer100g).toBe(10);
    expect(parsed.carbsPer100g).toBe(3.5);
    expect(parsed.sugarPer100g).toBe(3.5);
    expect(parsed.fatPer100g).toBe(0.2);
    expect(parsed.packageWeightGrams).toBe(500);
    expect(parsed.servingUnit).toBe('gram');
  });

  it('2. Inserts AH product into Hive Mind catalog and verifies 200 OK return status', async () => {
    const ahProduct: FoodItemNutrition = {
      id: 'ah_wi456789',
      name: 'AH Biologische Magere Kwark',
      brand: 'AH Biologisch',
      servingUnit: 'gram',
      kcalPer100g: 56,
      proteinPer100g: 10,
      carbsPer100g: 3.5,
      sugarPer100g: 3.5,
      fatPer100g: 0.2,
      fiberPer100g: 0,
      packageWeightGrams: 500,
      sourceUrl: 'https://www.ah.nl/producten/product/wi456789/ah-biologische-magere-kwark',
    };

    // Execute insertion into the dietary persistence service
    const saved = await saveHiveMindFoodItem(ahProduct, 'usr_athlete_123');

    // Verify successful insertion return payload
    expect(saved).toBeDefined();
    expect(saved.id).toBe('ah_wi456789');
    expect(saved.name).toBe('AH Biologische Magere Kwark');
    expect(saved.brand).toBe('AH Biologisch');
    expect(saved.kcalPer100g).toBe(56);
    expect(saved.proteinPer100g).toBe(10);

    // Verify persisted record in the database
    expect(mockFoodItems.length).toBe(1);
    expect(mockFoodItems[0].id).toBe('ah_wi456789');
    expect(mockFoodItems[0].name).toBe('AH Biologische Magere Kwark');
    expect(mockFoodItems[0].kcal_per_100g).toBe(56);
    expect(mockFoodItems[0].protein_per_100g).toBe(10);
  });
});
