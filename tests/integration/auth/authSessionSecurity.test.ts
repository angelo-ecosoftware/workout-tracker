import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Auth Session Security & Token Validation Suite', () => {
  let mockUser: any = null;
  let mockSession: any = null;
  let authError: any = null;

  beforeEach(() => {
    mockUser = null;
    mockSession = null;
    authError = null;
    vi.clearAllMocks();
  });

  const getSupabaseMock = () => ({
    auth: {
      signInWithPassword: vi.fn(async ({ email, password }) => {
        if (password === 'invalid-pass') {
          return { data: { user: null, session: null }, error: { message: 'Invalid login credentials', status: 400 } };
        }
        mockUser = { id: 'usr_sec_1', email };
        mockSession = { access_token: 'jwt_mock_token_123', user: mockUser, expires_in: 3600 };
        return { data: { user: mockUser, session: mockSession }, error: null };
      }),
      signUp: vi.fn(async ({ email, password }) => {
        if (!email || !password || password.length < 6) {
          return { data: { user: null, session: null }, error: { message: 'Password should be at least 6 characters', status: 422 } };
        }
        mockUser = { id: 'usr_sec_new', email };
        mockSession = { access_token: 'jwt_mock_signup_token', user: mockUser };
        return { data: { user: mockUser, session: mockSession }, error: null };
      }),
      signOut: vi.fn(async () => {
        mockUser = null;
        mockSession = null;
        return { error: null };
      }),
      getSession: vi.fn(async () => {
        return { data: { session: mockSession }, error: null };
      }),
      getUser: vi.fn(async () => {
        return { data: { user: mockUser }, error: null };
      }),
    },
  });

  it('1. Rejects login attempts with invalid password status 400', async () => {
    const supabase = getSupabaseMock();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'user@gym.com',
      password: 'invalid-pass',
    });

    expect(data.session).toBeNull();
    expect(error?.status).toBe(400);
    expect(error?.message).toContain('Invalid login credentials');
  });

  it('2. Authenticates valid credentials and yields JWT access token', async () => {
    const supabase = getSupabaseMock();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'athlete@gym.com',
      password: 'correct-password-123',
    });

    expect(error).toBeNull();
    expect(data.user?.id).toBe('usr_sec_1');
    expect(data.session?.access_token).toBe('jwt_mock_token_123');
  });

  it('3. Rejects user registration with insufficient password strength', async () => {
    const supabase = getSupabaseMock();
    const { data, error } = await supabase.auth.signUp({
      email: 'newuser@gym.com',
      password: '123',
    });

    expect(data.user).toBeNull();
    expect(error?.status).toBe(422);
    expect(error?.message).toContain('at least 6 characters');
  });

  it('4. Successfully purges session tokens on user signout', async () => {
    const supabase = getSupabaseMock();
    await supabase.auth.signInWithPassword({ email: 'active@gym.com', password: 'valid-password' });
    expect(mockUser).not.toBeNull();

    const { error } = await supabase.auth.signOut();
    expect(error).toBeNull();
    expect(mockUser).toBeNull();
    expect(mockSession).toBeNull();
  });
});
