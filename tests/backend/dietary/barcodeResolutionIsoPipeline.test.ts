import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseDutchNutritionTable,
  extractSchemaAndHeadings,
  extractPackageSizing,
  albertHeijnAdapter,
  jumboAdapter,
  dirkAdapter,
  plusAdapter,
  fetchAlbertHeijnMobileProduct,
  fetchJumboMobileProduct,
  searchAlbertHeijnProduct,
} from '../../../api/scraperRegistry.ts';
import { resolveAlbertHeijnBarcode, resolveAlbertHeijnWebBarcode } from '../../../api/barcode-lookup.ts';
import { extractScalePluCandidates, matchBakeryPlu } from '../../../src/lib/bakeryPluDictionary.ts';
import { lookupBarcodeProduct } from '../../../src/lib/barcodeService.ts';

// Deterministic in-memory database mock for Tier 1 Hive Mind
let mockFoodDatabase: any[] = [];

vi.mock('../../../src/lib/supabase.ts', () => {
  const createQueryBuilder = (table: string) => {
    let currentData = [...mockFoodDatabase];

    const builder: any = {
      select: vi.fn(() => builder),
      or: vi.fn((filterStr: string) => {
        // Parse basic or filter condition for barcode or id
        const terms = filterStr.split(',');
        const filtered = currentData.filter((row) => {
          return terms.some((term) => {
            if (term.includes('barcode.eq.')) {
              const code = term.split('barcode.eq.')[1];
              return row.barcode === code;
            }
            if (term.includes('id.eq.ean_')) {
              const code = term.split('id.eq.ean_')[1];
              return row.id === `ean_${code}` || row.barcode === code;
            }
            if (term.includes('id.eq.ah_wi')) {
              const id = term.split('id.eq.')[1];
              return row.id === id;
            }
            if (term.includes('name.ilike.')) {
              const termName = term.split('name.ilike.')[1].replace(/%/g, '').toLowerCase();
              return row.name?.toLowerCase().includes(termName);
            }
            return false;
          });
        });
        currentData = filtered;
        return builder;
      }),
      eq: vi.fn((field: string, val: any) => {
        currentData = currentData.filter((row) => row[field] === val);
        return builder;
      }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      maybeSingle: vi.fn(() => Promise.resolve({ data: currentData[0] || null, error: null })),
      upsert: vi.fn((payload: any) => {
        const items = Array.isArray(payload) ? payload : [payload];
        items.forEach((item) => {
          const idx = mockFoodDatabase.findIndex((r) => r.id === item.id);
          if (idx >= 0) {
            mockFoodDatabase[idx] = { ...mockFoodDatabase[idx], ...item };
          } else {
            mockFoodDatabase.push({ ...item, created_at: new Date().toISOString() });
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

describe('ISO/IEC 25010 & 29119 Multi-Tier Barcode & Scraping Resolution Test Suite', () => {
  beforeEach(() => {
    mockFoodDatabase = [];
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // Tier 1: Supabase Hive Mind Cache Verification
  // =========================================================================
  describe('Tier 1: Hive Mind Database Cache', () => {
    it('ISO 25010 (Performance & Reliability): returns cached product immediately on barcode hit', async () => {
      mockFoodDatabase.push({
        id: 'food_101',
        name: 'Griekse Yoghurt 0%',
        brand: 'Albert Heijn',
        serving_unit: 'gram',
        kcal_per_100g: 57,
        protein_per_100g: 10.3,
        carbs_per_100g: 4.0,
        sugar_per_100g: 4.0,
        fat_per_100g: 0.1,
        fiber_per_100g: 0,
        barcode: '8710400000001',
      });

      const result = await lookupBarcodeProduct('8710400000001');
      expect(result.found).toBe(true);
      expect(result.source).toBe('database');
      expect(result.item?.name).toBe('Griekse Yoghurt 0%');
      expect(result.item?.proteinPer100g).toBe(10.3);
    });
  });

  // =========================================================================
  // Tier 1.5: In-Store Scale Barcode & Pre-Seeded PLU Candidate Extractor
  // =========================================================================
  describe('Tier 1.5: GS1 In-Store Scale & PLU Candidate Resolution', () => {
    it('ISO 25010 (Functional Suitability): extracts candidate slices from 20-29 scale barcode', () => {
      // 22 85623 00145 2 (Prefix 22, PLU 285623/85623, Price €1.45, Check 2)
      const candidates = extractScalePluCandidates('2285623001452');
      expect(candidates).toContain('285623');
      expect(candidates).toContain('85623');
    });

    it('ISO 25010 (Fault Tolerance): safely returns empty array for non-scale or empty strings', () => {
      expect(extractScalePluCandidates('')).toEqual([]);
      expect(extractScalePluCandidates('12345')).toEqual([]);
      expect(extractScalePluCandidates('8718927029937')).toEqual([]);
    });

    it('ISO 25010 (Accuracy): resolves exact pre-seeded supermarket bakery items', () => {
      const match = matchBakeryPlu('2285623001452');
      expect(match).not.toBeNull();
      expect(match?.name).toBe('AH Vloer waldkorn half');
      expect(match?.webshopId).toBe('561020');
      expect(match?.masterGtin).toBe('08718927029937');
    });
  });

  // =========================================================================
  // Tier 2: Mobile Store APIs (AH Mobile GraphQL & Jumbo Mobile API)
  // =========================================================================
  describe('Tier 2: Official Supermarket Mobile API Endpoints', () => {
    it('ISO 29119 (Equivalence Partitioning): parses AH FIR mobile detail response into normalized shape', async () => {
      const mockFirPayload = {
        productCard: {
          id: 561020,
          title: 'AH Vloer waldkorn half',
          brand: 'Albert Heijn',
          salesUnitSize: '400 g',
        },
        tradeItem: {
          nutritionalInformation: {
            nutrientHeaders: [
              {
                nutrientDetail: [
                  {
                    nutrientTypeCode: { value: 'ENER-', label: 'Energie' },
                    quantityContained: [{ value: 245, measurementUnitCode: { value: 'kcal' } }],
                  },
                  {
                    nutrientTypeCode: { value: 'PRO-', label: 'Eiwitten' },
                    quantityContained: [{ value: 9.5, measurementUnitCode: { value: 'g' } }],
                  },
                  {
                    nutrientTypeCode: { value: 'CHOAVL', label: 'Koolhydraten' },
                    quantityContained: [{ value: 43.0, measurementUnitCode: { value: 'g' } }],
                  },
                  {
                    nutrientTypeCode: { value: 'SUGAR-', label: 'waarvan suikers' },
                    quantityContained: [{ value: 1.5, measurementUnitCode: { value: 'g' } }],
                  },
                  {
                    nutrientTypeCode: { value: 'FAT', label: 'Vet' },
                    quantityContained: [{ value: 2.2, measurementUnitCode: { value: 'g' } }],
                  },
                  {
                    nutrientTypeCode: { value: 'FIBTG', label: 'Voedingsvezel' },
                    quantityContained: [{ value: 6.8, measurementUnitCode: { value: 'g' } }],
                  },
                ],
              },
            ],
          },
        },
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/mobile-auth/v1/auth/token/anonymous')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ access_token: 'test_token_ah' }),
          });
        }
        if (url.includes('/mobile-services/product/detail/v4/fir/561020')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFirPayload),
          });
        }
        return Promise.reject(new Error('Unknown endpoint'));
      });

      const res = await fetchAlbertHeijnMobileProduct('561020', 'https://www.ah.nl/producten/product/wi561020');
      expect(res).not.toBeNull();
      expect(res?.name).toBe('Vloer waldkorn half');
      expect(res?.kcalPer100g).toBe(245);
      expect(res?.proteinPer100g).toBe(9.5);
      expect(res?.packageWeightGrams).toBe(400);
      expect(res?.servingUnit).toBe('gram');
    });

    it('ISO 29119: parses Jumbo mobile search payload into normalized shape', async () => {
      const mockJumboPayload = {
        products: {
          data: [
            {
              id: '123456',
              title: 'Jumbo Halfvolle Melk 1L',
              brand: { name: 'Jumbo' },
              quantity: '1000 ml',
              nutritionalInformation: [
                { name: 'Energie (kcal)', value: '47' },
                { name: 'Eiwitten', value: '3.6' },
                { name: 'Koolhydraten', value: '4.8' },
                { name: 'Vet', value: '1.5' },
              ],
            },
          ],
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockJumboPayload),
      });

      const res = await fetchJumboMobileProduct('123456', 'https://www.jumbo.com/producten/123456');
      expect(res).not.toBeNull();
      expect(res?.name).toBe('Halfvolle Melk 1L');
      expect(res?.servingUnit).toBe('ml');
      expect(res?.kcalPer100g).toBe(47);
      expect(res?.proteinPer100g).toBe(3.6);
    });
  });

  // =========================================================================
  // Tier 3 & 4: Supermarket Scrapers & Nutrition Table Parser (ISO 25010 Reliability)
  // =========================================================================
  describe('Tier 3 & 4: HTML Scrapers & Multi-Format Nutrition Extraction', () => {
    it('ISO 25010 (Data Correctness): accurately parses HTML <table> Dutch nutrition declarations', () => {
      const htmlTable = `
        <div class="product-info-nutrition">
          <h3>Voedingswaarden</h3>
          <table>
            <tr><td>Energie</td><td>210 kcal</td></tr>
            <tr><td>Vetten</td><td>3,5 g</td></tr>
            <tr><td>Koolhydraten</td><td>38,0 g</td></tr>
            <tr><td>waarvan suikers</td><td>2,0 g</td></tr>
            <tr><td>Voedingsvezel</td><td>7,5 g</td></tr>
            <tr><td>Eiwitten</td><td>8,2 g</td></tr>
          </table>
        </div>
      `;

      const parsed = parseDutchNutritionTable(htmlTable);
      expect(parsed.kcalPer100g).toBe(210);
      expect(parsed.fatPer100g).toBe(3.5);
      expect(parsed.carbsPer100g).toBe(38.0);
      expect(parsed.sugarPer100g).toBe(2.0);
      expect(parsed.fiberPer100g).toBe(7.5);
      expect(parsed.proteinPer100g).toBe(8.2);
    });

    it('ISO 25010: accurately parses Markdown table format (| Key | Val |)', () => {
      const mdTable = `
        ### Voedingswaarde per 100g
        | Eigenschap | Waarde |
        | --- | --- |
        | Energie | 150 kcal |
        | Eiwitten | 20.5 g |
        | Koolhydraten | 1.0 g |
        | Suikers | 0.5 g |
        | Vet | 6.0 g |
        | Voedingsvezel | 0 g |
      `;

      const parsed = parseDutchNutritionTable(mdTable);
      expect(parsed.kcalPer100g).toBe(150);
      expect(parsed.proteinPer100g).toBe(20.5);
      expect(parsed.carbsPer100g).toBe(1.0);
      expect(parsed.sugarPer100g).toBe(0.5);
      expect(parsed.fatPer100g).toBe(6.0);
    });

    it('ISO 29119 (Boundary Testing): handles missing / malformed nutrition tables without throwing', () => {
      const emptyHtml = '<html><body><h1>No nutrition table here</h1></body></html>';
      const parsed = parseDutchNutritionTable(emptyHtml);
      expect(parsed.kcalPer100g).toBe(0);
      expect(parsed.proteinPer100g).toBe(0);
      expect(parsed.carbsPer100g).toBe(0);
    });

    it('ISO 25010: extracts package sizing and piece counts from titles and text', () => {
      const size1 = extractPackageSizing('AH Eieren 10 stuks 550g', '');
      expect(size1.packageWeightGrams).toBe(550);
      expect(size1.pieceCount).toBe(10);

      const size2 = extractPackageSizing('Magere Kwark 500 g', '');
      expect(size2.packageWeightGrams).toBe(500);

      const size3 = extractPackageSizing('Halfvolle Melk 1.5 l', '');
      expect(size3.packageWeightGrams).toBe(1500);
    });
  });

  // =========================================================================
  // Tier 5: Strict Validation Gate & Error Handshake
  // =========================================================================
  describe('Tier 5: Strict Validation Gate & Safe Error Handling', () => {
    it('ISO 27001 & ISO 25010: rejects blocked bot pages, empty titles, and security challenge responses', () => {
      const blockedHtml = `
        <html>
          <head><title>Access Denied - Cloudflare Security Check</title></head>
          <body><h1>403 Forbidden - Bot Detected</h1></body>
        </html>
      `;

      const { title } = extractSchemaAndHeadings(blockedHtml, 'Albert Heijn');
      // Verify validation gate suppresses bot/challenge titles and defaults to safe fallback
      expect(title).toBe('Product');
    });

    it('ISO 25010: adapter handles all 4 major Dutch supermarket adapters', () => {
      expect(albertHeijnAdapter.canHandle('https://www.ah.nl/producten/product/wi12345/kwark')).toBe(true);
      expect(jumboAdapter.canHandle('https://www.jumbo.com/producten/jumbo-kip-12345')).toBe(true);
      expect(dirkAdapter.canHandle('https://www.dirk.nl/boodschappen/zuivel/melk/12345')).toBe(true);
      expect(plusAdapter.canHandle('https://www.plus.nl/product/plus-eieren-12345')).toBe(true);

      expect(albertHeijnAdapter.canHandle('https://www.bol.com/nl/p/something')).toBe(false);
    });
  });
});
