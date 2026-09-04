import { chromium, type Browser, type Page } from 'playwright';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const poolerUrl =
  process.env.DATABASE_POOLER_URL ||
  'postgresql://postgres.khvnlmzhymocnvdnptci:itPV7fCkw4O9vbK6@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

export const dbPool = new pg.Pool({
  connectionString: poolerUrl,
  ssl: { rejectUnauthorized: false },
  max: 10,
});

export interface JumboProduct {
  id?: string;
  name: string;
  brand: string;
  serving_unit?: 'gram' | 'ml';
  kcal_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  sugar_per_100g: number;
  fat_per_100g: number;
  fiber_per_100g: number;
  source_url: string;
  barcode?: string;
}

// All major edible supermarket categories on Jumbo.com
export const JUMBO_EDIBLE_CATEGORIES = [
  // Aardappelen, groente & fruit
  '/producten/aardappelen,-groente-en-fruit/snackgroente/',
  '/producten/aardappelen,-groente-en-fruit/aardappelen/',
  '/producten/aardappelen,-groente-en-fruit/groente/',
  '/producten/aardappelen,-groente-en-fruit/groentemix-en-stamppot/',
  '/producten/aardappelen,-groente-en-fruit/sla-en-salade/',
  '/producten/aardappelen,-groente-en-fruit/fruit/',
  '/producten/aardappelen,-groente-en-fruit/verse-sappen-en-smoothies/',
  '/producten/aardappelen,-groente-en-fruit/uien-en-knoflook/',
  '/producten/aardappelen,-groente-en-fruit/verse-kruiden,-gember-en-pepers/',
  '/producten/aardappelen,-groente-en-fruit/pitten-en-zuidvruchten/',
  '/producten/aardappelen,-groente-en-fruit/verspakketten/',
  '/producten/aardappelen,-groente-en-fruit/biologisch/',
  '/producten/aardappelen,-groente-en-fruit/diepvries-fruit/',

  // Vlees, vis & vega
  '/producten/vlees,-vis-en-vega/gehakt,-worst-en-burgers/',
  '/producten/vlees,-vis-en-vega/kip-en-kalkoen/',
  '/producten/vlees,-vis-en-vega/rundvlees/',
  '/producten/vlees,-vis-en-vega/varkensvlees/',
  '/producten/vlees,-vis-en-vega/vleesvervangers/',
  '/producten/vlees,-vis-en-vega/vis/',
  '/producten/vlees,-vis-en-vega/wild-en-lamsvlees/',
  '/producten/vlees,-vis-en-vega/diepvries-vis/',

  // Zuivel, boter en eieren
  '/producten/zuivel,-boter-en-eieren/verse-melk/',
  '/producten/zuivel,-boter-en-eieren/houdbare-melk-en-chocolademelk/',
  '/producten/zuivel,-boter-en-eieren/yoghurt-en-kwark/',
  '/producten/zuivel,-boter-en-eieren/vla,-pap-en-toetjes/',
  '/producten/zuivel,-boter-en-eieren/proteine-zuivel/',
  '/producten/zuivel,-boter-en-eieren/slagroom,-creme-fraiche-en-kookroom/',
  '/producten/zuivel,-boter-en-eieren/boter-en-margarine/',
  '/producten/zuivel,-boter-en-eieren/eieren/',
  '/producten/zuivel,-boter-en-eieren/plantaardig/',
  '/producten/zuivel,-boter-en-eieren/lactosevrije-zuivel/',
  '/producten/zuivel,-boter-en-eieren/probiotica-en-kefir/',
  '/producten/zuivel,-boter-en-eieren/drinkyoghurt-en-ijskoffie/',

  // Brood en gebak & Ontbijtgranen
  '/producten/brood-en-gebak/broden/',
  '/producten/brood-en-gebak/afbakbrood/',
  '/producten/brood-en-gebak/bolletjes,-puntjes/',
  '/producten/ontbijtgranen-en-beleg/ontbijtgranen-en-muesli/',
  '/producten/ontbijtgranen-en-beleg/zoet-broodbeleg/',
  '/producten/ontbijtgranen-en-beleg/pindakaas-en-notenpasta/',
  '/producten/ontbijtgranen-en-beleg/crackers-en-beschuit/',

  // Vleeswaren, kaas en tapas
  '/producten/vleeswaren,-kaas-en-tapas/kaas-voor-op-brood/',
  '/producten/vleeswaren,-kaas-en-tapas/kaas-voor-de-maaltijd/',
  '/producten/vleeswaren,-kaas-en-tapas/gesneden-vleeswaren-en-worst/',
  '/producten/vleeswaren,-kaas-en-tapas/filet-americain,-pate-en-smeerworst/',
  '/producten/vleeswaren,-kaas-en-tapas/vegetarische-vleeswaren/',
  '/producten/vleeswaren,-kaas-en-tapas/broodsalades,-hummus-en-spreads/',

  // Pasta, rijst en wereldkeuken
  '/producten/pasta,-rijst-en-wereldkeuken/pasta/',
  '/producten/pasta,-rijst-en-wereldkeuken/rijst/',
  '/producten/pasta,-rijst-en-wereldkeuken/noedels-en-mie/',
  '/producten/pasta,-rijst-en-wereldkeuken/peulvruchten-en-bonen/',
  '/producten/pasta,-rijst-en-wereldkeuken/pastasaus-en-pesto/',
  '/producten/pasta,-rijst-en-wereldkeuken/oosterse-keuken/',
  '/producten/pasta,-rijst-en-wereldkeuken/mexicaanse-keuken/',

  // Conserven, soepen, sauzen & oliën
  '/producten/conserven,-soepen,-sauzen,-olien/groenteconserven/',
  '/producten/conserven,-soepen,-sauzen,-olien/fruitconserven/',
  '/producten/conserven,-soepen,-sauzen,-olien/vis-en-vleesconserven/',
  '/producten/conserven,-soepen,-sauzen,-olien/olijfolie-en-bakolie/',
  '/producten/conserven,-soepen,-sauzen,-olien/dressing-en-azijn/',
  '/producten/conserven,-soepen,-sauzen,-olien/soep/',

  // Diepvries
  '/producten/diepvries/diepvries-groente/',
  '/producten/diepvries/diepvries-vlees-en-vis/',
  '/producten/diepvries/diepvries-aardappelen-en-patat/',
  '/producten/diepvries/diepvries-maaltijden/',
  '/producten/diepvries/diepvries-pizza/'
];

