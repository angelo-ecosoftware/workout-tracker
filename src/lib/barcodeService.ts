import { FoodItemNutrition } from '../models.ts';
import { supabase } from './supabase.ts';
import { mapSupabaseRowToFoodItem, saveHiveMindFoodItem } from './dietaryData.ts';
import { matchBakeryPlu } from './bakeryPluDictionary.ts';

export interface BarcodeLookupResult {
  found: boolean;
  source: 'database' | 'openfoodfacts' | 'supermarket' | 'bakery_plu' | 'none';
  item: FoodItemNutrition | null;
  error?: string;
}

/**
 * Normalizes Open Food Facts product response into the application's standard FoodItemNutrition shape.
 */
export function normalizeOpenFoodFactsProduct(data: any, barcode: string): FoodItemNutrition | null {
  if (!data || !data.product) return null;

  const p = data.product;
  const nutriments = p.nutriments || {};

  const name = p.product_name || p.product_name_nl || p.product_name_en || p.generic_name || 'Scanned Product';
  const brand = p.brands || p.brand_owner || '';

  // Extract macros per 100g / 100ml
  const kcalPer100g = Math.round(
    Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? nutriments['energy_100g'] ?? 0)
  );
  const proteinPer100g = parseFloat(
    Number(nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0).toFixed(1)
  );
  const carbsPer100g = parseFloat(
    Number(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0).toFixed(1)
  );
  const sugarPer100g = parseFloat(
    Number(nutriments['sugars_100g'] ?? nutriments['sugars'] ?? 0).toFixed(1)
  );
  const fatPer100g = parseFloat(
    Number(nutriments['fat_100g'] ?? nutriments['fat'] ?? 0).toFixed(1)
  );
  const fiberPer100g = parseFloat(
    Number(nutriments['fiber_100g'] ?? nutriments['fiber'] ?? 0).toFixed(1)
  );

  // Extract package sizing if provided in product attributes
  let packageWeightGrams: number | undefined;
  if (p.product_quantity && !isNaN(Number(p.product_quantity))) {
    packageWeightGrams = Math.round(Number(p.product_quantity));
  } else if (p.quantity && typeof p.quantity === 'string') {
    const match = p.quantity.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|ml)\b/i);
    if (match) {
      packageWeightGrams = Math.round(parseFloat(match[1].replace(',', '.')));
    } else {
      const kgMatch = p.quantity.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
      if (kgMatch) {
        packageWeightGrams = Math.round(parseFloat(kgMatch[1].replace(',', '.')) * 1000);
      }
    }
  }

  const cleanBarcode = barcode.trim();
  const id = `ean_${cleanBarcode}`;

  return {
    id,
    name: name.trim(),
    brand: brand.trim(),
    servingUnit: (p.serving_size && p.serving_size.includes('ml')) ? 'ml' : 'gram',
    kcalPer100g: Math.max(0, kcalPer100g),
    proteinPer100g: Math.max(0, proteinPer100g),
    carbsPer100g: Math.max(0, carbsPer100g),
    sugarPer100g: Math.max(0, sugarPer100g),
    fatPer100g: Math.max(0, fatPer100g),
    fiberPer100g: Math.max(0, fiberPer100g),
    packageWeightGrams,
    barcode: cleanBarcode,
    sourceUrl: p.url || `https://nl.openfoodfacts.org/product/${cleanBarcode}`,
    isCustom: false,
  };
}

/**
 * Multi-tier lookup service:
 * 1. Checks Supabase `food_items` by `barcode` or `id = ean_{barcode}`
 * 2. If missing, queries Open Food Facts API v2
 * 3. Auto-indexes newly fetched Open Food Facts items into Supabase for global hive-mind access
 */
export async function lookupBarcodeProduct(barcode: string, currentUserId?: string): Promise<BarcodeLookupResult> {
  const cleanCode = barcode.trim();
  if (!cleanCode) {
    return { found: false, source: 'none', item: null, error: 'Empty barcode provided' };
  }

  // 1. Check local / remote Supabase database first
  try {
    const { data, error } = await supabase
      .from('food_items')
      .select('*')
      .or(`barcode.eq.${cleanCode},id.eq.ean_${cleanCode},id.eq.${cleanCode}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return {
        found: true,
        source: 'database',
        item: mapSupabaseRowToFoodItem(data),
      };
    }
  } catch (dbErr) {
    console.warn('Database barcode lookup fallback to OpenFoodFacts:', dbErr);
  }

  // 1.5. Check if it matches an in-store Bakery PLU alias in our database (e.g. 285623 -> AH Vloer waldkorn half)
  const bakeryPluEntry = matchBakeryPlu(cleanCode);
  if (bakeryPluEntry) {
    try {
      // Check if the master GTIN, webshop ID, or exact query already exists in Supabase
      const searchTerms = [
        bakeryPluEntry.masterGtin ? `barcode.eq.${bakeryPluEntry.masterGtin}` : null,
        bakeryPluEntry.webshopId ? `id.eq.ah_wi${bakeryPluEntry.webshopId}` : null,
        `name.ilike.%${bakeryPluEntry.name}%`,
      ].filter(Boolean).join(',');

      const { data: pluDbData } = await supabase
        .from('food_items')
        .select('*')
        .or(searchTerms)
        .limit(1)
        .maybeSingle();

      if (pluDbData) {
        const item = mapSupabaseRowToFoodItem(pluDbData);
        return {
          found: true,
          source: 'bakery_plu',
          item: {
            ...item,
            barcode: cleanCode, // preserve scanned scale barcode
          },
        };
      }
    } catch (pluDbErr) {
      console.warn('Database bakery PLU check skipped:', pluDbErr);
    }
  }

  // 2. Query Open Food Facts API v2
  try {
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`;
    const response = await fetch(offUrl, {
      headers: {
        'User-Agent': 'WorkoutTrackerPWA/1.0 (Personal Fitness & Nutrition App)',
      },
    });

    if (response.ok) {
      const payload = await response.json();
      if (payload.status === 1 && payload.product) {
        const normalized = normalizeOpenFoodFactsProduct(payload, cleanCode);
        if (normalized) {
          // Auto-persist into global hive-mind database so ALL users have instant access
          try {
            await saveHiveMindFoodItem(normalized, currentUserId);
          } catch (saveErr) {
            console.error('Could not auto-save Open Food Facts product to global index:', saveErr);
          }

          return {
            found: true,
            source: 'openfoodfacts',
            item: normalized,
          };
        }
      }
    }
  } catch (apiErr: any) {
    console.warn('Open Food Facts API lookup skipped/failed:', apiErr);
  }

  // 3. Fallback: Supermarket Direct Barcode Resolver (Albert Heijn Mobile Services GTIN & FIR)
  try {
    const smRes = await fetch(`/api/barcode-lookup?barcode=${encodeURIComponent(cleanCode)}`);
    if (smRes.ok) {
      const supermarketItem = (await smRes.json()) as FoodItemNutrition;
      if (supermarketItem && supermarketItem.name) {
        // Auto-persist into global hive-mind database so ALL users have instant access
        try {
          await saveHiveMindFoodItem(supermarketItem, currentUserId);
        } catch (saveErr) {
          console.error('Could not auto-save supermarket barcode item to global index:', saveErr);
        }

        return {
          found: true,
          source: 'supermarket',
          item: supermarketItem,
        };
      }
    }
  } catch (smErr) {
    console.warn('Supermarket barcode fallback lookup error:', smErr);
  }

  return { found: false, source: 'none', item: null, error: 'No product matches this barcode.' };
}
