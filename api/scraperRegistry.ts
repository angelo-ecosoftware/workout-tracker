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

  // Check direct kcal / kc occurrence in the table section
  const fullKcalMatch =
    tableSection.match(/(\d+(?:[.,]\d+)?)\s*(?:kcal|kc\b)/i) ||
    tableSection.match(/(?:kcal|kc\b)\s*(\d+(?:[.,]\d+)?)/i);
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
      let m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(?:kcal|kc\b)/);
      if (!m) m = cleaned.match(/(?:kcal|kc\b)\s*(\d+(?:[.,]\d+)?)/);
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

      // Handle Schema.org array or @graph nodes
      const nodes = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed['@graph'])
        ? parsed['@graph']
        : [parsed];

      for (const node of nodes) {
        if (node.name && typeof node.name === 'string' && (node['@type'] === 'Product' || !title || title === 'Product')) {
          title = node.name
            .replace(/\s*bestellen\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
            .replace(/\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
            .trim();
        }
        if (node.brand) {
          if (typeof node.brand === 'string') brand = node.brand;
          else if (node.brand?.name) brand = node.brand.name;
        }
      }
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
// Helper: Parse Dirk.nl Nuxt 3 devalue payload
// -------------------------------------------------------------
export function parseDirkNuxtNutrition(html: string): {
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

  const idx = html.indexOf('__NUXT_DATA__');
  if (idx !== -1) {
    try {
      const openClose = html.indexOf('>', idx);
      const scriptEnd = html.indexOf('</script>', openClose);
      const jsonStr = html.slice(openClose + 1, scriptEnd).trim();
      const data = JSON.parse(jsonStr);

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item && typeof item === 'object' && item.nutritionalValues !== undefined) {
            const rowIndices = data[item.nutritionalValues];
            if (Array.isArray(rowIndices)) {
              rowIndices.forEach((rIdx: number) => {
                const r = data[rIdx];
                if (r && typeof r === 'object') {
                  const label = String(data[r.text] || '').toLowerCase();
                  const valStr = String(data[r.value] || '').replace(',', '.');
                  const val = parseFloat(valStr) || 0;

                  if (label.includes('energie') && (label.includes('kcal') || label.includes('kilocalorie'))) {
                    kcalPer100g = val;
                  } else if (label.startsWith('vetten') || label.startsWith('vet')) {
                    fatPer100g = val;
                  } else if (label.startsWith('koolhydraten')) {
                    carbsPer100g = val;
                  } else if (label.includes('suikers') || label.startsWith('suiker')) {
                    sugarPer100g = val;
                  } else if (label.includes('vezel')) {
                    fiberPer100g = val;
                  } else if (label.startsWith('eiwit')) {
                    proteinPer100g = val;
                  }
                }
              });
            }
          }
        });
      }
    } catch (e) {}
  }

  return { kcalPer100g, proteinPer100g, carbsPer100g, sugarPer100g, fatPer100g, fiberPer100g };
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
// ADAPTER 3: Dirk van den Broek (dirk.nl)
// -------------------------------------------------------------
export const dirkAdapter: StoreScraperAdapter = {
  name: 'Dirk',
  canHandle(url: string) {
    return url.toLowerCase().includes('dirk.nl');
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand } = extractSchemaAndHeadings(html, 'Dirk');
    let nutrition = parseDirkNuxtNutrition(html);

    // Fallback to table if not in Nuxt state
    if (!nutrition.kcalPer100g && !nutrition.proteinPer100g) {
      nutrition = parseDutchNutritionTable(html);
    }

    const dirkIdMatch = url.match(/\/(\d+)(?:[/?#]|$)/) || url.match(/boodschappen\/([^/?#]+)/i);
    const productId = dirkIdMatch ? `dirk_${dirkIdMatch[1]}` : `dirk_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank');

    return {
      id: productId,
      name: title,
      brand: brand || 'Dirk',
      servingUnit: isDrink ? 'ml' : 'gram',
      ...nutrition,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// ADAPTER 4: PLUS Supermarkt (plus.nl)
// -------------------------------------------------------------
export const plusAdapter: StoreScraperAdapter = {
  name: 'PLUS',
  canHandle(url: string) {
    return url.toLowerCase().includes('plus.nl');
  },
  normalizeUrl(rawUrl: string) {
    const clean = rawUrl.trim().split('?')[0];
    return `https://www.plus.nl/ECOP_HotCache_Eng/rest/ResourceManagement/Preload?url=${encodeURIComponent(clean)}`;
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand } = extractSchemaAndHeadings(html, 'PLUS');
    const nutrition = parseDutchNutritionTable(html);

    const plusIdMatch = url.match(/-(\d+)(?:[/?#]|$)/) || url.match(/product\/([^/?#]+)/i);
    const productId = plusIdMatch ? `plus_${plusIdMatch[1]}` : `plus_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank') ||
      title.toLowerCase().includes('sap');

    return {
      id: productId,
      name: title,
      brand: brand || 'PLUS',
      servingUnit: isDrink ? 'ml' : 'gram',
      ...nutrition,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// ADAPTER 5: Generic Fallback (Aldi, Lidl, etc.)
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
// (Easily register future stores here: Jumbo, AH, Dirk, Plus, etc.)
// -------------------------------------------------------------
export const STORE_SCRAPERS: StoreScraperAdapter[] = [
  jumboAdapter,
  albertHeijnAdapter,
  dirkAdapter,
  plusAdapter,
  genericAdapter,
];

/**
 * Parse product info directly from HTML using appropriate adapter
 */
export function scrapeProductFromHtml(html: string, rawUrl: string): ProductScraperResult {
  const adapter = STORE_SCRAPERS.find((s) => s.canHandle(rawUrl)) || genericAdapter;
  return adapter.parse(html, rawUrl);
}

/**
 * Resolve target URL and scrape product info dynamically.
 * If direct fetch is blocked by store bot protections (e.g. 403 on Vercel/AWS datacenter IPs),
 * automatically fallback to high-availability reader proxies.
 */
export async function scrapeProductFromUrl(rawUrl: string): Promise<ProductScraperResult> {
  const adapter = STORE_SCRAPERS.find((s) => s.canHandle(rawUrl)) || genericAdapter;
  const targetUrl = adapter.normalizeUrl ? adapter.normalizeUrl(rawUrl) : rawUrl.trim();

  let html = '';
  let lastStatus = 0;

  // 1. Direct fetch with realistic browser headers
  try {
    const pageRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    lastStatus = pageRes.status;
    if (pageRes.ok) {
      html = await pageRes.text();
    }
  } catch (err) {
    console.warn(`Direct fetch failed for ${targetUrl}:`, err);
  }

  // 2. Fallback to Jina Reader proxy if blocked (403, 429, 503) or failed
  if (!html && (lastStatus === 403 || lastStatus === 429 || lastStatus === 503 || lastStatus === 0)) {
    try {
      const jinaRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: {
          Accept: 'text/html, text/plain',
          'X-Return-Format': 'html',
        },
      });
      if (jinaRes.ok) {
        html = await jinaRes.text();
      }
    } catch (jinaErr) {
      console.warn(`Fallback proxy fetch failed for ${targetUrl}:`, jinaErr);
    }
  }

  if (!html) {
    throw new Error(`Could not load ${adapter.name} product page (status ${lastStatus})`);
  }

  return adapter.parse(html, targetUrl);
}
