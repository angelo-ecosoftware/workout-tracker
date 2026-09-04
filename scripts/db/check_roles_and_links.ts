import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khvnlmzhymocnvdnptci.supabase.co';
const supabaseAnonKey = 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRolesAndLinks() {
  console.log('=== CHECKING ROLES & COACH LINKS IN DATABASE ===\n');

  const athleteId = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';
  const coachId = '078b01df-a405-4ab0-99c1-7a315c76f935';

  // 1. Check user_roles table
  const { data: roles, error: rErr } = await supabase.from('user_roles').select('*');
  console.log('User Roles Count:', roles?.length, rErr ? `Error: ${rErr.message}` : '');
  if (roles && roles.length > 0) {
    roles.forEach(r => console.log(`  Role row: user_id=${r.user_id} | role=${r.role} | specialty=${r.specialty} | is_approved=${r.is_approved}`));
  } else {
    console.log('  No user_roles rows found.');
  }

  // 2. Check coach_athlete_links table
  const { data: links, error: lErr } = await supabase.from('coach_athlete_links').select('*');
  console.log('\nCoach-Athlete Links Count:', links?.length, lErr ? `Error: ${lErr.message}` : '');
  if (links && links.length > 0) {
    links.forEach(l => console.log(`  Link row: id=${l.id} | coach_id=${l.coach_id} | athlete_id=${l.athlete_id} | code=${l.invite_code} | status=${l.status} | coach_name=${l.coach_name} | athlete_name=${l.athlete_name}`));
  } else {
    console.log('  No coach_athlete_links rows found.');
  }

  // 3. Check specific athlete & coach users
  const { data: users } = await supabase.from('users').select('*').in('user_id', [athleteId, coachId]);
  console.log('\nUsers Profiles in DB:');
  if (users) {
    users.forEach(u => console.log(`  User: ${u.user_id} | Email: ${u.email} | Name: ${u.name}`));
  }
}

checkRolesAndLinks();
