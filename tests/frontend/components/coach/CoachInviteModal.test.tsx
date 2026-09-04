import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachInviteModal } from '../../../../src/components/coach/CoachInviteModal.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  createCoachInvite: vi.fn(),
}));

describe('CoachInviteModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with email form and shareable link generator', () => {
    render(
      <CoachInviteModal
        isOpen={true}
        onClose={vi.fn()}
        coachId="coach-123"
        coachName="Coach Alex"
        specialty="strength"
      />
    );

    expect(screen.getByText(/invite athlete client/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/athlete@example\.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send email invite/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy shareable link/i })).toBeInTheDocument();
  });

  it('generates coach invitation on email form submit', async () => {
    const user = userEvent.setup();
    vi.mocked(SupabaseData.createCoachInvite).mockResolvedValue({
      id: 'link-1',
      coachId: 'coach-123',
      athleteId: 'pending',
      specialty: 'strength',
      status: 'pending',
      inviteCode: 'INVITE_123',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <CoachInviteModal
        isOpen={true}
        onClose={vi.fn()}
        coachId="coach-123"
        coachName="Coach Alex"
        specialty="strength"
      />
    );

    const emailInput = screen.getByPlaceholderText(/athlete@example\.com/i);
    await user.type(emailInput, 'athlete@example.com');

    await user.click(screen.getByRole('button', { name: /send email invite/i }));

    await waitFor(() => {
      expect(SupabaseData.createCoachInvite).toHaveBeenCalledWith(
        'coach-123',
        'strength',
        'athlete@example.com',
        'Coach Alex'
      );
      expect(screen.getByText(/invitation created successfully/i)).toBeInTheDocument();
    });
  });
});
