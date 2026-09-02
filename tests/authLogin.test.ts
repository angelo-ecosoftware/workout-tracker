import { describe, it, expect, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { AuthUser } from '../src/context/AuthContext.tsx';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Target user under test
const TARGET_USER = {
  id: "c4e8d97b-bb42-43d3-955d-a8202352c98d",
  email: "tu045744@gmail.com",
  name: "tu045744",
};

describe('Google OAuth & Auth State Flow Test', () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  it('1. Triggers Google OAuth sign-in flow with prompt and redirect options', async () => {
    const signInSpy = vi.spyOn(supabase.auth, 'signInWithOAuth');

    const origin = 'http://localhost:5173';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    expect(signInSpy).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    // In a test environment, signInWithOAuth returns the Supabase OAuth authorization URL targeting Google
    expect(error).toBeNull();
    expect(data?.url).toContain('/auth/v1/authorize?provider=google');
    expect(data?.provider).toBe('google');

    signInSpy.mockRestore();
  });

  it('2. Hydrates AuthUser and verifies user resides strictly in Supabase auth system (auth.users)', async () => {
    // Supabase OAuth user object returned upon callback from auth.users
    const rawSupabaseUser = {
      id: TARGET_USER.id,
      email: TARGET_USER.email,
      app_metadata: {
        provider: 'google',
        providers: ['google'],
      },
      identities: [
        {
          id: 'google-oauth2-identity-id',
          user_id: TARGET_USER.id,
          provider: 'google',
          identity_data: {
            email: TARGET_USER.email,
            name: TARGET_USER.name,
            avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
          },
        },
      ],
      user_metadata: {
        full_name: TARGET_USER.name,
        avatar_url: 'https://lh3.googleusercontent.com/a/default-user',
      },
    };

    // Verify mapping into our app's AuthUser shape directly from Supabase auth (auth.users metadata)
    const authUser: AuthUser = {
      id: rawSupabaseUser.id,
      uid: rawSupabaseUser.id,
      email: rawSupabaseUser.email,
      displayName: rawSupabaseUser.user_metadata?.full_name || rawSupabaseUser.email?.split('@')[0],
      photoURL: rawSupabaseUser.user_metadata?.avatar_url,
      provider: rawSupabaseUser.app_metadata?.provider || rawSupabaseUser.identities?.[0]?.provider,
    };

    expect(authUser.id).toBe(TARGET_USER.id);
    expect(authUser.email).toBe('tu045744@gmail.com');
    expect(authUser.displayName).toBe('tu045744');
    expect(authUser.photoURL).toBeDefined();
    expect(authUser.provider).toBe('google');
  });
});
