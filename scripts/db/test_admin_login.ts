import { supabase } from './client.ts';

async function testLogin() {
  const email = process.env.ADMIN_EMAIL || process.env.VITE_ADMIN_EMAIL || '';
  const password = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD environment variable.');
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
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
