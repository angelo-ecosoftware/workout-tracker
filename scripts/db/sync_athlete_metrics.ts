import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khvnlmzhymocnvdnptci.supabase.co';
const supabaseAnonKey = 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function syncAthleteWeight() {
  const athleteId = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';

  const { data: u } = await supabase.from('users').select('*').eq('user_id', athleteId).single();
  if (u) {
    const updatedMetrics = {
      ...(u.metrics || {}),
      weight: u.weight_kg || 83,
      updatedAt: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        metrics: updatedMetrics,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', athleteId)
      .select()
      .single();

    console.log('Synced user profile in DB:', updated?.user_id, 'weight_kg:', updated?.weight_kg, 'metrics.weight:', updated?.metrics?.weight, error ? error.message : 'SUCCESS');
  }
}

syncAthleteWeight();
