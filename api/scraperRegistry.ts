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
export function sanitizeNutritionMacros(nut: {
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
}): {
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
} {
  let protein = Math.max(0, Math.round(Number(nut.proteinPer100g || 0) * 10) / 10);
  let carbs = Math.max(0, Math.round(Number(nut.carbsPer100g || 0) * 10) / 10);
  let sugar = Math.max(0, Math.round(Number(nut.sugarPer100g || 0) * 10) / 10);
  let fat = Math.max(0, Math.round(Number(nut.fatPer100g || 0) * 10) / 10);
  let fiber = Math.max(0, Math.round(Number(nut.fiberPer100g || 0) * 10) / 10);
  let kcal = Math.max(0, Math.round(Number(nut.kcalPer100g || 0)));

  // If sugar exceeds carbs due to retail table parsing anomaly, clamp sugar
  if (sugar > carbs) {
    sugar = carbs;
  }

  // Calculate expected kcal from Atwater factors: 4 kcal/g protein, 4 kcal/g carb, 9 kcal/g fat, 2 kcal/g fiber
  const computedAtwaterKcal = Math.round((protein * 4) + (carbs * 4) + (fat * 9) + (fiber * 2));

  // If kcal is 0 but macros exist, synthesize kcal from Atwater calculation
  if (kcal === 0 && (protein > 0 || carbs > 0 || fat > 0)) {
    kcal = computedAtwaterKcal;
  } else if (kcal > 0 && (protein > 0 || carbs > 0 || fat > 0)) {
    // If reported kcal deviates wildly (>60%) from Atwater calculation, normalize towards calculated
    const deviation = Math.abs(kcal - computedAtwaterKcal);
    if (computedAtwaterKcal > 20 && deviation > computedAtwaterKcal * 0.6) {
      kcal = computedAtwaterKcal;
    }
  }

  return {
    kcalPer100g: kcal,
    proteinPer100g: protein,
    carbsPer100g: carbs,
    sugarPer100g: sugar,
    fatPer100g: fat,
    fiberPer100g: fiber,
  };
}

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
// Helper: Detect anti-bot challenge pages, 404s, and error titles
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
  'deze pagina bestaat niet',
  'pagina niet gevonden',
  'page not found',
  'niet meer beschikbaar',
  'product niet gevonden',
  'helaas, deze pagina',
  'geen resultaten gevonden',
  '404 niet gevonden',
  'onbekend product',
  'unknown product',
  'winkelmandje',
  'winkelmand',
  'inloggen',
  'mijn lijst',
  'gedeelde lijst',
  'shopping list',
  'cart',
  'basket',
];

export function isBlockedOrErrorTitle(title: string): boolean {
  if (!title) return true;
  const clean = title.toLowerCase().trim();
  if (
    clean === 'product' ||
    clean === 'unknown' ||
    clean === 'null' ||
    clean === 'undefined' ||
    clean === 'ah product' ||
    clean === 'jumbo product' ||
    clean === 'dirk product' ||
    clean === 'plus product' ||
    clean === 'winkelmandje' ||
    clean === 'winkelmand' ||
    clean === 'inloggen' ||
    clean === 'mijn lijst' ||
    clean === 'gedeelde lijst' ||
    clean === 'albert heijn' ||
    clean === 'ah' ||
    clean === 'jumbo' ||
    clean === 'dirk' ||
    clean === 'plus' ||
    clean === 'lidl' ||
    clean === 'aldi' ||
    clean === 'picnic' ||
    clean === 'hoogvliet' ||
    clean === 'spar'
  ) {
    return true;
  }
  return BLOCKED_PAGE_INDICATORS.some((ind) => clean.includes(ind));
}

