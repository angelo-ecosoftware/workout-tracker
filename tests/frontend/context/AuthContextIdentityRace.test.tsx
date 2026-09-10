// @vitest-environment jsdom

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../../../src/context/AuthContext.tsx';
import { supabase } from '../../../src/lib/supabase.ts';
import { fetchUserRole } from '../../../src/lib/db/roles.ts';

vi.mock('../../../src/lib/db/roles.ts', () => ({
  fetchUserRole: vi.fn(),
  requestCoachRole: vi.fn(),
}));

const Probe = () => {
  const { user, userRole } = useAuth();
  return <output data-testid="auth-state">{`${user?.id || 'none'}:${userRole}`}</output>;
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
}

describe('AuthContext identity transition safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not commit a late User A role after User B becomes active', async () => {
    const userA = { id: 'user-a', email: 'a@example.com', user_metadata: {} };
    const userB = { id: 'user-b', email: 'b@example.com', user_metadata: {} };
    const roleA = {
      userId: userA.id,
      role: 'admin' as const,
      specialty: null,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const roleB = {
      userId: userB.id,
      role: 'coach' as const,
      specialty: 'strength' as const,
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const pendingInitialSession = deferred<any>();
    let authStateCallback: ((event: string, session: any) => void) | undefined;

    vi.spyOn(supabase.auth, 'getSession').mockReturnValue(
      pendingInitialSession.promise as any
    );
    vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation((callback: any) => {
      authStateCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      } as any;
    });
    vi.mocked(fetchUserRole)
      .mockResolvedValueOnce(roleB)
      .mockResolvedValueOnce(roleA);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    act(() => {
      authStateCallback?.('SIGNED_IN', {
        user: userB,
        access_token: 'token-b',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state').textContent).toBe('user-b:coach');
    });

    await act(async () => {
      pendingInitialSession.resolve({
        data: {
          session: {
            user: userA,
            access_token: 'token-a',
          },
        },
        error: null,
      });
      await Promise.resolve();
    });

    expect(screen.getByTestId('auth-state').textContent).toBe('user-b:coach');
  });
});
