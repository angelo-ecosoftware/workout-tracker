import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khvnlmzhymocnvdnptci.supabase.co';
const supabaseAnonKey = 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function cleanJunkFoodItems() {
  console.log('=== 🧹 CLEANING JUNK / RANDOM "PRODUCT" ITEMS ===\n');

  // Sign in as admin to satisfy RLS for deletions
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: 'tuO45744@gmail.com',
    password: 'TestUser2005@',
  });
  if (authError) {
    console.warn('Admin sign-in notice:', authError.message);
  } else {
    console.log('Authenticated as admin.');
  }

  // Fetch all items from food_items
  const { data: allItems, error } = await supabase
    .from('food_items')
    .select('id, name, brand, source_url, barcode, kcal_per_100g, protein_per_100g');

  if (error || !allItems) {
    console.error('Failed to load items:', error);
    return;
  }

  console.log(`Total food items in database: ${allItems.length}`);

  const junkItems = allItems.filter((item) => {
    const name = (item.name || '').trim().toLowerCase();
    // Match "Product", "product", empty string, "unknown", "unknown product", "null", "undefined"
    if (!name || name === 'product' || name === 'unknown' || name === 'unknown product' || name === 'null' || name === 'undefined' || name === 'ah product' || name === 'jumbo product' || name === 'dirk product' || name === 'plus product') {
      return true;
    }
    return false;
  });

  console.log(`Found ${junkItems.length} useless/junk items to remove:`);
  junkItems.forEach((it, idx) => {
    console.log(`  ${idx + 1}. [${it.id}] "${it.name}" (Brand: ${it.brand || 'none'}) - URL: ${it.source_url || 'none'}`);
  });

  if (junkItems.length === 0) {
    console.log('\nNo junk items found. Database is clean!');
    return;
  }

  const junkIds = junkItems.map((it) => it.id);

  // Check if any dietary_logs reference them
  const { data: linkedLogs } = await supabase
    .from('dietary_logs')
    .select('id, food_item_id')
    .in('food_item_id', junkIds);

  if (linkedLogs && linkedLogs.length > 0) {
    console.warn(`⚠️ Warning: ${linkedLogs.length} dietary log(s) reference these junk items.`);
  } else {
    console.log('✓ 0 dietary logs reference these junk items.');
  }

  // Delete junk items from food_items table
  const { error: delError, count } = await supabase
    .from('food_items')
    .delete()
    .in('id', junkIds);

  if (delError) {
    console.error('❌ Failed to delete junk items:', delError);
  } else {
    console.log(`\n✅ Successfully deleted ${junkItems.length} random "Product" items from database!`);
  }
}

cleanJunkFoodItems();
