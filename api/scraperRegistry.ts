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
  packageWeightGrams?: number;
  pieceCount?: number;
  barcode?: string;
}

export interface StoreScraperAdapter {
  name: string;
  canHandle(url: string): boolean;
  normalizeUrl?(url: string): string;
  parse(html: string, url: string): ProductScraperResult;
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// Helper: Parse standard Dutch nutritional table (Voedingswaarden)
// Supports both HTML <table> and Markdown table formats (| Key | Val |)
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

  let start = html.indexOf('Voedingswaarden');
  if (start === -1) {
    start = html.indexOf('Voedingswaarde');
  }
  if (start === -1) {
    start = html.toLowerCase().indexOf('voedingswaarde');
  }
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

  // Support both HTML <tr> tags and Markdown table rows (| ... | ... |)
  const rows = tableSection.includes('</tr>')
    ? tableSection.split(/<\/tr>/i)
    : tableSection.split(/\r?\n/);

  for (const r of rows) {
    const cleaned = r
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/^\||\|$/g, '')
      .replace(/\|/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    if (!cleaned) continue;

    if (!kcalPer100g && (cleaned.startsWith('energie') || cleaned.includes('energie')) && !cleaned.includes('referentie')) {
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
// Helper: Detect anti-bot challenge pages and error titles
// -------------------------------------------------------------
const BLOCKED_PAGE_INDICATORS = [
  'access denied',
  'attention required',
  'just a moment',
  'security check',
  '403 forbidden',
  'cloudflare',
  'robot or human',
  'shieldsquare',
  'datadome',
  'blocked',
  'enable javascript and cookies',
];

export function isBlockedOrErrorTitle(title: string): boolean {
  if (!title) return true;
  const clean = title.toLowerCase().trim();
  return BLOCKED_PAGE_INDICATORS.some((ind) => clean.includes(ind));
}

// -------------------------------------------------------------
// Helper: Extract JSON-LD, H1, and Markdown title/brand fallbacks
// -------------------------------------------------------------
export function extractSchemaAndHeadings(
  html: string,
  defaultBrand: string
): { title: string; brand: string; barcode?: string; packageWeightGrams?: number } {
  let title = 'Product';
  let brand = defaultBrand;
  let barcode: string | undefined;
  let packageWeightGrams: number | undefined;

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
          const candidateTitle = node.name
            .replace(/\s*bestellen\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
            .replace(/\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
            .trim();
          if (!isBlockedOrErrorTitle(candidateTitle)) {
            title = candidateTitle;
          }
        }
        if (node.brand) {
          if (typeof node.brand === 'string') brand = node.brand;
          else if (node.brand?.name) brand = node.brand.name;
        }
        if (node.gtin13 || node.gtin8 || node.gtin14 || node.gtin) {
          barcode = String(node.gtin13 || node.gtin8 || node.gtin14 || node.gtin).trim();
        }
        if (node.weight?.value && typeof node.weight.value === 'string') {
          const wtMatch = node.weight.value.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram)\b/i);
          if (wtMatch) {
            packageWeightGrams = Math.round(parseFloat(wtMatch[1].replace(',', '.')));
          } else {
            const kgMatch = node.weight.value.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
            if (kgMatch) {
              packageWeightGrams = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
            }
          }
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
    if (rawH1 && rawH1.length > 2 && !rawH1.toLowerCase().includes('helaas') && !isBlockedOrErrorTitle(rawH1)) {
      title = rawH1
        .replace(/\s*bestellen\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
        .replace(/\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
        .trim();
    }
  }

  // Markdown Title fallback from Jina proxy output (e.g. "Title: De Zaanse Hoeve Goudse belegen...")
  if (!title || title === 'Product') {
    const mdTitleMatch = html.match(/^Title:\s*([^\r\n]+)/m);
    if (mdTitleMatch) {
      const rawTitle = mdTitleMatch[1]
        .replace(/\s*bestellen\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
        .replace(/\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
        .trim();
      if (rawTitle && rawTitle.length > 2 && !rawTitle.toLowerCase().includes('helaas') && !isBlockedOrErrorTitle(rawTitle)) {
        title = rawTitle;
      }
    }
  }

  // Clean redundant store prefixes from the title
  title = title
    .replace(/^(AH|Albert Heijn|Jumbo|PLUS|Dirk)\s+/i, '')
    .trim();

  return { title, brand, barcode, packageWeightGrams };
}

// -------------------------------------------------------------
// Helper: Extract package sizing / piece count from title & html
// -------------------------------------------------------------
export function extractPackageSizing(
  title: string,
  html: string
): { packageWeightGrams?: number; pieceCount?: number } {
  let packageWeightGrams: number | undefined;
  let pieceCount: number | undefined;

  const targetText = `${title} ${html.slice(0, 4000)}`;

  // Match e.g. "200 g", "800g", "1 kg", "1.5 kg", "500 ml", "1 l"
  const kgMatch = targetText.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
  if (kgMatch) {
    packageWeightGrams = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
  } else {
    const gMatch = targetText.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram)\b/i);
    if (gMatch) {
      packageWeightGrams = parseFloat(gMatch[1].replace(',', '.'));
    } else {
      const literMatch = targetText.match(/(\d+(?:[.,]\d+)?)\s*(?:l|liter)\b/i);
      if (literMatch) {
        packageWeightGrams = Math.round(parseFloat(literMatch[1].replace(',', '.')) * 1000);
      } else {
        const mlMatch = targetText.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|milliliter)\b/i);
        if (mlMatch) {
          packageWeightGrams = parseFloat(mlMatch[1].replace(',', '.'));
        }
      }
    }
  }

  // Match piece count e.g. "2 stuks", "1 stuk", "4x", "6 pack"
  const piecesMatch = targetText.match(/(\d+)\s*(?:stuks|stuk|pack|porties)\b/i);
  if (piecesMatch) {
    pieceCount = parseInt(piecesMatch[1], 10);
  }

  return { packageWeightGrams, pieceCount };
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
        data.forEach((item: Record<string, unknown>) => {
          if (item && typeof item === 'object' && item.nutritionalValues !== undefined) {
            const rowIndices = data[item.nutritionalValues as number];
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
const JUMBO_API_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'nl-NL,nl;q=0.9',
};

/**
 * Direct search & mobile API endpoint fallback for Jumbo products.
 * Uses Jumbo search/mobile backend queries to retrieve clean JSON product payloads.
 */
export async function fetchJumboMobileProduct(skuOrQuery: string, sourceUrl: string): Promise<ProductScraperResult | null> {
  const cleanTerm = skuOrQuery.replace(/^jumbo_/i, '').trim();
  if (!cleanTerm) return null;

  try {
    const apiUrl = `https://mobileapi.jumbo.com/v17/search?q=${encodeURIComponent(cleanTerm)}&offset=0&limit=5`;
    const res = await fetch(apiUrl, {
      headers: JUMBO_API_HEADERS,
    });

    if (!res.ok) return null;
    const data = await res.json();
    const products = data.products?.data || [];
    if (!products.length) return null;

    const p = products[0];
    const title = p.title || 'Jumbo Product';
    const brand = p.brand?.name || 'Jumbo';
    const cleanTitle = title.replace(/^Jumbo(?:'s)?\s+/i, '').trim();

    // Sizing
    let packageWeightGrams: number | undefined;
    const quantityStr = p.quantity || p.subtitle || '';
    if (quantityStr) {
      const gMatch = quantityStr.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|ml)\b/i);
      if (gMatch) {
        packageWeightGrams = Math.round(parseFloat(gMatch[1].replace(',', '.')));
      } else {
        const kgMatch = quantityStr.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
        if (kgMatch) {
          packageWeightGrams = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
        }
      }
    }

    // Nutrition values
    let kcalPer100g = 0;
    let proteinPer100g = 0;
    let carbsPer100g = 0;
    let sugarPer100g = 0;
    let fatPer100g = 0;
    let fiberPer100g = 0;

    const nutriments = p.nutritionalInformation || [];
    for (const n of nutriments) {
      const name = (n.name || n.type || '').toLowerCase();
      const val = parseFloat(String(n.value || n.amount || '').replace(',', '.')) || 0;
      if (name.includes('energie') || name.includes('kcal')) kcalPer100g = Math.round(val);
      else if (name.startsWith('eiwit')) proteinPer100g = val;
      else if (name.startsWith('koolhydrat')) carbsPer100g = val;
      else if (name.includes('suiker')) sugarPer100g = val;
      else if (name.startsWith('vet')) fatPer100g = val;
      else if (name.includes('vezel')) fiberPer100g = val;
    }

    const isDrink =
      quantityStr.toLowerCase().includes('ml') ||
      quantityStr.toLowerCase().includes('liter') ||
      cleanTitle.toLowerCase().includes('melk') ||
      cleanTitle.toLowerCase().includes('drank') ||
      cleanTitle.toLowerCase().includes('sap');

    return {
      id: `jumbo_${p.id || cleanTerm}`,
      name: cleanTitle || title,
      brand,
      barcode: p.ean || p.gtin,
      servingUnit: isDrink ? 'ml' : 'gram',
      kcalPer100g,
      proteinPer100g,
      carbsPer100g,
      sugarPer100g,
      fatPer100g,
      fiberPer100g,
      packageWeightGrams,
      sourceUrl: sourceUrl || `https://www.jumbo.com/producten/${p.id}`,
    };
  } catch (err) {
    console.warn('Jumbo Mobile API fetch attempt failed:', err);
    return null;
  }
}

export const jumboAdapter: StoreScraperAdapter = {
  name: 'Jumbo',
  canHandle(url: string) {
    return url.toLowerCase().includes('jumbo.com');
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand } = extractSchemaAndHeadings(html, 'Jumbo');
    const nutrition = parseDutchNutritionTable(html);
    const sizing = extractPackageSizing(title, html);

    const jumboIdMatch = url.match(/-(\d+)[a-z]*(?:[/?#]|$)/i) || url.match(/-([0-9A-Z]+)$/i) || url.match(/producten\/([^/?#]+)/i);
    const rawId = jumboIdMatch ? jumboIdMatch[1].replace(/[a-z]+$/i, '') : `${Date.now()}`;
    const productId = `jumbo_${rawId}`;

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
      ...sizing,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// ADAPTER 2: Albert Heijn
// -------------------------------------------------------------
const AH_API_HEADERS = {
  'Host': 'api.ah.nl',
  'x-application': 'AHWEBSHOP',
  'user-agent': 'Appie/8.8.2 Model/phone Android/7.0-API24',
  'content-type': 'application/json; charset=UTF-8',
};

/**
 * Direct fetch from Albert Heijn Mobile Services API using Webshop / Item ID (wi...)
 * Completely avoids Cloudflare / Bot protection on web pages.
 */
export async function fetchAlbertHeijnMobileProduct(webshopId: string, sourceUrl: string): Promise<ProductScraperResult | null> {
  const cleanId = webshopId.replace(/^wi/i, '').trim();
  if (!cleanId) return null;

  try {
    const authRes = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
      method: 'POST',
      headers: AH_API_HEADERS,
      body: JSON.stringify({ clientId: 'appie' }),
    });

    if (!authRes.ok) return null;
    const authData = (await authRes.json()) as { access_token?: string };
    const access_token = authData?.access_token;
    if (!access_token) return null;

    // Fetch product details
    const firRes = await fetch(`https://api.ah.nl/mobile-services/product/detail/v4/fir/${cleanId}`, {
      headers: {
        ...AH_API_HEADERS,
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!firRes.ok) return null;
    const firData = await firRes.json();
    if (!firData || typeof firData !== 'object') return null;

    const title = firData.productCard?.title || firData.tradeItem?.description || 'AH Product';
    const brand = firData.productCard?.brand || 'AH';
    const cleanTitle = title.replace(/^AH\s+/i, '').trim();

    const salesUnitSize = firData.productCard?.salesUnitSize || '';
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

    let kcalPer100g = 0;
    let proteinPer100g = 0;
    let carbsPer100g = 0;
    let sugarPer100g = 0;
    let fatPer100g = 0;
    let fiberPer100g = 0;

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

    const isDrink =
      salesUnitSize.toLowerCase().includes('ml') ||
      salesUnitSize.toLowerCase().includes('liter') ||
      cleanTitle.toLowerCase().includes('melk') ||
      cleanTitle.toLowerCase().includes('drank');

    return {
      id: `ah_wi${cleanId}`,
      name: cleanTitle || title,
      brand,
      barcode: firData.tradeItem?.gtin,
      servingUnit: isDrink ? 'ml' : 'gram',
      kcalPer100g,
      proteinPer100g,
      carbsPer100g,
      sugarPer100g,
      fatPer100g,
      fiberPer100g,
      packageWeightGrams,
      sourceUrl,
    };
  } catch (err) {
    console.warn('AH Mobile API fetch error for product link:', err);
    return null;
  }
}

/**
 * Direct search endpoint fallback for Albert Heijn products.
 * Queries AH mobile/web search endpoint by keyword/query to resolve the product if the direct page is blocked.
 */
export async function searchAlbertHeijnProduct(query: string, sourceUrl: string): Promise<ProductScraperResult | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  try {
    const authRes = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
      method: 'POST',
      headers: AH_API_HEADERS,
      body: JSON.stringify({ clientId: 'appie' }),
    });

    if (!authRes.ok) return null;
    const authData = (await authRes.json()) as { access_token?: string };
    const access_token = authData?.access_token;
    if (!access_token) return null;

    const searchUrl = `https://api.ah.nl/mobile-services/product/search/v2?query=${encodeURIComponent(cleanQuery)}&size=3`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        ...AH_API_HEADERS,
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const products = searchData.products || [];
    if (!products.length) return null;

    const first = products[0];
    const webshopId = first.webshopId || first.id;
    if (webshopId) {
      return await fetchAlbertHeijnMobileProduct(String(webshopId), sourceUrl || `https://www.ah.nl/producten/product/wi${webshopId}`);
    }
    return null;
  } catch (err) {
    console.warn('AH Store Search Endpoint lookup failed:', err);
    return null;
  }
}

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
    const { title, brand, barcode, packageWeightGrams } = extractSchemaAndHeadings(html, 'AH');
    const nutrition = parseDutchNutritionTable(html);
    const sizing = extractPackageSizing(title, html);

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
      barcode,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...nutrition,
      packageWeightGrams: packageWeightGrams || sizing.packageWeightGrams,
      pieceCount: sizing.pieceCount,
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
    const sizing = extractPackageSizing(title, html);

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
      ...sizing,
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
    const sizing = extractPackageSizing(title, html);

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
      ...sizing,
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
    const sizing = extractPackageSizing(title, html);

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
      ...sizing,
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
      const pageText = await pageRes.text();
      // Only accept if not a bot block page
      if (!isBlockedOrErrorTitle(pageText.slice(0, 500))) {
        html = pageText;
      }
    }
  } catch (err) {
    console.warn(`Direct fetch failed for ${targetUrl}:`, err);
  }

  // 2. Fallback: If AH web fetch was blocked (e.g. 403 / challenge), attempt AH Mobile Services API via wi... ID or Search Endpoint
  if (!html && adapter.name === 'Albert Heijn') {
    const wiMatch = targetUrl.match(/wi(\d+)/i);
    if (wiMatch) {
      try {
        const mobileResult = await fetchAlbertHeijnMobileProduct(wiMatch[1], targetUrl);
        if (
          mobileResult &&
          !isBlockedOrErrorTitle(mobileResult.name) &&
          (mobileResult.kcalPer100g > 0 || mobileResult.proteinPer100g > 0)
        ) {
          return mobileResult;
        }
      } catch (ahApiErr) {
        console.warn('AH Mobile API fallback attempt failed:', ahApiErr);
      }
    }

    // Secondary AH fallback: Search Endpoint with slug keywords
    try {
      const slugMatch = targetUrl.match(/producten\/product\/wi\d+\/([a-z0-9-]+)/i) || targetUrl.match(/producten\/([^/?#]+)/i);
      const query = slugMatch ? slugMatch[1].replace(/-/g, ' ') : '';
      if (query) {
        const searchResult = await searchAlbertHeijnProduct(query, targetUrl);
        if (
          searchResult &&
          !isBlockedOrErrorTitle(searchResult.name) &&
          (searchResult.kcalPer100g > 0 || searchResult.proteinPer100g > 0)
        ) {
          return searchResult;
        }
      }
    } catch (ahSearchErr) {
      console.warn('AH Search fallback attempt failed:', ahSearchErr);
    }
  }

  // 3. Fallback: If Jumbo web fetch was blocked (e.g. 403 / challenge), attempt Jumbo Mobile/Search API
  if (!html && adapter.name === 'Jumbo') {
    const jumboIdMatch = targetUrl.match(/-(\d+)[a-z]*(?:[/?#]|$)/i) || targetUrl.match(/-([0-9A-Z]+)$/i) || targetUrl.match(/producten\/([^/?#]+)/i);
    const sku = jumboIdMatch ? jumboIdMatch[1] : '';
    if (sku) {
      try {
        const jumboMobileResult = await fetchJumboMobileProduct(sku, targetUrl);
        if (
          jumboMobileResult &&
          !isBlockedOrErrorTitle(jumboMobileResult.name) &&
          (jumboMobileResult.kcalPer100g > 0 || jumboMobileResult.proteinPer100g > 0)
        ) {
          return jumboMobileResult;
        }
      } catch (jumboApiErr) {
        console.warn('Jumbo Mobile API fallback attempt failed:', jumboApiErr);
      }
    }
  }

  // 4. Fallback to Jina Reader proxy if blocked (403, 429, 503) or failed
  if (!html && (lastStatus === 403 || lastStatus === 429 || lastStatus === 503 || lastStatus === 0 || !html)) {
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
    throw new Error(`Could not load ${adapter.name} product page. The store blocked automated access or the page is unavailable.`);
  }

  const parsed = adapter.parse(html, targetUrl);

  // 4. Strict Validation Gate: Check for bot block titles or invalid parses
  if (isBlockedOrErrorTitle(parsed.name)) {
    throw new Error(`Could not resolve ${adapter.name} product. The store returned an access challenge or restricted page.`);
  }

  return parsed;
}
