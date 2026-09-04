import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khvnlmzhymocnvdnptci.supabase.co';
const supabaseAnonKey = 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectDb() {
  console.log('--- INSPECTING SUPABASE REALTIME DB ---');

  const { data: users, error: uErr } = await supabase.from('users').select('*');
  console.log('Users:', users?.length, uErr ? `Error: ${uErr.message}` : '');
  if (users) {
    users.forEach(u => console.log(`  User: ${u.user_id} (${u.email || u.name})`));
  }

  const { data: sessions, error: sErr } = await supabase.from('sessions').select('*').order('started_at', { ascending: false }).limit(10);
  console.log('Recent Sessions:', sessions?.length, sErr ? `Error: ${sErr.message}` : '');
  if (sessions) {
    sessions.forEach(s => console.log(`  Session: ${s.id} | User: ${s.user_id} | Status: ${s.status} | Started: ${s.started_at} | Completed: ${s.completed_at}`));
  }

  const { data: sets, error: setErr } = await supabase.from('sets').select('*').order('logged_at', { ascending: false }).limit(15);
  console.log('Recent Sets:', sets?.length, setErr ? `Error: ${setErr.message}` : '');
  if (sets) {
    sets.forEach(st => console.log(`  Set: ${st.id} | Ex: ${st.exercise_id} | Wt: ${st.weight}kg | Reps: ${st.reps} | Rest: ${st.rest_seconds}s | Dur: ${st.duration_seconds}s`));
  }
}

inspectDb();
