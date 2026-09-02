/**
 * Universal Store and Branding Utilities
 * Dynamically resolves store metadata, clean titles, and brand classifications
 */

export interface StoreMetadata {
  id: string;
  name: string;
  badgeLabel: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const KNOWN_STORES: Record<string, StoreMetadata> = {
  ah: {
    id: 'ah',
    name: 'Albert Heijn',
    badgeLabel: 'AH',
    textColor: 'text-[#00ade6]',
    bgColor: 'bg-[#00ade6]/10',
    borderColor: 'border-[#00ade6]/30',
  },
  jumbo: {
    id: 'jumbo',
    name: 'Jumbo',
    badgeLabel: 'JUMBO',
    textColor: 'text-[#eab308]',
    bgColor: 'bg-[#eab308]/10',
    borderColor: 'border-[#eab308]/30',
  },
  dirk: {
    id: 'dirk',
    name: 'Dirk',
    badgeLabel: 'DIRK',
    textColor: 'text-[#ef4444]',
    bgColor: 'bg-[#ef4444]/10',
    borderColor: 'border-[#ef4444]/30',
  },
  plus: {
    id: 'plus',
    name: 'PLUS',
    badgeLabel: 'PLUS',
    textColor: 'text-[#22c55e]',
    bgColor: 'bg-[#22c55e]/10',
    borderColor: 'border-[#22c55e]/30',
  },
  generic: {
    id: 'generic',
    name: 'Store',
    badgeLabel: 'STORE',
    textColor: 'text-gray-400',
    bgColor: 'bg-gray-800',
    borderColor: 'border-gray-700',
  },
};

/**
 * Detect store metadata from a product source URL or product ID
 */
export function getStoreMetadata(sourceUrl?: string, productId?: string): StoreMetadata | null {
  const target = `${sourceUrl || ''} ${productId || ''}`.toLowerCase();

  if (target.includes('ah.nl') || target.startsWith('ah_') || target.startsWith('wi')) {
    return KNOWN_STORES.ah;
  }
  if (target.includes('jumbo.com') || target.startsWith('jumbo_')) {
    return KNOWN_STORES.jumbo;
  }
  if (target.includes('dirk.nl') || target.startsWith('dirk_')) {
    return KNOWN_STORES.dirk;
  }
  if (target.includes('plus.nl') || target.startsWith('plus_')) {
    return KNOWN_STORES.plus;
  }
  if (sourceUrl) {
    return KNOWN_STORES.generic;
  }
  return null;
}

/**
 * Clean redundant store prefixes from product titles
 * e.g. "AH Scharrel kipfilet" -> "Scharrel kipfilet"
 *      "Jumbo Kipfilet 800 g" -> "Kipfilet 800 g"
 *      "PLUS Boerentrots Kipfilet" -> "Boerentrots Kipfilet"
 */
export function cleanProductTitle(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/^(AH|Albert Heijn|Jumbo|PLUS|Dirk)\s+/i, '')
    .replace(/\s*bestellen\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/gi, '')
    .replace(/\s*\|\s*(Albert Heijn|Jumbo|Plus|Dirk|Aldi|Lidl)/gi, '')
    .trim();
}

/**
 * Detect whether a brand is a store's private house-brand or a 3rd-party brand
 */
export function isHouseBrand(brand?: string, storeMeta?: StoreMetadata | null): boolean {
  if (!brand) return false;
  const b = brand.toLowerCase().trim();
  const houseBrands = [
    'ah',
    'albert heijn',
    'ah biologisch',
    'ah excellent',
    'ah terra',
    'jumbo',
    'jumbo biologisch',
    'jumbo lekker & simpel',
    'dirk',
    '1 de beste',
    'vleeschmeesters',
    'plus',
    'plus boerentrots',
    'plus biologisch',
    'gwoon',
  ];

  if (storeMeta && b === storeMeta.id.toLowerCase()) return true;
  if (storeMeta && b === storeMeta.name.toLowerCase()) return true;
  return houseBrands.includes(b);
}

/**
 * Levenshtein distance for fuzzy typo-tolerant matching
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

/**
 * Smart fuzzy search matching query tokens against item tokens with typo tolerance
 * e.g. "kpi" matches "kip" / "kipfilet", "ah" matches store badge, "kwark" matches "magere kwark"
 */
export function fuzzyMatch(
  query: string,
  targetFields: (string | undefined | null)[]
): { matches: boolean; score: number } {
  const q = query.trim().toLowerCase();
  if (!q) return { matches: true, score: 0 };

  const fullTarget = targetFields
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Exact substring match gives highest priority
  if (fullTarget.includes(q)) {
    return { matches: true, score: 100 - (fullTarget.indexOf(q) * 2) };
  }

  const queryTokens = q.split(/\s+/).filter(t => t.length > 0);
  const targetTokens = fullTarget.split(/[\s,./\-_()]+/).filter(t => t.length > 0);

  let totalScore = 0;
  let allTokensMatched = true;

  for (const qToken of queryTokens) {
    let bestTokenScore = 0;

    for (const tToken of targetTokens) {
      if (tToken === qToken) {
        bestTokenScore = Math.max(bestTokenScore, 50);
      } else if (tToken.startsWith(qToken)) {
        bestTokenScore = Math.max(bestTokenScore, 35);
      } else if (tToken.includes(qToken)) {
        bestTokenScore = Math.max(bestTokenScore, 25);
      } else if (qToken.length >= 3) {
        // Typo tolerance: max distance of 1 for 3-4 chars, 2 for 5+ chars
        const maxDist = qToken.length <= 4 ? 1 : 2;
        const dist = levenshteinDistance(qToken, tToken.slice(0, qToken.length + 1));
        if (dist <= maxDist) {
          bestTokenScore = Math.max(bestTokenScore, 20 - dist * 5);
        }
      }
    }

    if (bestTokenScore === 0) {
      allTokensMatched = false;
      break;
    }
    totalScore += bestTokenScore;
  }

  return { matches: allTokensMatched, score: totalScore };
}
