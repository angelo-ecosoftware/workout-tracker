// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoutineEditorModal } from '../../../../src/components/modals/RoutineEditorModal.tsx';
import { workoutFactory, exerciseFactory } from '../../../shared/fixtures/factories.ts';

const workout = workoutFactory.build({
  id: 'wk_persistence',
  name: 'Persisted Routine',
  exercises: [exerciseFactory.build({ id: 'ex_persistence', name: 'Squat' })],
});

const renderEditor = () => render(
  <RoutineEditorModal
    isOpen
    onClose={vi.fn()}
    userId="usr_persistence"
    workouts={[workout]}
    onSaveWorkouts={vi.fn().mockResolvedValue(undefined)}
  />,
);

describe('RoutineEditorModal durable draft behavior', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('restores an autosaved edit after the modal is remounted', async () => {
    const first = renderEditor();

    fireEvent.click(screen.getByRole('button', { name: /add routine day/i }));
    const nameInput = screen.getByDisplayValue('Day 2 - Custom Routine');
    fireEvent.change(nameInput, { target: { value: 'AI research follow-up' } });
    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    first.unmount();
    renderEditor();

    expect(screen.getByDisplayValue('AI research follow-up')).toBeInTheDocument();
  });

  it('ignores a draft containing a workout absent from the authoritative catalog', () => {
    localStorage.setItem('routine_editor_draft_usr_persistence', JSON.stringify({
      version: 1,
      resourceType: 'routine-collection',
      userId: 'usr_persistence',
      selectedWorkoutId: 'deleted-workout',
      updatedAt: new Date().toISOString(),
      workouts: [{ id: 'deleted-workout', name: 'Deleted', exercises: [] }],
    }));

    renderEditor();

    expect(screen.getByDisplayValue('Persisted Routine')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('Deleted')).not.toBeInTheDocument();
  });
});
