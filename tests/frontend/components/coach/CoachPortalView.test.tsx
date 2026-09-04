import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoachPortalView } from '../../../../src/components/coach/CoachPortalView.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  fetchCoachAthleteLinks: vi.fn(),
  revokeCoachLink: vi.fn(),
  createCoachInvite: vi.fn(),
  createRoutineProposal: vi.fn(),
}));

describe('CoachPortalView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SupabaseData.fetchCoachAthleteLinks).mockResolvedValue({
      coaches: [],
      clients: [
        {
          id: 'link-1',
          coachId: 'coach-123',
          athleteId: 'athlete-1',
          athleteName: 'Sarah Connor',
          specialty: 'strength',
          status: 'accepted',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });
  });

  it('renders dedicated trainer command center with navigation tabs', async () => {
    render(
      <CoachPortalView
        coachId="coach-123"
        coachName="Coach Alex"
        specialty="strength"
        onInspectClient={vi.fn()}
        onSwitchToPersonalMode={vi.fn()}
      />
    );

    expect(screen.getByText(/trainer command center/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /client roster/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /program templates/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nutrition plans/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activity feed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /personal workouts/i })).toBeInTheDocument();
  });

  it('triggers onSwitchToPersonalMode when clicking personal workouts button', async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();

    render(
      <CoachPortalView
        coachId="coach-123"
        coachName="Coach Alex"
        specialty="strength"
        onInspectClient={vi.fn()}
        onSwitchToPersonalMode={onSwitch}
      />
    );

    const personalBtn = screen.getByRole('button', { name: /personal workouts/i });
    await user.click(personalBtn);

    expect(onSwitch).toHaveBeenCalledTimes(1);
  });
});
