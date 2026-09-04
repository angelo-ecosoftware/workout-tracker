import { chromium } from 'playwright';
import dotenv from 'dotenv';
import pg from 'pg';
import { getDirkProductUrls, scrapeDirkProductPage } from './scrapeDirkCatalog.ts';

dotenv.config();

const poolerUrl =
  process.env.DATABASE_POOLER_URL ||
  'postgresql://postgres.khvnlmzhymocnvdnptci:itPV7fCkw4O9vbK6@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

const dbPool = new pg.Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// Top essential dietary & fitness categories for Dirk
const DIET_FITNESS_KEYWORDS = [
  'kipfilet',
  'rundergehakt',
  'biefstuk',
  'zalm',
  'tonijn',
  'kwark',
  'yoghurt',
  'havermout',
  'haver',
  'volkoren',
  'zilvervliesrijst',
  'basmati',
  'pindakaas',
  'melk',
  'eieren',
  'avocado',
  'banaan',
  'blauwe-bessen',
  'bessen',
  'zoete-aardappel',
  'broccoli',
  'spinazie',
  'amandelen',
  'cashew',
  'noten',
  'cottage-cheese',
  'hummus',
  'olijfolie',
  'kidneybonen',
  'linzen',
  'eiwit',
  'protein',
];

async function runDirkDietFitness50Scraper() {
  console.log('📡 1. Fetching all Dirk product URLs from sitemap...');
  const allUrls = await getDirkProductUrls();

  console.log(`🔍 2. Filtering for top staple diet & fitness foods for Dirk...`);
  const candidateUrls: string[] = [];

  // Pick up to 5-6 top matches per diet keyword to gather candidates
  for (const keyword of DIET_FITNESS_KEYWORDS) {
    const matches = allUrls.filter((u) => u.toLowerCase().includes(keyword));
    let count = 0;
    for (const match of matches) {
      if (!candidateUrls.includes(match)) {
        candidateUrls.push(match);
        count++;
        if (count >= 5) break;
      }
    }
  }

  console.log(`\n📋 Identified ${candidateUrls.length} candidate URLs across ${DIET_FITNESS_KEYWORDS.length} dietary categories.`);
  console.log('🌐 3. Launching browser (Edge/Chromium) with 4 concurrent workers...');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const scrapedItems: any[] = [];
  let completed = 0;
  const concurrency = 4;
  let currentIndex = 0;

  async function worker(workerId: number) {
    const page = await browser.newPage();
    // Block heavy media for speed
    await page.route('**/*.{png,jpg,jpeg,svg,woff,woff2,gif,webp}', (route) => route.abort());

    while (currentIndex < candidateUrls.length && scrapedItems.length < 50) {
      const idx = currentIndex++;
      const url = candidateUrls[idx];
      const slug = url.split('/').slice(-2).join('/');

      try {
        const item = await scrapeDirkProductPage(page, url);
        completed++;
        if (item) {
          // Check if item name or ID already exists in scrapedItems before adding
          const normalizedName = item.name.toLowerCase().trim();
          const alreadyExists = scrapedItems.some(
            (existing) =>
              existing.id === item.id ||
              existing.name.toLowerCase().trim() === normalizedName
          );

          if (alreadyExists) {
            console.log(`[Worker ${workerId}] ⚠️ Duplicate skipped: ${item.name} (${item.id})`);
            continue;
          }

          scrapedItems.push(item);
          console.log(
            `[Worker ${workerId}] [🎯 Total Verified: ${scrapedItems.length}/50] ✅ Scraped: ${item.name} (${item.kcal_per_100g} kcal, ${item.protein_per_100g}g P, ${item.carbs_per_100g}g C, ${item.fat_per_100g}g F)`
          );
        } else {
          console.log(`[Worker ${workerId}] ⏭️ Skipped non-food / missing table: ${slug}`);
        }
      } catch (e: any) {
        console.error(`[Worker ${workerId}] Error on ${slug}:`, e.message);
      }
    }

    await page.close();
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  await browser.close();

  console.log(`\n💾 4. Upserting ${scrapedItems.length} verified edible diet products directly to Supabase...`);

  if (scrapedItems.length > 0) {
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

      for (const item of scrapedItems) {
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
      console.log(`🎉 5. Successfully indexed all ${scrapedItems.length} Dirk diet staple items into Supabase global food database!`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Database save error:', err);
    } finally {
      client.release();
    }
  }

  await dbPool.end();
}

runDirkDietFitness50Scraper().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
