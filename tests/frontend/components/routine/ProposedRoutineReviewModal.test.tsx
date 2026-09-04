import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProposedRoutineReviewModal } from '../../../../src/components/routine/ProposedRoutineReviewModal.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';
import { RoutineProposal } from '../../../../src/models.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  updateRoutineProposalStatus: vi.fn(),
  saveRoutineProgramToLibrary: vi.fn(),
  saveWorkoutsAndExercises: vi.fn(),
  setActiveRoutineProgram: vi.fn(),
}));

describe('ProposedRoutineReviewModal Component', () => {
  const mockProposal: RoutineProposal = {
    id: 'prop-1',
    coachId: 'coach-123',
    coachName: 'Coach Alex',
    athleteId: 'athlete-1',
    title: '4-Day Upper/Lower Strength Split',
    description: 'Strength block tailored to your squat form',
    status: 'proposed',
    programPayload: {
      workouts: [
        {
          id: 'w-1',
          name: 'Day 1: Upper Strength',
          order: 1,
          exercises: [
            { id: 'ex-1', name: 'Bench Press', type: 'strength', targetSets: 4, targetRepMin: 6, targetRepMax: 8 },
          ],
        },
      ],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders proposal details, coach attribution, and prescribed workouts', () => {
    render(
      <ProposedRoutineReviewModal
        isOpen={true}
        onClose={vi.fn()}
        userId="athlete-1"
        proposal={mockProposal}
      />
    );

    expect(screen.getByText('4-Day Upper/Lower Strength Split')).toBeInTheDocument();
    expect(screen.getByText(/proposed by coach alex/i)).toBeInTheDocument();
    expect(screen.getByText('Day 1: Upper Strength')).toBeInTheDocument();
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('allows athlete to save proposal to library and activate', async () => {
    const user = userEvent.setup();
    const onProposalApplied = vi.fn();
    vi.mocked(SupabaseData.saveRoutineProgramToLibrary).mockResolvedValue({
      id: 'saved-prog-1',
      userId: 'athlete-1',
      title: mockProposal.title,
      isActive: true,
      programData: mockProposal.programPayload,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(SupabaseData.saveWorkoutsAndExercises).mockResolvedValue();
    vi.mocked(SupabaseData.setActiveRoutineProgram).mockResolvedValue();
    vi.mocked(SupabaseData.updateRoutineProposalStatus).mockResolvedValue();

    render(
      <ProposedRoutineReviewModal
        isOpen={true}
        onClose={vi.fn()}
        userId="athlete-1"
        proposal={mockProposal}
        onProposalApplied={onProposalApplied}
      />
    );

    const applyBtn = screen.getByRole('button', { name: /save to my routines & activate/i });
    await user.click(applyBtn);

    await waitFor(() => {
      expect(SupabaseData.saveRoutineProgramToLibrary).toHaveBeenCalledWith(
        'athlete-1',
        mockProposal.title,
        mockProposal.programPayload,
        mockProposal.description,
        mockProposal.coachId
      );
      expect(SupabaseData.updateRoutineProposalStatus).toHaveBeenCalledWith('prop-1', 'applied');
    });
  });
});
