import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachInviteAcceptModal } from '../../../../src/components/modals/CoachInviteAcceptModal.tsx';
import * as RolesDb from '../../../../src/lib/db/roles.ts';

vi.mock('../../../../src/lib/db/roles.ts', () => ({
  acceptCoachLinkByCode: vi.fn(),
  fetchInviteByCode: vi.fn(),
}));

describe('CoachInviteAcceptModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with coach name and specialty when opened via link', () => {
    render(
      <CoachInviteAcceptModal
        isOpen={true}
        onClose={vi.fn()}
        inviteCode="invite_1T6JU6"
        athleteId="athlete-123"
        athleteName="Sarah Connor"
        coachInviteData={{
          id: 'link-1',
          coachId: 'coach-1',
          coachName: 'Coach Alex',
          athleteId: '',
          specialty: 'strength',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        }}
      />
    );

    expect(screen.getByText(/coaching invitation/i)).toBeInTheDocument();
    expect(screen.getAllByText(/coach alex/i).length).toBeGreaterThan(0);
    expect(screen.getByText('invite_1T6JU6')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept connection/i })).toBeInTheDocument();
  });

  it('calls acceptCoachLinkByCode on accepting connection', async () => {
    const user = userEvent.setup();
    const onAccepted = vi.fn();
    vi.mocked(RolesDb.acceptCoachLinkByCode).mockResolvedValue({
      id: 'link-1',
      coachId: 'coach-1',
      coachName: 'Coach Alex',
      athleteId: 'athlete-123',
      specialty: 'strength',
      status: 'accepted',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    render(
      <CoachInviteAcceptModal
        isOpen={true}
        onClose={vi.fn()}
        inviteCode="invite_1T6JU6"
        athleteId="athlete-123"
        athleteName="Sarah Connor"
        coachInviteData={{
          id: 'link-1',
          coachId: 'coach-1',
          coachName: 'Coach Alex',
          athleteId: '',
          specialty: 'strength',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        }}
        onAccepted={onAccepted}
      />
    );

    const acceptBtn = screen.getByRole('button', { name: /accept connection/i });
    await user.click(acceptBtn);

    await waitFor(() => {
      expect(RolesDb.acceptCoachLinkByCode).toHaveBeenCalledWith('invite_1T6JU6', 'athlete-123', 'Sarah Connor');
    });
  });
});
