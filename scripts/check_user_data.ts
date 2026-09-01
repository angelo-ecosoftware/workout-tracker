import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://khvnlmzhymocnvdnptci.supabase.co";
const supabaseAnonKey = "sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_USER_ID = "c7b8e78f-24c3-447f-8ad2-5c31dd8421ec";

async function verifyAndFetch() {
  console.log(`--- Checking Database for User: ${TEST_USER_ID} ---`);

  // 1. Check User table
  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', TEST_USER_ID);

  console.log('\n[USERS TABLE]:');
  console.log(JSON.stringify(user, null, 2));
  if (userErr) console.error('User query error:', userErr);

  // 2. Check Exercises table
  const { data: exercises, error: exErr } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', TEST_USER_ID);

  console.log('\n[EXERCISES TABLE]:');
  console.log(JSON.stringify(exercises, null, 2));
  if (exErr) console.error('Exercises query error:', exErr);

  // 3. Check Workouts table
  const { data: workouts, error: wErr } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', TEST_USER_ID);

  console.log('\n[WORKOUTS TABLE]:');
  console.log(JSON.stringify(workouts, null, 2));
  if (wErr) console.error('Workouts query error:', wErr);
}

verifyAndFetch().catch(console.error);
