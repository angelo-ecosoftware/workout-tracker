import { supabase } from './client.ts';

async function makeAngeloCoachOfOela() {
  console.log('=== 🏋️ LINKING ANGELO GHAFOERKHAN AS COACH OF OELA DEXTER ===\n');

  // Authenticate as Platform Administrator
  const adminEmail = process.env.ADMIN_EMAIL || 'tuO45744@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'TestUser2005@';

  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password: adminPassword,
  });

  if (authErr) {
    console.error('Failed to authenticate as admin:', authErr.message);
  } else {
    console.log('✅ Authenticated as Platform Administrator (UID:', authData.user?.id, ')');
  }

  const coachId = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'; // Angelo Ghafoerkhan
  const athleteId = 'e38a245e-008c-4ea1-ac90-52b337000eb2'; // Oela Dexter

  // 1. Ensure Angelo has approved coach role
  const { error: coachRoleErr } = await supabase.from('user_roles').upsert({
    user_id: coachId,
    role: 'coach',
    specialty: 'head_coach',
    is_approved: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  console.log('1. Angelo Coach Role Upsert:', coachRoleErr ? coachRoleErr.message : 'SUCCESS (head_coach, approved)');

  // 2. Ensure Oela has athlete role
  const { error: athleteRoleErr } = await supabase.from('user_roles').upsert({
    user_id: athleteId,
    role: 'athlete',
    specialty: null,
    is_approved: true,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  console.log('2. Oela Athlete Role Upsert:', athleteRoleErr ? athleteRoleErr.message : 'SUCCESS (athlete)');

  // 3. Update existing link row or insert
  const existingLinkId = 'e2ae3458-dc17-4438-a3d2-35aa0ba848c0';
  const { data: updatedLink, error: updateErr } = await supabase
    .from('coach_athlete_links')
    .update({
      coach_id: coachId,
      athlete_id: athleteId,
      specialty: 'strength',
      status: 'accepted',
      coach_name: 'Angelo Ghafoerkhan',
      coach_email: 'angeloleeuw@gmail.com',
      athlete_name: 'Oela Dexter',
      athlete_email: 'dexteroela@gmail.com',
      invite_code: 'invite_ANGELO_OELA',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingLinkId)
    .select();

  console.log('3. Update Existing Coach-Athlete Link:', updateErr ? updateErr.message : 'SUCCESS');
  console.log('Updated Link Data:', updatedLink);

  // 4. Verification query
  const { data: allLinks, error: fetchErr } = await supabase
    .from('coach_athlete_links')
    .select('*');

  console.log('\n--- 📋 VERIFICATION: All Coach-Athlete Links in DB ---');
  if (allLinks) {
    allLinks.forEach((l, i) => {
      console.log(`  Link ${i + 1}: Coach "${l.coach_name}" (${l.coach_id}) -> Athlete "${l.athlete_name}" (${l.athlete_id}) | Status: ${l.status}`);
    });
  }
}

makeAngeloCoachOfOela();



