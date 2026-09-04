import { chromium } from 'playwright';
import type { Page } from 'playwright';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const poolerUrl =
  process.env.DATABASE_POOLER_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres.khvnlmzhymocnvdnptci:itPV7fCkw4O9vbK6@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

const dbPool = new pg.Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export interface PlusScrapedFood {
  id: string;
  name: string;
  brand: string;
  serving_unit: 'gram' | 'ml';
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  sugar_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  package_weight_grams?: number;
  source_url: string;
  is_custom: boolean;
  created_by: string;
}

/**
 * Fetch all product URLs directly from the official PLUS sitemap engine.
 */
export async function getPlusProductUrls(): Promise<string[]> {
  console.log('📡 Fetching PLUS Product Sitemap...');
  const sitemapUrl = 'https://www.plus.nl/ECP_Sitemap_Engine/rest/Sitemap/product';
  const res = await fetch(sitemapUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch PLUS sitemap: ${res.status}`);
  }

  const xml = await res.text();
  const matches = [...xml.matchAll(/<loc>(https:\/\/www\.plus\.nl\/product\/[^<]+)<\/loc>/gi)];
  const urls = matches.map((m) => m[1]);
  console.log(`✅ Discovered ${urls.length} product URLs from PLUS sitemap.`);
  return urls;
}

/**
 * Parses raw Dutch nutritional table text into structured numbers per 100g.
 */
export function parseNutritionText(rawText: string) {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let sugar = 0;
  let fat = 0;
  let fiber = 0;

  // Energie KC / kcal
  const kcalMatch = rawText.match(/Energie\s*KC\s*(\d+(?:[.,]\d+)?)/i) ||
                    rawText.match(/(\d+(?:[.,]\d+)?)\s*(?:kcal|KC)\b/i);
  if (kcalMatch) {
    kcal = Math.round(parseFloat(kcalMatch[1].replace(',', '.')));
  }

  // Eiwitten
  const proteinMatch = rawText.match(/Eiwit(?:ten)?\s*(\d+(?:[.,]\d+)?)\s*g/i);
  if (proteinMatch) {
    protein = parseFloat(parseFloat(proteinMatch[1].replace(',', '.')).toFixed(1));
  }

  // Koolhydraten
  const carbsMatch = rawText.match(/Koolhydraten\s*(\d+(?:[.,]\d+)?)\s*g/i);
  if (carbsMatch) {
    carbs = parseFloat(parseFloat(carbsMatch[1].replace(',', '.')).toFixed(1));
  }

  // Waarvan suikers
  const sugarMatch = rawText.match(/Waarvan\s+suikers?\s*(\d+(?:[.,]\d+)?)\s*g/i);
  if (sugarMatch) {
    sugar = parseFloat(parseFloat(sugarMatch[1].replace(',', '.')).toFixed(1));
  }

  // Vetten
  const fatMatch = rawText.match(/Vet(?:ten)?\s*(\d+(?:[.,]\d+)?)\s*g/i);
  if (fatMatch) {
    fat = parseFloat(parseFloat(fatMatch[1].replace(',', '.')).toFixed(1));
  }

  // Vezels
  const fiberMatch = rawText.match(/Vezels?\s*(\d+(?:[.,]\d+)?)\s*g/i);
  if (fiberMatch) {
    fiber = parseFloat(parseFloat(fiberMatch[1].replace(',', '.')).toFixed(1));
  }

  return { kcal, protein, carbs, sugar, fat, fiber };
}

/**
 * Scrapes a single PLUS product page using Playwright.
 */
export async function scrapePlusProductPage(page: Page, url: string): Promise<PlusScrapedFood | null> {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });

    // Wait for the main title rendered by OutSystems
    await page.waitForSelector('.product-title, h1, .js-screen-title', { timeout: 8000 });

    const rawTitle = await page.evaluate(() => {
      // Find the h1 or prominent product title
      const h1 = document.querySelector('h1');
      if (h1 && h1.innerText.trim()) return h1.innerText.trim();
      const st = document.querySelector('.js-screen-title');
      if (st && st.textContent?.trim()) return st.textContent.trim();
      return document.title.split('|')[0].trim();
    });
    if (!rawTitle) return null;

    // Check if the page contains a nutritional table (filter non-food products)
    const pageContent = await page.evaluate(() => document.body.innerText);
    const hasNutrition = pageContent.includes('Voedingswaarde') || 
                         (pageContent.includes('Energie') && (pageContent.includes('Eiwit') || pageContent.includes('Vet')));

    if (!hasNutrition) {
      // Non-food / not edible item (e.g. shampoo, cleaning supplies, tobacco)
      return null;
    }

    const nutrition = parseNutritionText(pageContent);

    // If all calories and macros are 0, it is likely not an edible food item
    if (nutrition.kcal === 0 && nutrition.protein === 0 && nutrition.carbs === 0 && nutrition.fat === 0) {
      return null;
    }

    // Extract package weight from URL or title (e.g. "tray-200-g-296701" or "200 g")
    let packageWeightGrams: number | undefined;
    const gMatch = url.match(/(\d+(?:[.,]\d+)?)-(?:g|gram|ml)-(\d+)$/i) || rawTitle.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|ml)\b/i);
    if (gMatch) {
      packageWeightGrams = Math.round(parseFloat(gMatch[1].replace(',', '.')));
    } else {
      const kgMatch = url.match(/(\d+(?:[.,]\d+)?)-kg-(\d+)$/i) || rawTitle.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
      if (kgMatch) {
        packageWeightGrams = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
      }
    }

    // Extract SKU / ID from end of URL
    const skuMatch = url.match(/-(\d+)$/);
    const sku = skuMatch ? skuMatch[1] : `plus_${Math.random().toString(36).slice(2, 8)}`;

    const isLiquid = url.includes('-ml-') || rawTitle.toLowerCase().includes(' ml') || rawTitle.toLowerCase().includes(' liter');
    const brand = rawTitle.toLowerCase().startsWith('plus') ? 'PLUS' : 'PLUS Retail';

    return {
      id: `plus_${sku}`,
      name: rawTitle.replace(/^PLUS\s+/i, '').trim(),
      brand,
      serving_unit: isLiquid ? 'ml' : 'gram',
      kcal_per_100g: nutrition.kcal,
      protein_per_100g: nutrition.protein,
      carbs_per_100g: nutrition.carbs,
      sugar_per_100g: nutrition.sugar,
      fat_per_100g: nutrition.fat,
      fiber_per_100g: nutrition.fiber,
      package_weight_grams: packageWeightGrams,
      source_url: url,
      is_custom: false,
      created_by: 'community',
      updated_at: new Date().toISOString(),
    };
  } catch (err: any) {
    // Timeout or navigation error on specific product
    return null;
  }
}

/**
 * Bulk upserts a batch of products directly into Postgres database.
 */
async function bulkUpsertProducts(items: PlusScrapedFood[]) {
  if (items.length === 0) return;

  const client = await dbPool.connect();
  try {
    await client.query('BEGIN');
    const sql = `
      INSERT INTO public.food_items (
        id, name, brand, serving_unit, kcal_per_100g, protein_per_100g, carbs_per_100g,
        sugar_per_100g, fat_per_100g, fiber_per_100g, package_weight_grams, source_url,
        is_custom, created_by, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        brand = EXCLUDED.brand,
        serving_unit = EXCLUDED.serving_unit,
        kcal_per_100g = EXCLUDED.kcal_per_100g,
        protein_per_100g = EXCLUDED.protein_per_100g,
        carbs_per_100g = EXCLUDED.carbs_per_100g,
        sugar_per_100g = EXCLUDED.sugar_per_100g,
        fat_per_100g = EXCLUDED.fat_per_100g,
        fiber_per_100g = EXCLUDED.fiber_per_100g,
        package_weight_grams = EXCLUDED.package_weight_grams,
        updated_at = NOW();
    `;

    for (const item of items) {
      await client.query(sql, [
        item.id,
        item.name,
        item.brand,
        item.serving_unit,
        item.kcal_per_100g,
        item.protein_per_100g,
        item.carbs_per_100g,
        item.sugar_per_100g,
        item.fat_per_100g,
        item.fiber_per_100g,
        item.package_weight_grams ?? null,
        item.source_url,
        item.is_custom,
        item.created_by,
      ]);
    }

    await client.query('COMMIT');
    console.log(`\n💾 Saved chunk of ${items.length} edible items to database.`);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('\n❌ Database save error:', err.message);
  } finally {
    client.release();
  }
}

/**
 * Main Scraper Runner
 * Runs concurrent Playwright workers and bulk upserts into Postgres.
 */
export async function runPlusCatalogScraper(options?: { maxProducts?: number; concurrency?: number }) {
  const maxProducts =
    options?.maxProducts ||
    parseInt(process.env.PLUS_MAX_PRODUCTS || (process.argv[2] ? process.argv[2] : '1000'), 10);
  const concurrency =
    options?.concurrency ||
    parseInt(process.env.PLUS_CONCURRENCY || (process.argv[3] ? process.argv[3] : '4'), 10);

  console.log(`\n🚀 [PLUS Scraper] Starting with concurrency=${concurrency}, maxProducts=${maxProducts}...`);

  const urls = await getPlusProductUrls();
  const targetUrls = urls.slice(0, maxProducts);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const batchSize = 25;
  let savedCount = 0;
  let nonFoodSkipped = 0;
  let pendingBatch: PlusScrapedFood[] = [];

  const flushBatch = async () => {
    if (pendingBatch.length === 0) return;
    const itemsToSave = [...pendingBatch];
    pendingBatch = [];
    await bulkUpsertProducts(itemsToSave);
  };

  let currentIndex = 0;

  async function worker(workerId: number) {
    const page = await browser.newPage();
    // Block images, fonts and CSS to maximize scraping speed
    await page.route('**/*.{png,jpg,jpeg,svg,woff,woff2,gif,webp}', (route) => route.abort());

    while (currentIndex < targetUrls.length) {
      const idx = currentIndex++;
      const url = targetUrls[idx];
      const slug = url.replace('https://www.plus.nl/product/', '');

      process.stdout.write(
        `[Worker ${workerId}] [${idx + 1}/${targetUrls.length}] Scraping: ${slug.slice(0, 45)}\r`
      );

      const product = await scrapePlusProductPage(page, url);
      if (product) {
        savedCount++;
        pendingBatch.push(product);
        if (pendingBatch.length >= batchSize) {
          await flushBatch();
        }
      } else {
        nonFoodSkipped++;
      }
    }

    await page.close();
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  await flushBatch();
  await browser.close();
  await dbPool.end();

  console.log('\n\n========================================');
  console.log('🎉 [PLUS Scraper] Finished Successfully!');
  console.log(`✅ Edible products indexed: ${savedCount}`);
  console.log(`⏭️  Non-food items skipped: ${nonFoodSkipped}`);
  console.log('========================================\n');
}

// Allow direct execution via command line
if (process.argv[1]?.includes('scrapePlusCatalog')) {
  runPlusCatalogScraper().catch((e) => {
    console.error('Fatal Scraper Error:', e);
    process.exit(1);
  });
}
