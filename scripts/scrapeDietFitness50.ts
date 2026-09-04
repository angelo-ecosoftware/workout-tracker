import { chromium } from 'playwright';
import dotenv from 'dotenv';
import pg from 'pg';
import { getPlusProductUrls, scrapePlusProductPage } from './scrapePlusCatalog.ts';

dotenv.config();

const poolerUrl =
  process.env.DATABASE_POOLER_URL ||
  'postgresql://postgres.khvnlmzhymocnvdnptci:itPV7fCkw4O9vbK6@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

const dbPool = new pg.Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

// Top essential dietary & fitness categories
const DIET_FITNESS_KEYWORDS = [
  'kipfilet',
  'mager-rundergehakt',
  'biefstuk',
  'zalmfilet',
  'tonijn',
  'magere-franse-kwark',
  'griekse-yoghurt',
  'havermout',
  'volkoren-brood',
  'zilvervliesrijst',
  'basmati-rijst',
  'volkoren-pasta',
  'pindakaas',
  'halfvolle-melk',
  'amandelmelk',
  'eieren',
  'avocado',
  'banaan',
  'blauwe-bessen',
  'zoete-aardappel',
  'broccoli',
  'spinazie',
  'ongezouten-noten',
  'amandelen',
  'cashewnoten',
  'cottage-cheese',
  'hummus',
  'olijfolie',
  'kidneybonen',
  'linzen',
];

async function runDietFitness50Scraper() {
  console.log('📡 1. Fetching all PLUS product URLs from sitemap...');
  const allUrls = await getPlusProductUrls();

  console.log(`🔍 2. Filtering for top staple diet & fitness foods (diverse categories)...`);
  const candidateUrls: string[] = [];

  // Pick up to 5-6 top matches per diet keyword so we reach our target of 50 verified foods
  for (const keyword of DIET_FITNESS_KEYWORDS) {
    const matches = allUrls.filter((u) => u.toLowerCase().includes(keyword));
    let count = 0;
    for (const match of matches) {
      if (!candidateUrls.includes(match)) {
        candidateUrls.push(match);
        count++;
        if (count >= 6) break;
      }
    }
  }

  console.log(`\n📋 Identified ${candidateUrls.length} candidate URLs across 30 dietary categories.`);

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
    // Block heavy media
    await page.route('**/*.{png,jpg,jpeg,svg,woff,woff2,gif,webp}', (route) => route.abort());

    while (currentIndex < candidateUrls.length && scrapedItems.length < 50) {
      const idx = currentIndex++;
      const url = candidateUrls[idx];
      const slug = url.replace('https://www.plus.nl/product/', '');

      try {
        const item = await scrapePlusProductPage(page, url);
        completed++;
        if (item) {
          scrapedItems.push(item);
          console.log(`[Worker ${workerId}] [🎯 Total Verified: ${scrapedItems.length}/50] ✅ Scraped: ${item.name} (${item.kcal_per_100g} kcal, ${item.protein_per_100g}g P, ${item.carbs_per_100g}g C, ${item.fat_per_100g}g F)`);
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
      console.log(`🎉 5. Successfully indexed all ${scrapedItems.length} staple diet items into Supabase global food database!`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Database save error:', err);
    } finally {
      client.release();
    }
  }

  await dbPool.end();
}

runDietFitness50Scraper().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
