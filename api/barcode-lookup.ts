import type { VercelRequest, VercelResponse } from '@vercel/node';
import { FoodItemNutrition } from '../src/models.ts';
import { extractSchemaAndHeadings, parseDutchNutritionTable, extractPackageSizing, fetchAlbertHeijnMobileProduct, searchAlbertHeijnProduct } from './scraperRegistry.js';
import { matchBakeryPlu } from '../src/lib/bakeryPluDictionary.js';

const AH_HEADERS = {
  'Host': 'api.ah.nl',
  'x-application': 'AHWEBSHOP',
  'user-agent': 'Appie/8.8.2 Model/phone Android/7.0-API24',
  'content-type': 'application/json; charset=UTF-8',
};

/**
 * Resolves product details from Albert Heijn web search by EAN barcode or internal PLU query (unauthenticated fallback).
 */
export async function resolveAlbertHeijnWebBarcode(barcode: string): Promise<FoodItemNutrition | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  // 1. Check pre-seeded bakery PLU mapping first
  const pluMatchEntry = matchBakeryPlu(cleanBarcode);
  if (pluMatchEntry) {
    if (pluMatchEntry.webshopId) {
      const mobItem = await fetchAlbertHeijnMobileProduct(pluMatchEntry.webshopId);
      if (mobItem) {
        return {
          ...mobItem,
          barcode: cleanBarcode,
        };
      }
    }
    const searched = await searchAlbertHeijnProduct(pluMatchEntry.searchQuery);
    if (searched) {
      return {
        ...searched,
        barcode: cleanBarcode,
      };
    }
  }

  // Check if it's an in-store scale barcode (GS1 prefix 20-29). If so, extract the internal PLU identifier (middle digits)
  const isScaleCode = /^(?:20|21|22|23|24|25|26|27|28|29)(\d{5,6})\d{5,6}$/.test(cleanBarcode);
  const pluMatch = cleanBarcode.match(/^(?:20|21|22|23|24|25|26|27|28|29)(\d{5,6})/);
  const searchQuery = isScaleCode && pluMatch ? pluMatch[1] : cleanBarcode;

  try {
    const searchUrl = `https://www.ah.nl/zoeken?query=${encodeURIComponent(searchQuery)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!searchRes.ok) return null;

    const html = await searchRes.text();
    const linkMatch = html.match(/href=["'](\/producten\/product\/wi(\d+)\/[^"']+)["']/i);
    if (!linkMatch) return null;

    const productPath = linkMatch[1];
    const webshopId = linkMatch[2];
    const fullUrl = `https://www.ah.nl${productPath}`;

    const prodRes = await fetch(fullUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!prodRes.ok) return null;

    const prodHtml = await prodRes.text();
    const { title, brand, packageWeightGrams: schemaWeight } = extractSchemaAndHeadings(prodHtml, 'Albert Heijn');
    const nutrition = parseDutchNutritionTable(prodHtml);
    const sizing = extractPackageSizing(title, prodHtml);

    const isDrink =
      prodHtml.toLowerCase().includes('per 100 milliliter') ||
      prodHtml.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank');

    const cleanTitle = title.replace(/^AH\s+/i, '').trim();

    return {
      id: `ah_wi${webshopId}`,
      name: cleanTitle || title,
      brand,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...nutrition,
      packageWeightGrams: schemaWeight || sizing.packageWeightGrams,
      pieceCount: sizing.pieceCount,
      barcode: cleanBarcode,
      sourceUrl: fullUrl,
      isCustom: false,
    };
  } catch (err) {
    console.warn('AH unauthenticated web search barcode lookup failed:', err);
    return null;
  }
}

/**
 * Resolves product details & macros directly from Albert Heijn Mobile Services API by EAN / GTIN barcode,
 * with an automatic fallback to unauthenticated AH web search if token or mobile endpoints fail.
 */
