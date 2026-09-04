import { chromium, type Page } from 'playwright';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const poolerUrl =
  process.env.DATABASE_POOLER_URL ||
  'postgresql://postgres.khvnlmzhymocnvdnptci:itPV7fCkw4O9vbK6@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

export const dirkDbPool = new pg.Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export interface DirkScrapedFood {
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
 * Fetch all product URLs directly from the official Dirk.nl products sitemap.
 */
export async function getDirkProductUrls(): Promise<string[]> {
  console.log('📡 Fetching Dirk Product Sitemap (https://www.dirk.nl/products-sitemap.xml)...');
  const response = await fetch('https://www.dirk.nl/products-sitemap.xml', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Dirk sitemap: HTTP ${response.status}`);
  }

  const xmlText = await response.text();
  const matches = [...xmlText.matchAll(/<loc>(https:\/\/www\.dirk\.nl\/boodschappen\/[^<]+)<\/loc>/g)];
  const urls = matches.map((m) => m[1]);

  console.log(`✅ Discovered ${urls.length} product URLs from Dirk sitemap.`);
  return urls;
}

/**
 * Parses Dutch nutritional textual blocks from Dirk.nl DOM
 */
export function parseDirkNutritionText(rawText: string) {
  let kcal = 0;
  let protein = 0;
  let carbs = 0;
  let sugar = 0;
  let fat = 0;
  let fiber = 0;

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Energie Kilocalorieën (kcal)
    if (/Energie Kilocalorie[eë]n/i.test(line)) {
      const nextVal = lines[i + 1] || '';
      const numMatch = nextVal.match(/^(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        kcal = Math.round(parseFloat(numMatch[1].replace(',', '.')));
      }
    } else if (kcal === 0 && /(\d+(?:[.,]\d+)?)\s*kcal/i.test(line)) {
      const match = line.match(/(\d+(?:[.,]\d+)?)\s*kcal/i);
      if (match) kcal = Math.round(parseFloat(match[1].replace(',', '.')));
    }

    // Vetten (g)
    if (/^Vetten\s*\(g\)/i.test(line) || line === 'Vetten') {
      const nextVal = lines[i + 1] || '';
      const numMatch = nextVal.match(/^(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        fat = parseFloat(parseFloat(numMatch[1].replace(',', '.')).toFixed(1));
      }
    }

    // Koolhydraten (g)
    if (/^Koolhydraten\s*\(g\)/i.test(line) || line === 'Koolhydraten') {
      const nextVal = lines[i + 1] || '';
      const numMatch = nextVal.match(/^(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        carbs = parseFloat(parseFloat(numMatch[1].replace(',', '.')).toFixed(1));
      }
    }

    // suikers (g)
    if (/suikers\s*\(g\)/i.test(line) || /Waarvan suikers/i.test(line)) {
      const nextVal = lines[i + 1] || '';
      const numMatch = nextVal.match(/^(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        sugar = parseFloat(parseFloat(numMatch[1].replace(',', '.')).toFixed(1));
      }
    }

    // Voedingsvezel (g)
    if (/Voedingsvezel\s*\(g\)/i.test(line) || /^Vezels?\b/i.test(line)) {
      const nextVal = lines[i + 1] || '';
      const numMatch = nextVal.match(/^(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        fiber = parseFloat(parseFloat(numMatch[1].replace(',', '.')).toFixed(1));
      }
    }

    // Eiwitten (g)
    if (/^Eiwitten\s*\(g\)/i.test(line) || line === 'Eiwitten') {
      const nextVal = lines[i + 1] || '';
      const numMatch = nextVal.match(/^(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        protein = parseFloat(parseFloat(numMatch[1].replace(',', '.')).toFixed(1));
      }
    }
  }

  return { kcal, protein, carbs, sugar, fat, fiber };
}

/**
 * Scrapes a single Dirk.nl product page using Playwright.
 */
export async function scrapeDirkProductPage(page: Page, url: string): Promise<DirkScrapedFood | null> {
  try {
    // Wait until network is idle so Vue/Nuxt has completely hydrated the event listeners
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for product heading
    await page.waitForSelector('h1', { timeout: 8000 });

    const rawTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText.trim() : document.title.split('|')[0].trim();
    });

    if (!rawTitle) return null;

    // Expand Voedingswaarden accordion in browser DOM
    try {
      const btn = page.locator('div.title:has-text("Voedingswaarden") button, button:has-text("Voedingswaarden")').first();
      if (await btn.isVisible({ timeout: 2000 })) {
        await btn.click({ force: true });
        await page.waitForTimeout(800);
      }
    } catch {
      // Accordion might already be open or missing
    }

    const pageContent = await page.evaluate(() => document.body.innerText);
    const hasNutrition =
      pageContent.includes('Voedingswaarden') ||
      (pageContent.includes('Energie') && (pageContent.includes('Eiwit') || pageContent.includes('Vet')));

    if (!hasNutrition) {
      return null;
    }

    const nutrition = parseDirkNutritionText(pageContent);

    // If all calories and macros are 0, it is likely not an edible food item
    if (nutrition.kcal === 0 && nutrition.protein === 0 && nutrition.carbs === 0 && nutrition.fat === 0) {
      return null;
    }

    // Extract package weight from URL or title (e.g. "500-g" or "500 g")
    let packageWeightGrams: number | undefined;
    const gMatch = url.match(/(\d+(?:[.,]\d+)?)-(?:g|gram|ml)-/i) || pageContent.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|ml)\b/i);
    if (gMatch) {
      packageWeightGrams = Math.round(parseFloat(gMatch[1].replace(',', '.')));
    } else {
      const kgMatch = url.match(/(\d+(?:[.,]\d+)?)-kg/i) || pageContent.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
      if (kgMatch) {
        packageWeightGrams = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
      }
    }

    // Extract SKU from end of URL (e.g. /10)
    const skuMatch = url.match(/\/(\d+)$/);
    const sku = skuMatch ? skuMatch[1] : `dirk_${Math.random().toString(36).slice(2, 8)}`;

    const isLiquid = url.includes('dranken') || url.includes('-ml') || rawTitle.toLowerCase().includes(' ml') || rawTitle.toLowerCase().includes(' liter');
    const brand = rawTitle.toLowerCase().startsWith('1 de beste') ? '1 de Beste' : rawTitle.toLowerCase().startsWith('bio+') ? 'Bio+' : 'Dirk';

    return {
      id: `dirk_${sku}`,
      name: rawTitle,
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
    };
  } catch (err: any) {
    console.error(`Error scraping ${url}:`, err.message);
    return null;
  }
}