/**
 * Scrapes product URLs from a Jumbo category page with pagination support
 */
export async function scrapeJumboCategoryUrls(
  page: Page,
  categoryPath: string,
  maxPages: number = 20
): Promise<string[]> {
  const productUrls = new Set<string>();
  const baseUrl = 'https://www.jumbo.com';

  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    const offset = (pageNum - 1) * 25;
    const catUrl = `${baseUrl}${categoryPath}${categoryPath.endsWith('/') ? '' : '/'}?offSet=${offset}`;

    try {
      await page.goto(catUrl, { waitUntil: 'commit', timeout: 30000 });
      await page.waitForTimeout(3000);

      const links: string[] = await page.$$eval('a', (anchors) => {
        const regex = /-\d+[A-Za-z]+$/;
        return anchors
          .map((a) => a.getAttribute('href') || '')
          .filter((h) => h.startsWith('/producten/') && regex.test(h));
      });

      const initialCount = productUrls.size;
      for (const link of links) {
        const fullUrl = link.startsWith('http') ? link : `${baseUrl}${link}`;
        productUrls.add(fullUrl.split('#')[0]);
      }

      // If no new products found on this page, break to next category
      if (productUrls.size === initialCount && links.length === 0) {
        break;
      }
    } catch (e: any) {
      console.warn(`[Jumbo Category] Error loading ${catUrl}: ${e.message}`);
      break;
    }
  }

  return Array.from(productUrls);
}

/**
 * Searches Jumbo and retrieves product URLs matching a query term
 */
