import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoutineEditorModal } from '../../../../src/components/modals/RoutineEditorModal.tsx';
import { workoutFactory, exerciseFactory } from '../../../shared/fixtures/factories.ts';

const benchPress = exerciseFactory.build({
  id: 'ex_bench',
  name: 'Barbell Bench Press',
  targetSets: 4,
  targetRepMin: 8,
  targetRepMax: 12,
});

const pushWorkout = workoutFactory.build({
  id: 'wk_push',
  name: 'Push Hypertrophy',
  order: 1,
  exerciseIds: ['ex_bench'],
  exercises: [benchPress],
});

describe('RoutineEditorModal Component (Dynamic Behavioral Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders routine editor with active workout days and exercises', () => {
    render(
      <RoutineEditorModal
        isOpen={true}
        onClose={vi.fn()}
        userId="usr_test"
        workouts={[pushWorkout]}
        onSaveWorkouts={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /edit routines/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Push Hypertrophy')).toBeInTheDocument();
    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
  });

  it('allows adding a new workout routine day, renaming it, and saving', async () => {
    const user = userEvent.setup();
    const onSaveWorkouts = vi.fn().mockResolvedValue(undefined);

    render(
      <RoutineEditorModal
        isOpen={true}
        onClose={vi.fn()}
        userId="usr_test"
        workouts={[pushWorkout]}
        onSaveWorkouts={onSaveWorkouts}
      />
    );

    const addDayBtn = screen.getByRole('button', { name: /add routine day/i });
    await user.click(addDayBtn);

    const nameInput = screen.getByDisplayValue('Day 2 - Custom Routine');
    expect(nameInput).toBeInTheDocument();

    await user.clear(nameInput);
    await user.type(nameInput, 'Day 2: Pull Hypertrophy');
    expect(nameInput).toHaveValue('Day 2: Pull Hypertrophy');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    expect(onSaveWorkouts).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'wk_push' }),
        expect.objectContaining({ name: 'Day 2: Pull Hypertrophy', order: 2 }),
      ])
    );
  });

  it('allows removing an exercise from a routine and saving updated exercise list', async () => {
    const user = userEvent.setup();
    const onSaveWorkouts = vi.fn().mockResolvedValue(undefined);

    render(
      <RoutineEditorModal
        isOpen={true}
        onClose={vi.fn()}
        userId="usr_test"
        workouts={[pushWorkout]}
        onSaveWorkouts={onSaveWorkouts}
      />
    );

    expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();

    // Click delete exercise button
    const deleteExBtn = screen.getByTitle(/delete exercise/i);
    await user.click(deleteExBtn);

    expect(screen.queryByText('Barbell Bench Press')).not.toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    expect(onSaveWorkouts).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'wk_push',
          exercises: [],
          exerciseIds: [],
        }),
      ])
    );
  });

  it('dispatches onSaveWorkouts when clicking save changes', async () => {
    const user = userEvent.setup();
    const onSaveWorkouts = vi.fn().mockResolvedValue(undefined);

    render(
      <RoutineEditorModal
        isOpen={true}
        onClose={vi.fn()}
        userId="usr_test"
        workouts={[pushWorkout]}
        onSaveWorkouts={onSaveWorkouts}
      />
    );

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    expect(onSaveWorkouts).toHaveBeenCalledTimes(1);
    expect(onSaveWorkouts).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 'wk_push' }),
      ])
    );
  });
});
