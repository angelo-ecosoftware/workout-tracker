import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutineSplitSelector } from '../../../../src/components/workout/tracker/RoutineSplitSelector.tsx';
import { Workout, Exercise } from '../../../../src/models.ts';

const mockExercises: Exercise[] = [
  { id: 'ex-1', name: 'Bench Press', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
];

const mockWorkouts: (Workout & { exercises: Exercise[] })[] = [
  { id: 'w-1', userId: 'u-1', name: 'Day 1 - Upper Body A', order: 1, exerciseIds: ['ex-1'], exercises: mockExercises },
  { id: 'w-2', userId: 'u-1', name: 'Day 2 - Lower Body A + Abs', order: 2, exerciseIds: ['ex-1'], exercises: mockExercises },
  { id: 'w-3', userId: 'u-1', name: 'Day 3 - Upper Body B', order: 3, exerciseIds: ['ex-1'], exercises: mockExercises },
];

describe('RoutineSplitSelector - Suggested Day & Deletion Gap Defense', () => {
  it('correctly suggests Day 1 with green dot when no previous session exists (order 0)', () => {
    const onEdit = vi.fn();
    render(
      <RoutineSplitSelector
        workouts={mockWorkouts}
        activeWorkout={mockWorkouts[0]}
        suggestedDay={1}
        lastSessionDay={null}
        onSelectWorkout={vi.fn()}
        onOpenRoutineEditor={onEdit}
      />
    );

    // Shows split progression header without claiming a phantom completed routine
    expect(screen.getByText(/current split progression/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit routines & exercises/i })).toBeInTheDocument();
    expect(screen.getAllByText(/day 1 - upper body a/i)[0]).toBeInTheDocument();
  });

  it('correctly suggests Day 2 with green dot when Day 1 was completed', () => {
    const onEdit = vi.fn();
    render(
      <RoutineSplitSelector
        workouts={mockWorkouts}
        activeWorkout={mockWorkouts[0]}
        suggestedDay={2}
        lastSessionDay={1}
        onSelectWorkout={vi.fn()}
        onOpenRoutineEditor={onEdit}
      />
    );

    // Shows Last Completed Routine: Day 1
    expect(screen.getByText(/last completed routine:/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit routines & exercises/i })).toBeInTheDocument();

    // Day 2 has the pinging green dot indicator because suggestedDay=2 and activeWorkout is Day 1
    const day2Button = screen.getByRole('button', { name: /day 2 - lower body a \+ abs/i });
    expect(day2Button.querySelector('.animate-ping')).toBeInTheDocument();
  });

  it('clears stale completed routine and resets suggestion when records are deleted (order resets to 0)', () => {
    const onEdit = vi.fn();
    // When the user deletes their previous session, lastSessionDay becomes null or 0 and suggestedDay returns to 1
    const { rerender } = render(
      <RoutineSplitSelector
        workouts={mockWorkouts}
        activeWorkout={mockWorkouts[1]}
        suggestedDay={2}
        lastSessionDay={1}
        onSelectWorkout={vi.fn()}
        onOpenRoutineEditor={onEdit}
      />
    );

    expect(screen.getByText(/last completed routine:/i)).toBeInTheDocument();

    // Simulating state after session deletion
    rerender(
      <RoutineSplitSelector
        workouts={mockWorkouts}
        activeWorkout={mockWorkouts[0]}
        suggestedDay={1}
        lastSessionDay={null}
        onSelectWorkout={vi.fn()}
        onOpenRoutineEditor={onEdit}
      />
    );

    // Stale "Day 1 completed" message must be gone
    expect(screen.queryByText(/last completed routine:/i)).not.toBeInTheDocument();
    expect(screen.getByText(/current split progression/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit routines & exercises/i })).toBeInTheDocument();
  });

  it('allows clicking another routine button to select it', async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <RoutineSplitSelector
        workouts={mockWorkouts}
        activeWorkout={mockWorkouts[0]}
        suggestedDay={1}
        lastSessionDay={null}
        onSelectWorkout={handleSelect}
      />
    );

    const day2Button = screen.getByRole('button', { name: /day 2 - lower body a \+ abs/i });
    await user.click(day2Button);

    expect(handleSelect).toHaveBeenCalledWith(mockWorkouts[1]);
  });
});