export async function searchJumboProductUrls(
  page: Page,
  query: string,
  limit: number = 10
): Promise<string[]> {
  const searchUrl = `https://www.jumbo.com/producten/?searchType=keyword&searchTerms=${encodeURIComponent(query)}`;
  const baseUrl = 'https://www.jumbo.com';
  try {
    await page.goto(searchUrl, { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(3000);

    const urls: string[] = await page.$$eval('a', (anchors) => {
      const regex = /-\d+[A-Za-z]+$/;
      return anchors
        .map((a) => a.getAttribute('href') || '')
        .filter((h) => h.startsWith('/producten/') && regex.test(h));
    });

    const cleanUrls = Array.from(new Set(urls))
      .map((h) => (h.startsWith('http') ? h : `${baseUrl}${h}`))
      .map((h) => h.split('#')[0]);

    return cleanUrls.slice(0, limit);
  } catch (e: any) {
    console.warn(`[Jumbo Search] Error searching '${query}': ${e.message}`);
    return [];
  }
}

/**
 * Scrapes nutrition facts and details from a single Jumbo product page
 */
export async function scrapeJumboProductPage(page: Page, url: string): Promise<JumboProduct | null> {
  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 30000 });
    await page.waitForTimeout(2500);

    const productData = await page.evaluate((srcUrl: string) => {
      const h1El = document.querySelector('h1');
      let rawName = h1El ? (h1El.textContent || '').trim() : '';
      if (!rawName || rawName.includes('Helaas')) return null;

      // Clean store brand prefix (e.g. "Jumbo's Pindakaas" -> "Pindakaas", "Jumbo Kipfilet" -> "Kipfilet")
      const name = rawName
        .replace(/^jumbo(?:'s)?\s*[-–:]*\s*/i, '')
        .trim();

      if (!name) return null;

      let brand = '';
      let barcode = '';

      // Check Schema.org JSON-LD
      try {
        const ldScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        for (const s of ldScripts) {
          const json = JSON.parse(s.textContent || '{}');
          if (json['@type'] === 'Product') {
            if (json.brand) {
              brand = typeof json.brand === 'string' ? json.brand : (json.brand.name || '');
            }
            if (json.gtin13 || json.gtin8 || json.gtin || json.sku) {
              barcode = json.gtin13 || json.gtin8 || json.gtin || '';
            }
            break;
          }
        }
      } catch (e) {}

      if (!brand) {
        brand = name.split(' ')[0] || 'Jumbo';
      }

      // Parse nutritional table
      const rows = Array.from(document.querySelectorAll('table tr')).map((r) =>
        (r as HTMLElement).innerText.toLowerCase().replace(/\s+/g, ' ')
      );

      let kcal = 0;
      let protein = 0;
      let carbs = 0;
      let sugar = 0;
      let fat = 0;
      let fiber = 0;
      let foundNutrition = false;

      for (const row of rows) {
        if (row.includes('kcal') && kcal === 0) {
          const match = row.match(/(?:kcal\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*kcal)/);
          if (match) {
            kcal = parseFloat((match[1] || match[2]).replace(',', '.'));
            foundNutrition = true;
          }
        }
        if (row.startsWith('eiwit') && protein === 0) {
          const match = row.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (match) {
            protein = parseFloat(match[1].replace(',', '.'));
            foundNutrition = true;
          }
        }
        if (row.startsWith('koolhydra') && carbs === 0) {
          const match = row.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (match) {
            carbs = parseFloat(match[1].replace(',', '.'));
            foundNutrition = true;
          }
        }
        if (row.includes('suiker') && sugar === 0) {
          const match = row.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (match) sugar = parseFloat(match[1].replace(',', '.'));
        }
        if (
          (row.startsWith('vetten') || row.startsWith('vet')) &&
          !row.includes('verzadigd') &&
          fat === 0
        ) {
          const match = row.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (match) {
            fat = parseFloat(match[1].replace(',', '.'));
            foundNutrition = true;
          }
        }
        if (row.includes('vezel') && fiber === 0) {
          const match = row.match(/(\d+(?:[.,]\d+)?)\s*g/);
          if (match) fiber = parseFloat(match[1].replace(',', '.'));
        }
      }

      // Fallback: If table wasn't found or parsed, scan full page text
      if (!foundNutrition) {
        const bodyText = document.body.innerText.toLowerCase();
        const kcalMatch = bodyText.match(/(?:kcal\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*kcal)/);
        if (kcalMatch) {
          kcal = parseFloat((kcalMatch[1] || kcalMatch[2]).replace(',', '.'));
          foundNutrition = true;
        }

        const eiwitMatch = bodyText.match(/eiwitten?\s*[:\t]?\s*(\d+(?:[.,]\d+)?)\s*g/);
        if (eiwitMatch) {
          protein = parseFloat(eiwitMatch[1].replace(',', '.'));
          foundNutrition = true;
        }

        const carbsMatch = bodyText.match(/koolhydraten\s*[:\t]?\s*(\d+(?:[.,]\d+)?)\s*g/);
        if (carbsMatch) {
          carbs = parseFloat(carbsMatch[1].replace(',', '.'));
          foundNutrition = true;
        }

        const fatMatch = bodyText.match(/vetten?\s*[:\t]?\s*(\d+(?:[.,]\d+)?)\s*g/);
        if (fatMatch) {
          fat = parseFloat(fatMatch[1].replace(',', '.'));
          foundNutrition = true;
        }
      }

      if (!foundNutrition && kcal === 0 && protein === 0) {
        return null;
      }

      const isLiquid = srcUrl.includes('-ml-') || name.toLowerCase().includes(' ml') || name.toLowerCase().includes(' liter');

      return {
        name,
        brand,
        serving_unit: isLiquid ? 'ml' : 'gram',
        kcal_per_100g: Math.round(kcal),
        protein_per_100g: Math.round(protein * 10) / 10,
        carbs_per_100g: Math.round(carbs * 10) / 10,
        sugar_per_100g: Math.round(sugar * 10) / 10,
        fat_per_100g: Math.round(fat * 10) / 10,
        fiber_per_100g: Math.round(fiber * 10) / 10,
        source_url: srcUrl,
        barcode: barcode || undefined,
      };
    }, url);

    return productData as JumboProduct | null;
  } catch (err: any) {
    return null;
  }
}

/**
 * Upserts a Jumbo product into Supabase public.food_items with duplicate prevention
 */
export async function upsertJumboProduct(product: JumboProduct): Promise<boolean> {
  try {
    const normName = product.name.trim();

    // Check if item with this name already exists
    const checkQuery = `
      SELECT id, name FROM public.food_items 
      WHERE lower(trim(name)) = lower(trim($1))
      LIMIT 1;
    `;
    const checkRes = await dbPool.query(checkQuery, [normName]);

    if (checkRes.rows.length > 0) {
      // Update existing item with fresh macros and brand if needed
      const updateQuery = `
        UPDATE public.food_items
        SET 
          kcal_per_100g = COALESCE($2, kcal_per_100g),
          protein_per_100g = COALESCE($3, protein_per_100g),
          carbs_per_100g = COALESCE($4, carbs_per_100g),
          sugar_per_100g = COALESCE($5, sugar_per_100g),
          fat_per_100g = COALESCE($6, fat_per_100g),
          fiber_per_100g = COALESCE($7, fiber_per_100g),
          brand = COALESCE($8, brand),
          updated_at = NOW()
        WHERE id = $1;
      `;
      await dbPool.query(updateQuery, [
        checkRes.rows[0].id,
        product.kcal_per_100g,
        product.protein_per_100g,
        product.carbs_per_100g,
        product.sugar_per_100g,
        product.fat_per_100g,
        product.fiber_per_100g,
        product.brand,
      ]);
      return false; // Updated existing (not a new insert)
    }

    // Generate clean concise unique ID using numeric SKU only (e.g. jumbo_753633 instead of jumbo_753633kgr)
    const skuMatch = product.source_url.match(/-(\d+)[A-Za-z]*(?:[/?#]|$)/);
    const productId = skuMatch
      ? `jumbo_${skuMatch[1]}`
      : `jumbo_${Math.random().toString(36).substring(2, 9)}`;

    // Insert new item
    const insertQuery = `
      INSERT INTO public.food_items (
        id, name, brand, serving_unit, kcal_per_100g, protein_per_100g, carbs_per_100g,
        sugar_per_100g, fat_per_100g, fiber_per_100g, source_url, is_custom, created_by, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false, 'community', NOW()
      );
    `;

    await dbPool.query(insertQuery, [
      productId,
      normName,
      product.brand,
      product.serving_unit || 'gram',
      product.kcal_per_100g || 0,
      product.protein_per_100g || 0,
      product.carbs_per_100g || 0,
      product.sugar_per_100g || 0,
      product.fat_per_100g || 0,
      product.fiber_per_100g || 0,
      product.source_url,
    ]);

    return true; // Successfully inserted new product
  } catch (err: any) {
    console.error(`Error saving product ${product.name}:`, err.message);
    return false;
  }
}