// -------------------------------------------------------------
// Helper: Extract JSON-LD, H1, and Markdown title/brand fallbacks
// Supports both Schema.org 'Product' and 'Recipe' structured data
// -------------------------------------------------------------
export function extractSchemaAndHeadings(
  html: string,
  defaultBrand: string
): {
  title: string;
  brand: string;
  barcode?: string;
  packageWeightGrams?: number;
  pieceCount?: number;
  nutrition?: {
    kcalPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    sugarPer100g: number;
    fatPer100g: number;
    fiberPer100g: number;
  };
} {
  let title = '';
  let brand = defaultBrand;
  let barcode: string | undefined;
  let packageWeightGrams: number | undefined;
  let pieceCount: number | undefined;
  let nutrition:
    | {
        kcalPer100g: number;
        proteinPer100g: number;
        carbsPer100g: number;
        sugarPer100g: number;
        fatPer100g: number;
        fiberPer100g: number;
      }
    | undefined;

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
        const typeStr = Array.isArray(node['@type']) ? node['@type'].join(' ') : String(node['@type'] || '');
        const isProductOrRecipe = typeStr.includes('Product') || typeStr.includes('Recipe');

        if (node.name && typeof node.name === 'string' && (isProductOrRecipe || !title)) {
          const candidateTitle = node.name
            .replace(/\s*bestellen\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
            .replace(/\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
            .trim();
          if (!isBlockedOrErrorTitle(candidateTitle)) {
            title = candidateTitle;
          }
        }

        // Extract Brand or Author / Publisher for Recipes
        if (node.brand) {
          if (typeof node.brand === 'string') brand = node.brand;
          else if (node.brand?.name) brand = node.brand.name;
        } else if (node.author) {
          if (typeof node.author === 'string') brand = node.author;
          else if (node.author?.name) brand = node.author.name;
          else if (Array.isArray(node.author) && node.author[0]?.name) brand = node.author[0].name;
        } else if (node.publisher?.name) {
          brand = node.publisher.name;
        }

        if (node.gtin13 || node.gtin8 || node.gtin14 || node.gtin) {
          barcode = String(node.gtin13 || node.gtin8 || node.gtin14 || node.gtin).trim();
        }

        // Extract package weight if available
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

        // Extract Recipe servings / yield e.g. "4 porties", "4 servings", 4
        const yieldVal = node.recipeYield || node.yield;
        if (yieldVal) {
          if (typeof yieldVal === 'number') {
            pieceCount = yieldVal;
          } else if (typeof yieldVal === 'string') {
            const yMatch = yieldVal.match(/(\d+)/);
            if (yMatch) pieceCount = parseInt(yMatch[1], 10);
          } else if (Array.isArray(yieldVal) && yieldVal[0]) {
            const yMatch = String(yieldVal[0]).match(/(\d+)/);
            if (yMatch) pieceCount = parseInt(yMatch[1], 10);
          }
        }

        // Extract Schema.org NutritionInformation (calories, proteinContent, carbs, etc.)
        if (node.nutrition && typeof node.nutrition === 'object') {
          const nutObj = node.nutrition as Record<string, unknown>;
          const parseNutVal = (val: unknown): number => {
            if (typeof val === 'number') return val;
            if (typeof val === 'string') {
              const m = val.match(/(\d+(?:[.,]\d+)?)/);
              if (m) return parseFloat(m[1].replace(',', '.'));
            }
            return 0;
          };

          const kcal = parseNutVal(nutObj.calories);
          const prot = parseNutVal(nutObj.proteinContent);
          const carbs = parseNutVal(nutObj.carbohydrateContent);
          const sugar = parseNutVal(nutObj.sugarContent);
          const fat = parseNutVal(nutObj.fatContent);
          const fib = parseNutVal(nutObj.fiberContent);

          if (kcal > 0 || prot > 0 || carbs > 0 || fat > 0) {
            nutrition = {
              kcalPer100g: kcal,
              proteinPer100g: prot,
              carbsPer100g: carbs,
              sugarPer100g: sugar,
              fatPer100g: fat,
              fiberPer100g: fib,
            };
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

  // HTML <title> tag fallback
  if (!title) {
    const docTitleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (docTitleMatch) {
      const rawDocTitle = docTitleMatch[1]
        .replace(/\s*bestellen\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
        .replace(/\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
        .replace(/\s*-\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/i, '')
        .trim();
      if (rawDocTitle && rawDocTitle.length > 2 && !isBlockedOrErrorTitle(rawDocTitle)) {
        title = rawDocTitle;
      }
    }
  }

  // Markdown Title fallback from Jina proxy output (e.g. "Title: De Zaanse Hoeve Goudse belegen...")
  if (!title) {
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

  return { title, brand, barcode, packageWeightGrams, pieceCount, nutrition };
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

  // Prioritize checking the title first for sizing tokens (e.g. "1L", "500g", "1 kg")
  const titleText = title || '';
  const bodySnippet = html ? html.slice(0, 2000) : '';

  const parseWeightFrom = (text: string): number | undefined => {
    const kg = text.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
    if (kg) return Math.round(parseFloat(kg[1].replace(',', '.')) * 1000);

    const liter = text.match(/(\d+(?:[.,]\d+)?)\s*(?:l|liter)\b/i);
    if (liter) return Math.round(parseFloat(liter[1].replace(',', '.')) * 1000);

    const ml = text.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|milliliter)\b/i);
    if (ml) return parseFloat(ml[1].replace(',', '.'));

    const g = text.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram)\b/i);
    if (g) return parseFloat(g[1].replace(',', '.'));

    return undefined;
  };

  packageWeightGrams = parseWeightFrom(titleText) || parseWeightFrom(bodySnippet);

  // Match piece count e.g. "2 stuks", "1 stuk", "4x", "6 pack"
  const targetText = `${titleText} ${bodySnippet}`;
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
export async function fetchJumboMobileProduct(skuOrQuery: string, sourceUrl = ''): Promise<ProductScraperResult | null> {
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
    const title = p.title?.trim() || '';
    if (!title || isBlockedOrErrorTitle(title)) return null;
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

/**
 * Direct search endpoint fallback for Jumbo products.
 * Searches Jumbo by keyword/slug when a direct product link has expired or returns a 404.
 */
export async function searchJumboProduct(query: string, sourceUrl: string): Promise<ProductScraperResult | null> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return null;

  try {
    const searchUrl = `https://www.jumbo.com/producten/?searchType=keyword&searchTerms=${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    const productMatches = [...html.matchAll(/href=["'](\/producten\/[a-z0-9-]+-([0-9]+[a-z0-9]*))["']/gi)];
    if (productMatches.length > 0) {
      const bestMatchPath = productMatches[0][1];
      const bestMatchUrl = `https://www.jumbo.com${bestMatchPath}`;
      const prodRes = await fetch(bestMatchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'nl-NL,nl;q=0.9',
        },
      });
      if (prodRes.ok) {
        const prodHtml = await prodRes.text();
        const parsed = jumboAdapter.parse(prodHtml, bestMatchUrl);
        if (parsed && !isBlockedOrErrorTitle(parsed.name)) {
          return {
            ...parsed,
            sourceUrl: bestMatchUrl,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Jumbo search fallback error:', err);
  }
  return null;
}

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
export async function fetchAlbertHeijnMobileProduct(webshopId: string, sourceUrl = ''): Promise<ProductScraperResult | null> {
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

    const title = firData.productCard?.title || firData.tradeItem?.description || '';
    if (!title || isBlockedOrErrorTitle(title)) return null;
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
export async function searchAlbertHeijnProduct(query: string, sourceUrl = ''): Promise<ProductScraperResult | null> {
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
// ADAPTER 5: Lidl Nederland (lidl.nl)
// -------------------------------------------------------------
export const lidlAdapter: StoreScraperAdapter = {
  name: 'Lidl',
  canHandle(url: string) {
    return url.toLowerCase().includes('lidl.nl');
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand, barcode, packageWeightGrams } = extractSchemaAndHeadings(html, 'Lidl');
    const nutrition = parseDutchNutritionTable(html);
    const sizing = extractPackageSizing(title, html);

    const lidlIdMatch = url.match(/\/p\/([a-z0-9-]+)(?:[/?#]|$)/i) || url.match(/p(\d+)/i);
    const productId = lidlIdMatch ? `lidl_${lidlIdMatch[1]}` : `lidl_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank') ||
      title.toLowerCase().includes('sap');

    return {
      id: productId,
      name: title,
      brand: brand || 'Lidl',
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
// ADAPTER 6: Aldi Nederland (aldi.nl)
// -------------------------------------------------------------
export const aldiAdapter: StoreScraperAdapter = {
  name: 'Aldi',
  canHandle(url: string) {
    return url.toLowerCase().includes('aldi.nl');
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand, barcode, packageWeightGrams } = extractSchemaAndHeadings(html, 'Aldi');
    const nutrition = parseDutchNutritionTable(html);
    const sizing = extractPackageSizing(title, html);

    const aldiIdMatch = url.match(/producten\/([^/?#]+)/i) || url.match(/\/p\/([^/?#]+)/i);
    const productId = aldiIdMatch ? `aldi_${aldiIdMatch[1]}` : `aldi_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank') ||
      title.toLowerCase().includes('sap');

    return {
      id: productId,
      name: title,
      brand: brand || 'Aldi',
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
// ADAPTER 7: Picnic Nederland (picnic.app)
// -------------------------------------------------------------
export const picnicAdapter: StoreScraperAdapter = {
  name: 'Picnic',
  canHandle(url: string) {
    return url.toLowerCase().includes('picnic.app') || url.toLowerCase().includes('picnic.nl');
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand, barcode, packageWeightGrams, pieceCount, nutrition: schemaNutrition } =
      extractSchemaAndHeadings(html, 'Picnic');
    const tableNutrition = parseDutchNutritionTable(html);
    const sizing = extractPackageSizing(title, html);

    const hasTableNutrition = tableNutrition.kcalPer100g > 0 || tableNutrition.proteinPer100g > 0;
    const finalNutrition = hasTableNutrition ? tableNutrition : (schemaNutrition || tableNutrition);

    const picnicIdMatch = url.match(/\/p\/([a-z0-9-]+)(?:[/?#]|$)/i) || url.match(/article\/([a-z0-9-]+)/i);
    const productId = picnicIdMatch ? `picnic_${picnicIdMatch[1]}` : `picnic_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank') ||
      title.toLowerCase().includes('sap');

    return {
      id: productId,
      name: title,
      brand: brand || 'Picnic',
      barcode,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...finalNutrition,
      packageWeightGrams: packageWeightGrams || sizing.packageWeightGrams,
      pieceCount: pieceCount || sizing.pieceCount,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// ADAPTER 8: Hoogvliet Supermarkt (hoogvliet.com)
// -------------------------------------------------------------
export const hoogvlietAdapter: StoreScraperAdapter = {
  name: 'Hoogvliet',
  canHandle(url: string) {
    return url.toLowerCase().includes('hoogvliet.com');
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand, barcode, packageWeightGrams, pieceCount, nutrition: schemaNutrition } =
      extractSchemaAndHeadings(html, 'Hoogvliet');
    const tableNutrition = parseDutchNutritionTable(html);
    const sizing = extractPackageSizing(title, html);

    const hasTableNutrition = tableNutrition.kcalPer100g > 0 || tableNutrition.proteinPer100g > 0;
    const finalNutrition = hasTableNutrition ? tableNutrition : (schemaNutrition || tableNutrition);

    const hoogvlietIdMatch = url.match(/\/product\/([a-z0-9-]+)(?:[/?#]|$)/i) || url.match(/-(\d+)(?:[/?#]|$)/i);
    const productId = hoogvlietIdMatch ? `hoogvliet_${hoogvlietIdMatch[1]}` : `hoogvliet_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank') ||
      title.toLowerCase().includes('sap');

    return {
      id: productId,
      name: title,
      brand: brand || 'Hoogvliet',
      barcode,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...finalNutrition,
      packageWeightGrams: packageWeightGrams || sizing.packageWeightGrams,
      pieceCount: pieceCount || sizing.pieceCount,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// ADAPTER 9: Spar Nederland (spar.nl)
// -------------------------------------------------------------
export const sparAdapter: StoreScraperAdapter = {
  name: 'Spar',
  canHandle(url: string) {
    return url.toLowerCase().includes('spar.nl');
  },
  parse(html: string, url: string): ProductScraperResult {
    const { title, brand, barcode, packageWeightGrams, pieceCount, nutrition: schemaNutrition } =
      extractSchemaAndHeadings(html, 'Spar');
    const tableNutrition = parseDutchNutritionTable(html);
    const sizing = extractPackageSizing(title, html);

    const hasTableNutrition = tableNutrition.kcalPer100g > 0 || tableNutrition.proteinPer100g > 0;
    const finalNutrition = hasTableNutrition ? tableNutrition : (schemaNutrition || tableNutrition);

    const sparIdMatch = url.match(/\/producten\/([a-z0-9-]+)(?:[/?#]|$)/i) || url.match(/-(\d+)(?:[/?#]|$)/i);
    const productId = sparIdMatch ? `spar_${sparIdMatch[1]}` : `spar_${Date.now()}`;

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank') ||
      title.toLowerCase().includes('sap');

    return {
      id: productId,
      name: title,
      brand: brand || 'Spar',
      barcode,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...finalNutrition,
      packageWeightGrams: packageWeightGrams || sizing.packageWeightGrams,
      pieceCount: pieceCount || sizing.pieceCount,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// ADAPTER 10: Generic Fallback & Recipe Resolver (Custom Stores & Recipe Sites)
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

    const {
      title,
      brand,
      barcode,
      packageWeightGrams,
      pieceCount,
      nutrition: schemaNutrition,
    } = extractSchemaAndHeadings(html, hostname);
    const tableNutrition = parseDutchNutritionTable(html);
    const sizing = extractPackageSizing(title, html);

    const hasTableNutrition = tableNutrition.kcalPer100g > 0 || tableNutrition.proteinPer100g > 0;
    const finalNutrition = hasTableNutrition ? tableNutrition : (schemaNutrition || tableNutrition);

    const isDrink =
      html.toLowerCase().includes('per 100 milliliter') ||
      html.toLowerCase().includes('per 100 ml') ||
      title.toLowerCase().includes('melk') ||
      title.toLowerCase().includes('drank') ||
      title.toLowerCase().includes('shake');

    return {
      id: `food_${Date.now()}`,
      name: title,
      brand,
      barcode,
      servingUnit: isDrink ? 'ml' : 'gram',
      ...finalNutrition,
      packageWeightGrams: packageWeightGrams || sizing.packageWeightGrams,
      pieceCount: pieceCount || sizing.pieceCount,
      sourceUrl: url,
    };
  },
};

// -------------------------------------------------------------
// Registry of all Store Adapters
// (Easily register future stores here: Jumbo, AH, Dirk, Plus, Lidl, Aldi, Picnic, Hoogvliet, Spar, etc.)
// -------------------------------------------------------------
export const STORE_SCRAPERS: StoreScraperAdapter[] = [
  jumboAdapter,
  albertHeijnAdapter,
  dirkAdapter,
  plusAdapter,
  lidlAdapter,
  aldiAdapter,
  picnicAdapter,
  hoogvlietAdapter,
  sparAdapter,
  genericAdapter,
];

const ALLOWED_STORE_DOMAINS = new Set([
  'ah.nl',
  'jumbo.com',
  'dirk.nl',
  'plus.nl',
  'lidl.nl',
  'aldi.nl',
  'picnic.app',
  'picnic.nl',
  'hoogvliet.com',
  'spar.nl',
]);

const PRIVATE_OR_LOCAL_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
]);

/**
 * Validates outbound scraping target URLs against SSRF (Server-Side Request Forgery).
 * Restricts egress to approved supermarket retail domains and blocks internal/private network targets.
 */
export function validateScraperTargetUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Missing or invalid target URL');
  }

  const clean = rawUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('Only HTTP/HTTPS URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block private/loopback/cloud metadata
  if (
    PRIVATE_OR_LOCAL_HOSTS.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    /^192\.168\./.test(hostname)
  ) {
    throw new Error('Access to private or local network resources is forbidden');
  }

  // Validate that domain belongs to supported supermarket stores
  const isAllowedDomain = Array.from(ALLOWED_STORE_DOMAINS).some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );

  if (!isAllowedDomain) {
    throw new Error(
      `Domain '${hostname}' is not permitted for product scraping. Allowed domains: AH, Jumbo, Dirk, Plus, Lidl, Aldi, Picnic, Hoogvliet, Spar.`
    );
  }

  return parsed.toString();
}

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
  const validatedUrl = validateScraperTargetUrl(rawUrl);
  const adapter = STORE_SCRAPERS.find((s) => s.canHandle(validatedUrl)) || genericAdapter;
  const targetUrl = adapter.normalizeUrl ? adapter.normalizeUrl(validatedUrl) : validatedUrl;

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

  // 3. Fallback: If Jumbo web fetch was blocked (404, 403, or invalid page), attempt Jumbo Mobile/Search API
  if ((!html || lastStatus === 404 || lastStatus === 403) && adapter.name === 'Jumbo') {
    const jumboIdMatch = targetUrl.match(/-(\d+)[a-z0-9]*(?:[/?#]|$)/i) || targetUrl.match(/producten\/([^/?#]+)/i);
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

    // Secondary Jumbo fallback: Search by URL slug keywords (e.g. "scharrelkip kipfilet")
    try {
      const slugMatch = targetUrl.match(/producten\/([a-z0-9-]+)/i);
      if (slugMatch) {
        const cleanQuery = slugMatch[1]
          .replace(/-\d+[a-z0-9]*$/i, '')
          .replace(/^jumbo-?/i, '')
          .replace(/-/g, ' ')
          .replace(/\bca\s*\d+\s*g\b/i, '')
          .trim();
        if (cleanQuery) {
          const jumboSearchResult = await searchJumboProduct(cleanQuery, targetUrl);
          if (
            jumboSearchResult &&
            !isBlockedOrErrorTitle(jumboSearchResult.name) &&
            (jumboSearchResult.kcalPer100g > 0 || jumboSearchResult.proteinPer100g > 0)
          ) {
            return jumboSearchResult;
          }
        }
      }
    } catch (jumboSearchErr) {
      console.warn('Jumbo Search fallback attempt failed:', jumboSearchErr);
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

  // 4. Strict Validation Gate: Check for bot block titles, 404s, or invalid parses
  if (isBlockedOrErrorTitle(parsed.name)) {
    // Attempt final keyword fallback for Jumbo if not yet resolved
    if (adapter.name === 'Jumbo') {
      const slugMatch = targetUrl.match(/producten\/([a-z0-9-]+)/i);
      if (slugMatch) {
        const cleanQuery = slugMatch[1]
          .replace(/-\d+[a-z0-9]*$/i, '')
          .replace(/^jumbo-?/i, '')
          .replace(/-/g, ' ')
          .replace(/\bca\s*\d+\s*g\b/i, '')
          .trim();
        if (cleanQuery) {
          const jumboSearchResult = await searchJumboProduct(cleanQuery, targetUrl);
          if (
            jumboSearchResult &&
            !isBlockedOrErrorTitle(jumboSearchResult.name) &&
            (jumboSearchResult.kcalPer100g > 0 || jumboSearchResult.proteinPer100g > 0)
          ) {
            return jumboSearchResult;
          }
        }
      }
    }

    throw new Error(`Could not resolve ${adapter.name} product. The product is discontinued or the page is no longer available (Page not found / 404).`);
  }

  const sanitizedMacros = sanitizeNutritionMacros({
    kcalPer100g: parsed.kcalPer100g,
    proteinPer100g: parsed.proteinPer100g,
    carbsPer100g: parsed.carbsPer100g,
    sugarPer100g: parsed.sugarPer100g,
    fatPer100g: parsed.fatPer100g,
    fiberPer100g: parsed.fiberPer100g,
  });

  return {
    ...parsed,
    ...sanitizedMacros,
  };
}
