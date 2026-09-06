import { createClient } from '@supabase/supabase-js';
import { resolveAlbertHeijnBarcode, resolveJumboBarcode, resolveDirkBarcode, resolvePlusBarcode } from '../../api/barcode-lookup.ts';
import { scrapeProductFromUrl, searchAlbertHeijnProduct, searchJumboProduct } from '../../api/scraperRegistry.ts';
import { FoodItemNutrition } from '../../src/models.ts';

const supabaseUrl = 'https://khvnlmzhymocnvdnptci.supabase.co';
const supabaseAnonKey = 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Audit and Backfill script for all products in `food_items`.
 * 1. Checks every product for missing `source_url`, missing `barcode`, or 0 macros.
 * 2. Uses our multi-tier resolver pipeline (AH, Jumbo, Dirk, PLUS, OpenFoodFacts) to find the live product.
 * 3. Updates the Supabase row with active URLs, verified macros, portion sizing, and barcodes.
 */
async function backfillFoodCatalog() {
  console.log('=== 🍎 FOOD DATABASE AUDIT & BACKFILL ENGINE ===\n');

  const { data: items, error } = await supabase
    .from('food_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !items) {
    console.error('Failed to fetch food items from database:', error);
    return;
  }

  console.log(`Found ${items.length} total food items in database.\n`);

  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isCustom = Boolean(item.is_custom);
    const hasSourceUrl = Boolean(item.source_url && item.source_url.startsWith('http'));
    const hasBarcode = Boolean(item.barcode && /^\d+$/.test(item.barcode));
    const hasMacros = (Number(item.kcal_per_100g) > 0 || Number(item.protein_per_100g) > 0);

    // If item already has a live URL, verified barcode, and valid macros, skip
    if (hasSourceUrl && hasBarcode && hasMacros) {
      skippedCount++;
      continue;
    }

    console.log(`[${i + 1}/${items.length}] Inspecting: "${item.name}" (Brand: ${item.brand || 'None'}) | Barcode: ${item.barcode || 'None'} | URL: ${item.source_url || 'Missing'}`);

    let resolvedProduct: FoodItemNutrition | null = null;

    // Strategy 1: If barcode is present, run full barcode resolver
    if (item.barcode) {
      try {
        resolvedProduct = await resolveAlbertHeijnBarcode(item.barcode);
        if (!resolvedProduct) resolvedProduct = await resolveJumboBarcode(item.barcode);
        if (!resolvedProduct) resolvedProduct = await resolveDirkBarcode(item.barcode);
        if (!resolvedProduct) resolvedProduct = await resolvePlusBarcode(item.barcode);
      } catch (err: unknown) {
        console.warn(`  Barcode lookup attempt failed for ${item.barcode}:`, err instanceof Error ? err.message : err);
      }
    }

    // Strategy 2: If existing source_url is present, scrape / re-verify it
    if (!resolvedProduct && hasSourceUrl) {
      try {
        const scraped = await scrapeProductFromUrl(item.source_url);
        if (scraped && (scraped.kcalPer100g > 0 || scraped.proteinPer100g > 0)) {
          resolvedProduct = {
            ...scraped,
            barcode: scraped.barcode || item.barcode || undefined,
            isCustom,
          };
        }
      } catch (err: unknown) {
        console.warn(`  Source URL scrape failed for ${item.source_url}:`, err instanceof Error ? err.message : err);
      }
    }

    // Strategy 3: Search by product title & brand
    if (!resolvedProduct && item.name) {
      const cleanName = item.name.replace(/^(AH|Jumbo|Dirk|PLUS)\s+/i, '').trim();
      const isAh = item.brand?.toLowerCase().includes('albert heijn') || item.brand?.toLowerCase() === 'ah' || item.id?.startsWith('ah_');
      const isJumbo = item.brand?.toLowerCase().includes('jumbo') || item.id?.startsWith('jumbo_');

      if (isAh) {
        try {
          const searchAh = await searchAlbertHeijnProduct(cleanName, '');
          if (searchAh && (searchAh.kcalPer100g > 0 || searchAh.proteinPer100g > 0)) {
            resolvedProduct = searchAh;
          }
        } catch {}
      } else if (isJumbo) {
        try {
          const searchJ = await searchJumboProduct(cleanName, '');
          if (searchJ && (searchJ.kcalPer100g > 0 || searchJ.proteinPer100g > 0)) {
            resolvedProduct = searchJ;
          }
        } catch {}
      } else {
        // Try AH first, then Jumbo
        try {
          const searchAh = await searchAlbertHeijnProduct(cleanName, '');
          if (searchAh && (searchAh.kcalPer100g > 0 || searchAh.proteinPer100g > 0)) {
            resolvedProduct = searchAh;
          } else {
            const searchJ = await searchJumboProduct(cleanName, '');
            if (searchJ && (searchJ.kcalPer100g > 0 || searchJ.proteinPer100g > 0)) {
              resolvedProduct = searchJ;
            }
          }
        } catch {}
      }
    }

    if (resolvedProduct) {
      const updatePayload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (!item.source_url && resolvedProduct.sourceUrl) {
        updatePayload.source_url = resolvedProduct.sourceUrl;
      } else if (resolvedProduct.sourceUrl && resolvedProduct.sourceUrl !== item.source_url) {
        updatePayload.source_url = resolvedProduct.sourceUrl;
      }

      if (!item.barcode && resolvedProduct.barcode) {
        updatePayload.barcode = resolvedProduct.barcode;
      }

      if (!hasMacros) {
        updatePayload.kcal_per_100g = resolvedProduct.kcalPer100g;
        updatePayload.protein_per_100g = resolvedProduct.proteinPer100g;
        updatePayload.carbs_per_100g = resolvedProduct.carbsPer100g;
        updatePayload.sugar_per_100g = resolvedProduct.sugarPer100g;
        updatePayload.fat_per_100g = resolvedProduct.fatPer100g;
        updatePayload.fiber_per_100g = resolvedProduct.fiberPer100g;
      }

      if (resolvedProduct.packageWeightGrams && !item.package_weight_grams) {
        updatePayload.package_weight_grams = resolvedProduct.packageWeightGrams;
      }

      if (resolvedProduct.pieceCount && !item.piece_count) {
        updatePayload.piece_count = resolvedProduct.pieceCount;
      }

      const { error: updErr } = await supabase
        .from('food_items')
        .update(updatePayload)
        .eq('id', item.id);

      if (!updErr) {
        console.log(`  ✅ UPDATED: "${resolvedProduct.name}" -> URL: ${updatePayload.source_url || 'same'} | Macros: ${resolvedProduct.kcalPer100g} kcal, ${resolvedProduct.proteinPer100g}g protein`);
        updatedCount++;
      } else {
        console.warn(`  ❌ DB update error for ${item.id}:`, updErr.message);
        failedCount++;
      }
    } else {
      console.log(`  ⚠️ Could not automatically resolve external product for: "${item.name}"`);
      failedCount++;
    }

    // Gentle pacing to respect retailer rate limits
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log('\n=== BACKFILL COMPLETE ===');
  console.log(`Total Products: ${items.length}`);
  console.log(`Updated / Enriched: ${updatedCount}`);
  console.log(`Skipped (Already Complete): ${skippedCount}`);
  console.log(`Unresolved / Retained: ${failedCount}`);
}

backfillFoodCatalog();
