import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://khvnlmzhymocnvdnptci.supabase.co', 'sb_publishable_VjnCda-dV7N-hxqEwhsyuA_A4CqNMV-');

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'tuO45744@gmail.com',
    password: 'TestUser2005@',
  });
  console.log('Login error:', error);
  console.log('User ID:', data?.user?.id);
  
  if (data?.user?.id) {
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', data.user.id)
      .maybeSingle();
    console.log('Role query error:', roleError);
    console.log('Role query data:', roleData);
  }
}
testLogin();
