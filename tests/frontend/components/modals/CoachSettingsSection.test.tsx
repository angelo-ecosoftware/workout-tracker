import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachSettingsSection } from '../../../../src/components/modals/CoachSettingsSection.tsx';
import * as AuthContext from '../../../../src/context/AuthContext.tsx';

describe('CoachSettingsSection Component', () => {
  const mockRequestCoachRole = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 'coach-1', uid: 'coach-1', email: 'coach@example.com', displayName: 'Coach Alex' } as any,
      token: 'mock-token',
      loading: false,
      roleInfo: { userId: 'coach-1', role: 'coach', specialty: 'strength', isApproved: true, createdAt: new Date(), updatedAt: new Date() },
      userRole: 'coach',
      specialty: 'strength',
      isApprovedCoach: true,
      isCoach: true,
      isAdmin: false,
      isAthlete: false,
      refreshUserRole: vi.fn(),
      requestCoachRole: mockRequestCoachRole,
      loginWithGoogle: vi.fn(),
      switchAccount: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders coach specialty selector, invite button, rest preset slider, and compliance alerts', () => {
    render(<CoachSettingsSection />);

    expect(screen.getByText(/coaching specialty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invite client to roster/i })).toBeInTheDocument();
    expect(screen.getByText(/routine programming presets/i)).toBeInTheDocument();
    expect(screen.getByText(/client compliance alerts/i)).toBeInTheDocument();
  });

  it('allows changing specialty and calls requestCoachRole', async () => {
    const user = userEvent.setup();
    render(<CoachSettingsSection />);

    const nutritionBtn = screen.getByRole('button', { name: /nutrition/i });
    await user.click(nutritionBtn);

    await waitFor(() => {
      expect(mockRequestCoachRole).toHaveBeenCalledWith('nutrition');
    });
  });
});
