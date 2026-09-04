import { chromium } from 'playwright';
import {
  dbPool,
  JUMBO_EDIBLE_CATEGORIES,
  scrapeJumboCategoryUrls,
  searchJumboProductUrls,
  scrapeJumboProductPage,
  upsertJumboProduct,
} from './scrapeJumboCatalog.ts';

// Common staple dietary keywords to ensure high coverage
const DIET_FITNESS_SEARCH_TERMS = [
  'kipfilet',
  'rundergehakt',
  'biefstuk',
  'zalm',
  'tonijn',
  'kwark',
  'skyr',
  'yoghurt',
  'havermout',
  'volkoren',
  'zilvervliesrijst',
  'basmati',
  'pindakaas',
  'melk',
  'eieren',
  'avocado',
  'banaan',
  'blauwe bessen',
  'zoete aardappel',
  'broccoli',
  'spinazie',
  'amandelen',
  'cashewnoten',
  'cottage cheese',
  'hummus',
  'olijfolie',
  'kidneybonen',
  'kikkererwten',
  'linzen',
  'proteine',
  'whey',
  'eiwitshake',
];

interface ScraperOptions {
  mode: 'diet-fitness' | 'full-catalog';
  maxPagesPerCategory?: number;
  concurrency?: number;
  maxTotalProducts?: number;
}

async function runGenericJumboScraper(options: ScraperOptions) {
  const startTime = Date.now();
  console.log(`\n========================================================`);
  console.log(`🚀 STARTING GENERIC JUMBO CATALOG SCRAPER`);
  console.log(`Mode: ${options.mode.toUpperCase()}`);
  console.log(`Workers: ${options.concurrency || 4}`);
  console.log(`========================================================\n`);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const discoveryContext = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });
  const discoveryPage = await discoveryContext.newPage();
  await discoveryPage.route('**/*.{png,jpg,jpeg,svg,woff,woff2,gif,webp}', (route) => route.abort());

  const discoveredUrls = new Set<string>();

  if (options.mode === 'diet-fitness') {
    console.log(`🔍 [Phase 1] Discovering products for ${DIET_FITNESS_SEARCH_TERMS.length} dietary staple keywords...`);
    for (let i = 0; i < DIET_FITNESS_SEARCH_TERMS.length; i++) {
      const term = DIET_FITNESS_SEARCH_TERMS[i];
      process.stdout.write(`  [${i + 1}/${DIET_FITNESS_SEARCH_TERMS.length}] Searching "${term}"... `);
      const urls = await searchJumboProductUrls(discoveryPage, term, 6);
      urls.forEach((u) => discoveredUrls.add(u));
      console.log(`Found ${urls.length} items (Total unique: ${discoveredUrls.size})`);
      await discoveryPage.waitForTimeout(500);
    }
  } else {
    console.log(`📦 [Phase 1] Crawling ${JUMBO_EDIBLE_CATEGORIES.length} edible supermarket categories...`);
    for (let i = 0; i < JUMBO_EDIBLE_CATEGORIES.length; i++) {
      const cat = JUMBO_EDIBLE_CATEGORIES[i];
      process.stdout.write(`  [${i + 1}/${JUMBO_EDIBLE_CATEGORIES.length}] Category: ${cat}... `);
      const urls = await scrapeJumboCategoryUrls(
        discoveryPage,
        cat,
        options.maxPagesPerCategory || 5
      );
      urls.forEach((u) => discoveredUrls.add(u));
      console.log(`Found ${urls.length} items (Total unique: ${discoveredUrls.size})`);

      if (options.maxTotalProducts && discoveredUrls.size >= options.maxTotalProducts) {
        console.log(`Reached requested target product limit (${options.maxTotalProducts}).`);
        break;
      }
      await discoveryPage.waitForTimeout(500);
    }
  }

  await discoveryPage.close();
  await discoveryContext.close();

  const urlList = Array.from(discoveredUrls);
  console.log(`\n📋 Discovered ${urlList.length} unique Jumbo product targets to scrape.`);

  console.log(`\n🥗 [Phase 2] Extracting nutritional tables & inserting into Supabase...`);
  const concurrency = options.concurrency || 4;
  let successCount = 0;
  let newInsertCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // Split into worker batches
  const workerChunks: string[][] = Array.from({ length: concurrency }, () => []);
  urlList.forEach((url, idx) => {
    workerChunks[idx % concurrency].push(url);
  });

  const workers = workerChunks.map(async (chunk, workerId) => {
    const workerCtx = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await workerCtx.newPage();
    await page.route('**/*.{png,jpg,jpeg,svg,woff,woff2,gif,webp}', (route) => route.abort());

    for (let i = 0; i < chunk.length; i++) {
      const url = chunk[i];
      try {
        const product = await scrapeJumboProductPage(page, url);
        if (product && (product.kcal_per_100g || product.protein_per_100g)) {
          const isNew = await upsertJumboProduct(product);
          successCount++;
          if (isNew) {
            newInsertCount++;
            console.log(
              `  [Worker ${workerId + 1}] ✨ INSERTED: "${product.name}" (${product.kcal_per_100g} kcal | ${product.protein_per_100g}g P | ${product.carbs_per_100g}g C | ${product.fat_per_100g}g F)`
            );
          } else {
            updatedCount++;
            console.log(`  [Worker ${workerId + 1}] 🔄 SYNCED: "${product.name}" (Duplicate name merged)`);
          }
        } else {
          skippedCount++;
        }
      } catch (e: any) {
        skippedCount++;
      }
    }

    await page.close();
    await workerCtx.close();
  });

  await Promise.all(workers);
  await browser.close();
  await dbPool.end();

  const elapsedSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n========================================================`);
  console.log(`🎉 JUMBO SCRAPING COMPLETE (${elapsedSec}s)`);
  console.log(`Total Products Processed: ${urlList.length}`);
  console.log(`Successfully Saved:      ${successCount}`);
  console.log(`  - New Insertions:      ${newInsertCount}`);
  console.log(`  - Existing/Merged:     ${updatedCount}`);
  console.log(`Skipped / Non-Food:      ${skippedCount}`);
  console.log(`========================================================\n`);
}

// Check command line arguments:
// node --loader tsx scripts/scrapeJumboDietFitness50.ts [mode]
// modes: 'diet-fitness' (default) | 'full-catalog'
const args = process.argv.slice(2);
const modeArg = (args[0] === 'full' || args[0] === 'full-catalog') ? 'full-catalog' : 'diet-fitness';

runGenericJumboScraper({
  mode: modeArg,
  maxPagesPerCategory: modeArg === 'full-catalog' ? 20 : 3,
  concurrency: 4,
});
