import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khvnlmzhymocnvdnptci.supabase.co';
const supabaseAnonKey = 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkUserData() {
  const athleteId = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';
  const { data: u, error: uErr } = await supabase.from('users').select('*').eq('user_id', athleteId).single();
  console.log('User row in DB:', u, uErr ? `Error: ${uErr.message}` : '');

  const { data: b, error: bErr } = await supabase.from('body_logs').select('*').eq('user_id', athleteId).order('log_date', { ascending: false });
  console.log('Body logs count in DB:', b?.length, bErr ? `Error: ${bErr.message}` : '');
  if (b) {
    b.forEach(item => console.log('  Body log:', item.log_date, item.weight_kg, 'kg', item.source));
  }

  const { data: sess, error: sessErr } = await supabase.from('sessions').select('*').eq('user_id', athleteId).order('completed_at', { ascending: false }).limit(5);
  console.log('Recent sessions in DB:', sess?.length, sessErr ? `Error: ${sessErr.message}` : '');
}

checkUserData();
