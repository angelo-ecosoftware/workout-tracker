import { FoodItem } from '../../src/models';

export interface ProductScraperResult {
  id: string;
  name: string;
  brand: string;
  servingUnit: 'gram' | 'ml';
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sourceUrl: string;
}

export interface StoreScraperAdapter {
  name: string;
  canHandle(url: string): boolean;
  normalizeUrl?(url: string): string;
  parse(html: string, url: string): ProductScraperResult;
}

// -------------------------------------------------------------
// Helper: Parse standard Dutch nutritional table (Voedingswaarden)
// -------------------------------------------------------------
export function parseDutchNutritionTable(html: string): {
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
} {
  let kcalPer100g = 0;
  let proteinPer100g = 0;
  let carbsPer100g = 0;
  let sugarPer100g = 0;
  let fatPer100g = 0;
  let fiberPer100g = 0;

  const start = html.indexOf('Voedingswaarden');
  if (start === -1) {
    return { kcalPer100g, proteinPer100g, carbsPer100g, sugarPer100g, fatPer100g, fiberPer100g };
  }

  const end = html.indexOf('</table>', start);
  const tableSection = html.slice(start, end !== -1 ? end + 8 : start + 6000);

  // Check direct kcal occurrence in the table section
  const fullKcalMatch =
    tableSection.match(/(\d+(?:[.,]\d+)?)\s*kcal/i) || tableSection.match(/kcal\s*(\d+(?:[.,]\d+)?)/i);
  if (fullKcalMatch) {
    kcalPer100g = parseFloat(fullKcalMatch[1].replace(',', '.'));
  }

  const rows = tableSection.split(/<\/tr>/i);

  for (const r of rows) {
    const cleaned = r
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (!kcalPer100g && cleaned.startsWith('energie') && !cleaned.includes('referentie')) {
      let m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*kcal/);
      if (!m) m = cleaned.match(/kcal\s*(\d+(?:[.,]\d+)?)/);
      if (m) kcalPer100g = parseFloat(m[1].replace(',', '.'));
    }
    if (cleaned.startsWith('vetten') || cleaned.startsWith('vet ') || cleaned.startsWith('vet:')) {
      const m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
      if (m) fatPer100g = parseFloat(m[1].replace(',', '.'));
    }
    if (cleaned.includes('waarvan suikers') || cleaned.startsWith('suikers')) {
      const m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
      if (m) sugarPer100g = parseFloat(m[1].replace(',', '.'));
    }
    if (cleaned.startsWith('koolhydraten') && !cleaned.includes('waarvan')) {
      const m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
      if (m) carbsPer100g = parseFloat(m[1].replace(',', '.'));
    }
    if (cleaned.startsWith('eiwit') || cleaned.startsWith('eiwitten')) {
      const m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
      if (m) proteinPer100g = parseFloat(m[1].replace(',', '.'));
    }
    if (cleaned.startsWith('voedingsvezel') || cleaned.startsWith('vezel') || cleaned.startsWith('vezels')) {
      const m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
      if (m) fiberPer100g = parseFloat(m[1].replace(',', '.'));
    }
  }

  return { kcalPer100g, proteinPer100g, carbsPer100g, sugarPer100g, fatPer100g, fiberPer100g };
}

