/**
 * Pre-seeded in-store scale PLU mapping dictionary for Dutch Supermarkets (AH, Jumbo, PLUS, Dirk)
 * Maps scale barcode prefixes and internal PLU codes to official store product webshop IDs / master GTINs / search queries.
 * 
 * GS1 in-store scale barcodes start with 20-29 followed by internal PLU/article numbers (typically 4 to 6 digits) and variable price/weight digits.
 */

export interface PluProductMapping {
  plu: string;
  store: 'ah' | 'jumbo' | 'plus' | 'dirk';
  brand: string;
  name: string;
  webshopId?: string;
  searchQuery: string;
  masterGtin?: string;
}

export const BAKERY_PLU_DICTIONARY: Record<string, PluProductMapping> = {
  // Albert Heijn Fresh Bakery scale codes (e.g. 2285623001452 -> PLU candidate "285623" or "85623")
  '285623': {
    plu: '285623',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer waldkorn half',
    webshopId: '561020',
    searchQuery: 'AH Vloer waldkorn half',
    masterGtin: '08718927029937',
  },
  '85623': {
    plu: '85623',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer waldkorn half',
    webshopId: '561020',
    searchQuery: 'AH Vloer waldkorn half',
    masterGtin: '08718927029937',
  },
  '285624': {
    plu: '285624',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer waldkorn heel',
    webshopId: '562110',
    searchQuery: 'AH Vloerbrood waldkorn',
    masterGtin: '08718927029944',
  },
  '85624': {
    plu: '85624',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer waldkorn heel',
    webshopId: '562110',
    searchQuery: 'AH Vloerbrood waldkorn',
    masterGtin: '08718927029944',
  },
  '285700': {
    plu: '285700',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer tijger half',
    webshopId: '561019',
    searchQuery: 'AH Vloer tijger half',
  },
  '85700': {
    plu: '85700',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer tijger half',
    webshopId: '561019',
    searchQuery: 'AH Vloer tijger half',
  },
  '285600': {
    plu: '285600',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer volkoren half',
    webshopId: '561018',
    searchQuery: 'AH Vloer volkoren half',
  },
  '85600': {
    plu: '85600',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer volkoren half',
    webshopId: '561018',
    searchQuery: 'AH Vloer volkoren half',
  },
  '285630': {
    plu: '285630',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer meergranen half',
    webshopId: '561021',
    searchQuery: 'AH Vloer meergranen half',
  },
  '85630': {
    plu: '85630',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer meergranen half',
    webshopId: '561021',
    searchQuery: 'AH Vloer meergranen half',
  },
  '285640': {
    plu: '285640',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer spelt half',
    webshopId: '561022',
    searchQuery: 'AH Vloer spelt half',
  },
  '85640': {
    plu: '85640',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer spelt half',
    webshopId: '561022',
    searchQuery: 'AH Vloer spelt half',
  },
  '285610': {
    plu: '285610',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer mais half',
    webshopId: '561023',
    searchQuery: 'AH Vloer mais half',
  },
  '85610': {
    plu: '85610',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer mais half',
    webshopId: '561023',
    searchQuery: 'AH Vloer mais half',
  },
  '285660': {
    plu: '285660',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer wit half',
    webshopId: '561024',
    searchQuery: 'AH Vloer wit half',
  },
  '85660': {
    plu: '85660',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer wit half',
    webshopId: '561024',
    searchQuery: 'AH Vloer wit half',
  },
  '285670': {
    plu: '285670',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer bruin half',
    webshopId: '561025',
    searchQuery: 'AH Vloer bruin half',
  },
  '85670': {
    plu: '85670',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Vloer bruin half',
    webshopId: '561025',
    searchQuery: 'AH Vloer bruin half',
  },
  '285680': {
    plu: '285680',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Extra lang lekker waldkorn volkoren half',
    webshopId: '596720',
    searchQuery: 'AH Extra lang lekker waldkorn volkoren half',
  },
  '285690': {
    plu: '285690',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Extra lang lekker waldkorn eiwit half',
    webshopId: '596717',
    searchQuery: 'AH Extra lang lekker waldkorn eiwit half',
  },
  '285710': {
    plu: '285710',
    store: 'ah',
    brand: 'Albert Heijn',
    name: 'AH Zaans volkoren heel',
    webshopId: '582991',
    searchQuery: 'AH Zaans volkoren heel',
  },
};

/**
 * Extract possible PLU prefixes from GS1 variable scale barcodes (20-29 prefix)
 * More specific (longer) candidate strings are ordered first.
 */
export function extractScalePluCandidates(barcode: string): string[] {
  const clean = barcode.trim();
  // GS1 scale code format: 2[0-9] followed by PLU digits
  if (!/^(?:20|21|22|23|24|25|26|27|28|29)\d{5,11}$/.test(clean)) {
    return [];
  }

  // After 2-digit prefix (e.g. "22" in "2285623001452"), extract candidate slices
  const afterPrefix = clean.slice(2);
  const candidates: string[] = [];

  // Try 6-digit PLU with prefix digit (e.g. "285623")
  const fullPlu6 = clean.slice(1, 7); // "285623"
  candidates.push(fullPlu6);

  // Try 6-digit, 5-digit slices after prefix
  if (afterPrefix.length >= 6) candidates.push(afterPrefix.slice(0, 6)); // "856230"
  if (afterPrefix.length >= 5) candidates.push(afterPrefix.slice(0, 5)); // "85623"
  
  // Try 5-digit PLU with prefix digit (e.g. "28562")
  const fullPlu5 = clean.slice(1, 6);
  candidates.push(fullPlu5);

  if (afterPrefix.length >= 4) candidates.push(afterPrefix.slice(0, 4));

  return [...new Set(candidates)];
}

/**
 * Find matching pre-seeded PLU entry for a given scale barcode
 */
export function matchBakeryPlu(barcode: string): PluProductMapping | null {
  const candidates = extractScalePluCandidates(barcode);
  for (const cand of candidates) {
    if (BAKERY_PLU_DICTIONARY[cand]) {
      return BAKERY_PLU_DICTIONARY[cand];
    }
  }
  return null;
}
