import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://khvnlmzhymocnvdnptci.supabase.co';
const supabaseAnonKey = 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function provisionAdmin() {
  const email = 'tuO45744@gmail.com';
  const password = 'TestUser2005@';

  console.log(`Checking / creating admin account for: ${email}`);

  // 1. Try to sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Platform Administrator',
        name: 'Platform Administrator',
      },
    },
  });

  let adminUserId = signUpData?.user?.id;

  if (signUpError) {
    console.log('Sign-up response/notice:', signUpError.message);
    // If user already exists, attempt to sign in to get their user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      console.error('Sign-in error:', signInError.message);
    } else {
      adminUserId = signInData?.user?.id;
      console.log('Successfully signed in existing user. UID:', adminUserId);
    }
  } else {
    console.log('User signed up successfully. UID:', adminUserId);
  }

  if (adminUserId) {
    // 2. Insert/Upsert into users profile table
    const { error: userErr } = await supabase.from('users').upsert({
      user_id: adminUserId,
      email,
      name: 'Platform Administrator',
      updated_at: new Date().toISOString(),
    });
    console.log('Users profile upsert:', userErr ? userErr.message : 'SUCCESS');

    // 3. Upsert admin role into user_roles
    const { error: roleErr } = await supabase.from('user_roles').upsert({
      user_id: adminUserId,
      role: 'admin',
      specialty: null,
      is_approved: true,
      updated_at: new Date().toISOString(),
    });
    console.log('User roles admin promotion:', roleErr ? roleErr.message : 'SUCCESS');
  }
}

provisionAdmin();
