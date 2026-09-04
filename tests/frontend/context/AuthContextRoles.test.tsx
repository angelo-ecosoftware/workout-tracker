import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../../../src/context/AuthContext.tsx';
import * as RolesDb from '../../../src/lib/db/roles.ts';
import { supabase } from '../../../src/lib/supabase.ts';

const TestComponent = () => {
  const { user, userRole, specialty, isCoach, isAdmin, isAthlete, isApprovedCoach, requestCoachRole, refreshUserRole } = useAuth();
  return (
    <div>
      <span data-testid="user-id">{user?.id || 'none'}</span>
      <span data-testid="user-role">{userRole}</span>
      <span data-testid="specialty">{specialty || 'none'}</span>
      <span data-testid="is-coach">{isCoach ? 'yes' : 'no'}</span>
      <span data-testid="is-admin">{isAdmin ? 'yes' : 'no'}</span>
      <span data-testid="is-athlete">{isAthlete ? 'yes' : 'no'}</span>
      <span data-testid="is-approved-coach">{isApprovedCoach ? 'yes' : 'no'}</span>
      <button onClick={() => requestCoachRole('strength')}>Request Strength Coach</button>
      <button onClick={() => refreshUserRole()}>Refresh Role</button>
    </div>
  );
};

describe('AuthContext RBAC & Role Derivation', () => {
  const mockAthleteUser = {
    id: 'user-athlete-1',
    email: 'athlete@example.com',
    user_metadata: { full_name: 'Test Athlete' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({
      data: {
        session: {
          user: mockAthleteUser,
          access_token: 'mock-token',
        } as any,
      },
      error: null,
    });

    vi.spyOn(supabase.auth, 'onAuthStateChange').mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    } as any);
  });

  it('defaults to athlete role for regular users', async () => {
    vi.spyOn(RolesDb, 'fetchUserRole').mockResolvedValue({
      userId: 'user-athlete-1',
      role: 'athlete',
      specialty: null,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('user-athlete-1');
      expect(screen.getByTestId('user-role')).toHaveTextContent('athlete');
      expect(screen.getByTestId('is-athlete')).toHaveTextContent('yes');
      expect(screen.getByTestId('is-coach')).toHaveTextContent('no');
      expect(screen.getByTestId('is-admin')).toHaveTextContent('no');
    });
  });

  it('correctly sets coach role and specialty upon approval', async () => {
    vi.spyOn(RolesDb, 'fetchUserRole').mockResolvedValue({
      userId: 'user-athlete-1',
      role: 'coach',
      specialty: 'strength',
      isApproved: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('coach');
      expect(screen.getByTestId('specialty')).toHaveTextContent('strength');
      expect(screen.getByTestId('is-coach')).toHaveTextContent('yes');
      expect(screen.getByTestId('is-approved-coach')).toHaveTextContent('yes');
      expect(screen.getByTestId('is-athlete')).toHaveTextContent('no');
    });
  });

  it('allows athlete to submit coach role request', async () => {
    const user = userEvent.setup();
    vi.spyOn(RolesDb, 'fetchUserRole').mockResolvedValue({
      userId: 'user-athlete-1',
      role: 'athlete',
      specialty: null,
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const requestSpy = vi.spyOn(RolesDb, 'requestCoachRole').mockResolvedValue({
      userId: 'user-athlete-1',
      role: 'coach',
      specialty: 'strength',
      isApproved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('athlete');
    });

    const reqBtn = screen.getByRole('button', { name: /request strength coach/i });
    await user.click(reqBtn);

    await waitFor(() => {
      expect(requestSpy).toHaveBeenCalledWith('user-athlete-1', 'strength');
      expect(screen.getByTestId('user-role')).toHaveTextContent('coach');
      expect(screen.getByTestId('is-approved-coach')).toHaveTextContent('no');
    });
  });
});
