import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  WorkoutCompletionModal,
  WorkoutSummaryCelebration,
} from '../../../../src/components/workout/tracker/WorkoutCompletionModal.tsx';

describe('P1.1: Workout Completion PR Celebration Modal', () => {
  const mockSummary: WorkoutSummaryCelebration = {
    workoutName: 'Day 1: Upper Power',
    totalVolumeKg: 12450,
    totalReps: 84,
    completedSetsCount: 12,
    prsAchieved: [
      {
        exerciseName: 'Barbell Bench Press',
        weight: 100,
        reps: 6,
        estimated1RM: 120,
        previous1RM: 115,
        improvementKg: 5,
        isNew1RMRecord: true,
      },
      {
        exerciseName: 'Overhead Press',
        weight: 60,
        reps: 8,
        estimated1RM: 76,
        previous1RM: undefined,
        improvementKg: undefined,
        isNew1RMRecord: true,
      },
    ],
  };

  it('renders total tonnage, reps, completed sets, and PR milestone cards', () => {
    const handleClose = vi.fn();
    render(
      <WorkoutCompletionModal
        isOpen={true}
        summary={mockSummary}
        onClose={handleClose}
      />
    );

    // Header & workout name
    expect(screen.getByText(/session/i)).toBeInTheDocument();
    expect(screen.getByText(/crushed!/i)).toBeInTheDocument();
    expect(screen.getByText(/day 1: upper power/i)).toBeInTheDocument();

    // Volume & stats badges
    expect(screen.getByText(/12,450/i)).toBeInTheDocument();
    expect(screen.getByText(/total volume/i)).toBeInTheDocument();
    expect(screen.getByText(/84/i)).toBeInTheDocument();
    expect(screen.getByText(/total reps/i)).toBeInTheDocument();
    expect(screen.getByText(/sets/i)).toBeInTheDocument();

    // PR milestones
    expect(screen.getByText(/barbell bench press/i)).toBeInTheDocument();
    expect(screen.getByText(/120 kg 1rm/i)).toBeInTheDocument();
    expect(screen.getByText(/\+5\.0 kg/i)).toBeInTheDocument();

    expect(screen.getByText(/overhead press/i)).toBeInTheDocument();
    expect(screen.getByText(/first log/i)).toBeInTheDocument();
  });

  it('calls onClose when continuing to logbook button is clicked', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <WorkoutCompletionModal
        isOpen={true}
        summary={mockSummary}
        onClose={handleClose}
      />
    );

    const continueBtn = screen.getByRole('button', { name: /continue to logbook/i });
    await user.click(continueBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('allows dismissing the summary without continuing to the logbook', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <WorkoutCompletionModal
        isOpen={true}
        summary={mockSummary}
        onClose={handleClose}
      />
    );

    await user.click(screen.getByRole('button', { name: /close workout summary/i }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('keeps dismiss and continue actions separate', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleContinue = vi.fn();

    const { rerender } = render(
      <WorkoutCompletionModal
        isOpen={true}
        summary={mockSummary}
        onClose={handleClose}
        onContinueToLogbook={handleContinue}
      />
    );

    await user.click(screen.getByRole('button', { name: /close workout summary/i }));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleContinue).not.toHaveBeenCalled();

    rerender(
      <WorkoutCompletionModal
        isOpen={true}
        summary={mockSummary}
        onClose={handleClose}
        onContinueToLogbook={handleContinue}
      />
    );
    await user.click(screen.getByRole('button', { name: /continue to logbook/i }));
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });

  it('renders encouraging consistency message when no new PRs are achieved', () => {
    const summaryNoPRs: WorkoutSummaryCelebration = {
      workoutName: 'Day 2: Lower Hypertrophy',
      totalVolumeKg: 8500,
      totalReps: 60,
      completedSetsCount: 10,
      prsAchieved: [],
    };

    render(
      <WorkoutCompletionModal
        isOpen={true}
        summary={summaryNoPRs}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText(/consistency is key\. every set builds toward your next milestone!/i)
    ).toBeInTheDocument();
  });
});