// -------------------------------------------------------------
// Helper: Extract JSON-LD and H1 title/brand fallbacks
// -------------------------------------------------------------
export function extractSchemaAndHeadings(
  html: string,
  defaultBrand: string
): { title: string; brand: string } {
  let title = 'Product';
  let brand = defaultBrand;

  const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (const jld of jsonLdMatches) {
    try {
      const content = jld.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
      const parsed = JSON.parse(content);
      if (parsed.name) {
        title = parsed.name
          .replace(/\s*bestellen\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
          .replace(/\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
          .trim();
      }
      if (parsed.brand && typeof parsed.brand === 'string') brand = parsed.brand;
      else if (parsed.brand?.name) brand = parsed.brand.name;
    } catch (e) {}
  }

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    const rawH1 = h1Match[1]
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (rawH1 && rawH1.length > 2 && !rawH1.toLowerCase().includes('helaas')) {
      title = rawH1;
    }
  }

  return { title, brand };
}

// -------------------------------------------------------------
// ADAPTER 1: Jumbo
// -------------------------------------------------------------
export const jumboAdapter: StoreScraperAdapter = {
  name: 'Jumbo',
  canHandle(url: string) {
    return url.toLowerCase().includes('jumbo.com');
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand } = extractSchemaAndHeadings(html, 'Jumbo');
    const nutrition = parseDutchNutritionTable(html);

    const jumboIdMatch = url.match(/-([0-9A-Z]+)$/i) || url.match(/producten\/([^/?#]+)/i);
    const productId = jumboIdMatch ? `jumbo_${jumboIdMatch[1].toLowerCase()}` : `jumbo_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank');

    return {
      id: productId,
      name: title,
      brand,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...nutrition,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// ADAPTER 2: Albert Heijn
// -------------------------------------------------------------
export const albertHeijnAdapter: StoreScraperAdapter = {
  name: 'Albert Heijn',
  canHandle(url: string) {
    return url.toLowerCase().includes('ah.nl') || url.startsWith('wi');
  },
  normalizeUrl(rawUrl: string) {
    let url = rawUrl.trim();
    if (!url.startsWith('http')) {
      if (url.startsWith('wi')) {
        url = `https://www.ah.nl/producten/product/${url}`;
      } else if (url.startsWith('/')) {
        url = `https://www.ah.nl${url}`;
      } else {
        url = `https://www.ah.nl/producten/product/${url}`;
      }
    }
    return url;
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand } = extractSchemaAndHeadings(html, 'AH');
    const nutrition = parseDutchNutritionTable(html);

    const wiMatch = url.match(/wi(\d+)/i);
    const productId = wiMatch ? `ah_wi${wiMatch[1]}` : `ah_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank');

    return {
      id: productId,
      name: title,
      brand,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...nutrition,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// ADAPTER 3: Generic Fallback (Plus, Dirk, Lidl, etc.)
// -------------------------------------------------------------
export const genericAdapter: StoreScraperAdapter = {
  name: 'Generic Store',
  canHandle() {
    return true; // fallback for any URL
  },
  parse(html: string, url: string): ProductScraperResult {
    let hostname = 'Custom';
    try {
      hostname = new URL(url).hostname.replace('www.', '').split('.')[0];
      hostname = hostname.charAt(0).toUpperCase() + hostname.slice(1);
    } catch {}

    const { title, brand } = extractSchemaAndHeadings(html, hostname);
    const nutrition = parseDutchNutritionTable(html);

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank');

    return {
      id: `food_${Date.now()}`,
      name: title,
      brand,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...nutrition,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// Registry of all Store Adapters
// (Easily register future stores here: Plus, Dirk, Picnic, etc.)
// -------------------------------------------------------------
export const STORE_SCRAPERS: StoreScraperAdapter[] = [
  jumboAdapter,
  albertHeijnAdapter,
  genericAdapter,
];

/**
 * Resolve target URL and scrape product info dynamically
 */
export async function scrapeProductFromUrl(rawUrl: string): Promise<ProductScraperResult> {
  const adapter = STORE_SCRAPERS.find((s) => s.canHandle(rawUrl)) || genericAdapter;
  const targetUrl = adapter.normalizeUrl ? adapter.normalizeUrl(rawUrl) : rawUrl.trim();

  const pageRes = await fetch(targetUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
    },
  });

  if (!pageRes.ok) {
    throw new Error(`Could not load ${adapter.name} product page (status ${pageRes.status})`);
  }

  const html = await pageRes.text();
  return adapter.parse(html, targetUrl);
}
