import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachClientRoster } from '../../../../src/components/coach/CoachClientRoster.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';
import { CoachAthleteLink } from '../../../../src/models.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  fetchCoachAthleteLinks: vi.fn(),
  revokeCoachLink: vi.fn(),
  createCoachInvite: vi.fn(),
  createRoutineProposal: vi.fn(),
}));

describe('CoachClientRoster Component', () => {
  const mockClients: CoachAthleteLink[] = [
    {
      id: 'link-1',
      coachId: 'coach-123',
      athleteId: 'athlete-1',
      athleteName: 'Sarah Connor',
      athleteEmail: 'sarah@example.com',
      specialty: 'strength',
      status: 'accepted',
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date('2026-08-01'),
    },
    {
      id: 'link-2',
      coachId: 'coach-123',
      athleteId: 'athlete-2',
      athleteName: 'John Matrix',
      athleteEmail: 'john@example.com',
      specialty: 'strength',
      status: 'pending',
      createdAt: new Date('2026-08-10'),
      updatedAt: new Date('2026-08-10'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SupabaseData.fetchCoachAthleteLinks).mockResolvedValue({
      coaches: [],
      clients: mockClients,
    });
  });

  it('renders client roster with adherence badges and athlete details', async () => {
    render(
      <CoachClientRoster
        coachId="coach-123"
        coachName="Coach Alex"
        specialty="strength"
        onInspectClient={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
      expect(screen.getByText('John Matrix')).toBeInTheDocument();
      expect(screen.getByText(/🟢 On Track/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending Acceptance/i)).toBeInTheDocument();
    });
  });

  it('triggers onInspectClient callback when Inspect button is clicked', async () => {
    const user = userEvent.setup();
    const onInspectClient = vi.fn();

    render(
      <CoachClientRoster
        coachId="coach-123"
        coachName="Coach Alex"
        specialty="strength"
        onInspectClient={onInspectClient}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /inspect/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /inspect/i }));

    expect(onInspectClient).toHaveBeenCalledWith('athlete-1', 'Sarah Connor');
  });

  it('opens routine proposal modal when Propose Routine is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CoachClientRoster
        coachId="coach-123"
        coachName="Coach Alex"
        specialty="strength"
        onInspectClient={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /propose routine/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /propose routine/i }));

    await waitFor(() => {
      expect(screen.getByText(/propose routine for sarah connor/i)).toBeInTheDocument();
    });
  });
});