export async function resolveAlbertHeijnBarcode(barcode: string): Promise<FoodItemNutrition | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  // 0. Pre-seeded bakery PLU check
  const pluMatchEntry = matchBakeryPlu(cleanBarcode);
  if (pluMatchEntry && pluMatchEntry.webshopId) {
    const mobileProd = await fetchAlbertHeijnMobileProduct(pluMatchEntry.webshopId);
    if (mobileProd) {
      return {
        ...mobileProd,
        barcode: cleanBarcode,
      };
    }
  }

  try {
    // 1. Get anonymous guest token from AH Mobile Auth
    const authRes = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
      method: 'POST',
      headers: AH_HEADERS,
      body: JSON.stringify({ clientId: 'appie' }),
    });

    if (!authRes.ok) {
      console.warn('AH Mobile Auth failed for barcode lookup (HTTP', authRes.status, '), falling back to web search.');
      return await resolveAlbertHeijnWebBarcode(cleanBarcode);
    }

    const { access_token } = (await authRes.json()) as { access_token?: string };
    if (!access_token) {
      return await resolveAlbertHeijnWebBarcode(cleanBarcode);
    }

    // 2. Query AH GTIN search endpoint
    const gtinUrl = `https://api.ah.nl/mobile-services/product/search/v1/gtin/${encodeURIComponent(cleanBarcode)}`;
    const gtinRes = await fetch(gtinUrl, {
      headers: {
        ...AH_HEADERS,
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!gtinRes.ok) {
      return await resolveAlbertHeijnWebBarcode(cleanBarcode);
    }

    const card = await gtinRes.json();
    const webshopId = card.webshopId || card.id;
    if (!webshopId) {
      return await resolveAlbertHeijnWebBarcode(cleanBarcode);
    }

    const title = card.title || 'AH Product';
    const brand = card.brand || 'AH';
    const salesUnitSize = card.salesUnitSize || '';

    // Extract package weight if available in salesUnitSize (e.g. "200 g", "500 g", "1 kg")
    let packageWeightGrams: number | undefined;
    if (salesUnitSize) {
      const gMatch = salesUnitSize.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|ml)\b/i);
      if (gMatch) {
        packageWeightGrams = Math.round(parseFloat(gMatch[1].replace(',', '.')));
      } else {
        const kgMatch = salesUnitSize.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
        if (kgMatch) {
          packageWeightGrams = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
        }
      }
    }

    // 3. Fetch detailed tradeItem FIR information (contains verified Voedingswaarden)
    let kcalPer100g = 0;
    let proteinPer100g = 0;
    let carbsPer100g = 0;
    let sugarPer100g = 0;
    let fatPer100g = 0;
    let fiberPer100g = 0;

    try {
      const firUrl = `https://api.ah.nl/mobile-services/product/detail/v4/fir/${webshopId}`;
      const firRes = await fetch(firUrl, {
        headers: {
          ...AH_HEADERS,
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (firRes.ok) {
        const firData = await firRes.json();
        const nutrientHeaders = firData.tradeItem?.nutritionalInformation?.nutrientHeaders || [];
        const detailList = nutrientHeaders[0]?.nutrientDetail || [];

        for (const d of detailList) {
          const type = d.nutrientTypeCode?.value;
          const label = (d.nutrientTypeCode?.label || '').toLowerCase();
          const val = Number(d.quantityContained?.[0]?.value ?? 0);
          const unit = d.quantityContained?.[0]?.measurementUnitCode?.value;

          if ((type === 'ENER-' || label.includes('energie')) && unit === 'kcal') {
            kcalPer100g = Math.round(val);
          } else if (type === 'FAT' || label === 'vet') {
            fatPer100g = parseFloat(val.toFixed(1));
          } else if (type === 'SUGAR-' || label.includes('suikers')) {
            sugarPer100g = parseFloat(val.toFixed(1));
          } else if (type === 'CHOAVL' || (label.includes('koolhydraten') && !label.includes('waarvan'))) {
            carbsPer100g = parseFloat(val.toFixed(1));
          } else if (type === 'FIBTG' || label.includes('vezel')) {
            fiberPer100g = parseFloat(val.toFixed(1));
          } else if (type === 'PRO-' || label.includes('eiwit')) {
            proteinPer100g = parseFloat(val.toFixed(1));
          }
        }
      }
    } catch (firErr) {
      console.warn('Could not fetch FIR nutrient table for AH item:', firErr);
    }

    const cleanTitle = title.replace(/^AH\s+/i, '').trim();

    return {
      id: `ah_wi${webshopId}`,
      name: cleanTitle || title,
      brand,
      servingUnit: salesUnitSize.toLowerCase().includes('ml') ? 'ml' : 'gram',
      kcalPer100g,
      proteinPer100g,
      carbsPer100g,
      sugarPer100g,
      fatPer100g,
      fiberPer100g,
      packageWeightGrams,
      barcode: cleanBarcode,
      sourceUrl: `https://www.ah.nl/producten/product/wi${webshopId}`,
      isCustom: false,
    };
  } catch (err) {
    console.error('Error resolving barcode from Albert Heijn mobile services, trying web fallback:', err);
    return await resolveAlbertHeijnWebBarcode(cleanBarcode);
  }
}

/**
 * Resolves product details from Jumbo by EAN barcode search / query.
 */
export async function resolveJumboBarcode(barcode: string): Promise<FoodItemNutrition | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode) return null;

  try {
    const searchUrl = `https://www.jumbo.com/producten/?searchType=keyword&searchTerms=${encodeURIComponent(cleanBarcode)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    // Match product link from HTML search page
    const linkMatch = html.match(/href=[\"'](\/producten\/[a-z0-9-]+-([0-9]+[a-z0-9]*))[\"']/i);
    if (!linkMatch) return null;

    const productPath = linkMatch[1];
    const rawSku = linkMatch[2];
    const cleanSku = rawSku.replace(/[a-zA-Z]+$/, '');
    const fullProductUrl = `https://www.jumbo.com${productPath}`;

    const prodRes = await fetch(fullProductUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!prodRes.ok) return null;
    const prodHtml = await prodRes.text();

    // Extract title from h1 or meta tag
    const titleMatch = prodHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || prodHtml.match(/<meta property=[\"']og:title[\"'] content=[\"']([^\"']+)[\"']/i);
    let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : 'Jumbo Product';
    title = title.replace(/^Jumbo(?:'s)?\s+/i, '').trim();

    // Extract brand
    const brandMatch = prodHtml.match(/<meta property=[\"']product:brand[\"'] content=[\"']([^\"']+)[\"']/i);
    const brand = brandMatch ? brandMatch[1].trim() : 'Jumbo';

    // Extract portion size / serving size from subtitle or text
    let packageWeightGrams: number | undefined;
    const sizeMatch = prodHtml.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|ml)\b/i);
    if (sizeMatch) {
      packageWeightGrams = Math.round(parseFloat(sizeMatch[1].replace(',', '.')));
    }

    // Extract nutrition values from table / text
    let kcalPer100g = 0;
    let proteinPer100g = 0;
    let carbsPer100g = 0;
    let sugarPer100g = 0;
    let fatPer100g = 0;
    let fiberPer100g = 0;

    const kcalMatch = prodHtml.match(/(?:energie|energy)[\s\S]*?(?:kcal\s*(\d+)|(\d+)\s*kcal)/i);
    if (kcalMatch) {
      kcalPer100g = parseInt(kcalMatch[1] || kcalMatch[2], 10);
    }

    const proteinMatch = prodHtml.match(/(?:eiwitten?|protein)[\s\S]*?(\d+(?:[.,]\d+)?)\s*g\b/i);
    if (proteinMatch) {
      proteinPer100g = parseFloat(proteinMatch[1].replace(',', '.'));
    }

    const carbsMatch = prodHtml.match(/(?:koolhydraten|carbohydrates)[\s\S]*?(\d+(?:[.,]\d+)?)\s*g\b/i);
    if (carbsMatch) {
      carbsPer100g = parseFloat(carbsMatch[1].replace(',', '.'));
    }

    const sugarMatch = prodHtml.match(/(?:suikers|sugars)[\s\S]*?(\d+(?:[.,]\d+)?)\s*g\b/i);
    if (sugarMatch) {
      sugarPer100g = parseFloat(sugarMatch[1].replace(',', '.'));
    }

    const fatMatch = prodHtml.match(/(?:vetten?|fat)[\s\S]*?(\d+(?:[.,]\d+)?)\s*g\b/i);
    if (fatMatch) {
      fatPer100g = parseFloat(fatMatch[1].replace(',', '.'));
    }

    const fiberMatch = prodHtml.match(/(?:vezels?|fiber)[\s\S]*?(\d+(?:[.,]\d+)?)\s*g\b/i);
    if (fiberMatch) {
      fiberPer100g = parseFloat(fiberMatch[1].replace(',', '.'));
    }

    return {
      id: `jumbo_${cleanSku || rawSku}`,
      name: title,
      brand,
      servingUnit: prodHtml.toLowerCase().includes('ml') ? 'ml' : 'gram',
      kcalPer100g,
      proteinPer100g,
      carbsPer100g,
      sugarPer100g,
      fatPer100g,
      fiberPer100g,
      packageWeightGrams,
      barcode: cleanBarcode,
      sourceUrl: fullProductUrl,
      isCustom: false,
    };
  } catch (err) {
    console.error('Error resolving barcode from Jumbo:', err);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const barcode = (req.query.barcode || req.body?.barcode) as string;
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Missing barcode parameter' });
  }

  // 1. Try Albert Heijn resolver first
  let product = await resolveAlbertHeijnBarcode(barcode);

  // 2. Fallback to Jumbo resolver
  if (!product) {
    product = await resolveJumboBarcode(barcode);
  }

  if (!product) {
    return res.status(404).json({ error: `Barcode ${barcode} not found on AH or Jumbo` });
  }

  return res.status(200).json(product);
}
