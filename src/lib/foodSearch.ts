import Fuse from 'fuse.js';
import { FoodItemNutrition } from '../models.ts';
import { getStoreMetadata, cleanProductTitle } from './storeBranding.ts';

export interface FoodSearchOptions {
  query: string;
  limit?: number;
}

export interface ScoredFoodItem {
  item: FoodItemNutrition;
  score: number;
}

/**
 * Searches food items with intelligent ranking:
 * 1. Exact / prefix name matches always rank #1
 * 2. Word-boundary / token matches rank #2
 * 3. Fuzzy typo tolerance (Fuse.js) ranks #3
 * 4. Filters out irrelevant non-matches completely
 */
export function searchFoodItems(
  items: FoodItemNutrition[],
  query: string,
  limit: number = 100
): FoodItemNutrition[] {
  const cleanQuery = query.trim();
  if (!cleanQuery) {
    return items.slice(0, limit);
  }

  const lowerQuery = cleanQuery.toLowerCase();
  const queryTokens = lowerQuery.split(/\s+/).filter(Boolean);

  // Prepare searchable items with precomputed helper fields
  const preparedItems = items.map((item) => {
    const storeMeta = getStoreMetadata(item.sourceUrl, item.id);
    const cleanedTitle = cleanProductTitle(item.name || '');
    return {
      raw: item,
      name: item.name || '',
      brand: item.brand || '',
      cleanedTitle,
      storeName: storeMeta?.name || '',
      badgeLabel: storeMeta?.badgeLabel || '',
      fullText: `${item.name || ''} ${item.brand || ''} ${cleanedTitle} ${storeMeta?.name || ''} ${storeMeta?.badgeLabel || ''}`.toLowerCase(),
    };
  });

  // Configure Fuse for fuzzy matching
  const fuse = new Fuse(preparedItems, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'cleanedTitle', weight: 0.3 },
      { name: 'brand', weight: 0.15 },
      { name: 'storeName', weight: 0.05 },
    ],
    threshold: 0.4, // Strict enough to avoid garbage matches, loose enough for typos ("kpi" -> "kip")
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    ignoreLocation: true,
  });

  const fuseResults = fuse.search(cleanQuery);
  const fuseScoreMap = new Map<string, number>();
  for (const res of fuseResults) {
    fuseScoreMap.set(res.item.raw.id, res.score ?? 1);
  }

  const scoredList: ScoredFoodItem[] = [];

  for (const prep of preparedItems) {
    const nameLower = prep.name.toLowerCase();
    const cleanLower = prep.cleanedTitle.toLowerCase();
    const fullText = prep.fullText;

    let score = 0;
    let isMatch = false;

    // 1. Exact match
    if (nameLower === lowerQuery || cleanLower === lowerQuery) {
      score += 1000;
      isMatch = true;
    }
    // 2. Starts with full query
    else if (nameLower.startsWith(lowerQuery) || cleanLower.startsWith(lowerQuery)) {
      score += 800;
      isMatch = true;
    }
    // 3. Contains full exact phrase
    else if (nameLower.includes(lowerQuery) || cleanLower.includes(lowerQuery)) {
      // Reward earlier positions
      const idx = Math.min(
        nameLower.includes(lowerQuery) ? nameLower.indexOf(lowerQuery) : 99,
        cleanLower.includes(lowerQuery) ? cleanLower.indexOf(lowerQuery) : 99
      );
      score += 600 - Math.min(idx * 10, 200);
      isMatch = true;
    }
    // 4. Token-by-token exact / prefix matching
    else {
      let tokensMatched = 0;
      let tokenScore = 0;

      for (const token of queryTokens) {
        if (nameLower.startsWith(token) || cleanLower.startsWith(token)) {
          tokenScore += 100;
          tokensMatched++;
        } else if (nameLower.includes(token) || cleanLower.includes(token)) {
          tokenScore += 60;
          tokensMatched++;
        } else if (fullText.includes(token)) {
          tokenScore += 30;
          tokensMatched++;
        }
      }

      if (tokensMatched === queryTokens.length) {
        score += 400 + tokenScore;
        isMatch = true;
      }
    }

    // 5. Check Fuse fuzzy match if not matched or to enhance rank
    const fuseScore = fuseScoreMap.get(prep.raw.id);
    if (fuseScore !== undefined && fuseScore <= 0.4) {
      // Fuse score 0 is best match, 1 is worst
      const fuzzyBoost = (1 - fuseScore) * 300;
      score += fuzzyBoost;
      isMatch = true;
    }

    if (isMatch) {
      scoredList.push({
        item: prep.raw,
        score,
      });
    }
  }

  // Sort by highest score descending
  scoredList.sort((a, b) => b.score - a.score);

  return scoredList.slice(0, limit).map((s) => s.item);
}
