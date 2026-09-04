import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachAccountModal } from '../../../../src/components/modals/CoachAccountModal.tsx';
import * as AuthContext from '../../../../src/context/AuthContext.tsx';

describe('CoachAccountModal Component', () => {
  const mockRequestCoachRole = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'user-1', uid: 'user-1', email: 'test@example.com' } as any,
      token: 'mock-token',
      loading: false,
      roleInfo: { userId: 'user-1', role: 'athlete', isApproved: false, createdAt: new Date(), updatedAt: new Date() },
      userRole: 'athlete',
      specialty: null,
      isApprovedCoach: false,
      isCoach: false,
      isAdmin: false,
      isAthlete: true,
      refreshUserRole: vi.fn(),
      requestCoachRole: mockRequestCoachRole,
      loginWithGoogle: vi.fn(),
      switchAccount: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders modal with coaching capabilities and specialty selector', () => {
    render(<CoachAccountModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/coach account & permissions/i)).toBeInTheDocument();
    expect(screen.getByText(/standard athlete/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /strength/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nutrition/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /head coach/i })).toBeInTheDocument();
  });

  it('allows user to select specialty and activate coach mode', async () => {
    const user = userEvent.setup();
    render(<CoachAccountModal isOpen={true} onClose={vi.fn()} />);

    const nutritionBtn = screen.getByRole('button', { name: /nutrition/i });
    await user.click(nutritionBtn);

    const activateBtn = screen.getByRole('button', { name: /activate coach mode/i });
    await user.click(activateBtn);

    await waitFor(() => {
      expect(mockRequestCoachRole).toHaveBeenCalledWith('nutrition');
    });
  });
});
