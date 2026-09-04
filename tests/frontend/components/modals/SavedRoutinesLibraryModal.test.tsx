import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavedRoutinesLibraryModal } from '../../../../src/components/modals/SavedRoutinesLibraryModal.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';
import { SavedRoutineProgram } from '../../../../src/models.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  fetchSavedRoutinePrograms: vi.fn(),
  saveRoutineProgramToLibrary: vi.fn(),
  setActiveRoutineProgram: vi.fn(),
  deleteSavedRoutineProgram: vi.fn(),
  saveWorkoutsAndExercises: vi.fn(),
}));

describe('SavedRoutinesLibraryModal Component', () => {
  const mockWorkouts = [
    {
      id: 'w-1',
      name: 'Day 1: Push',
      order: 1,
      exercises: [
        { id: 'ex-1', name: 'Bench Press', type: 'strength' as const, targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      ],
    },
  ];

  const mockPrograms: SavedRoutineProgram[] = [
    {
      id: 'prog-1',
      userId: 'user-123',
      title: 'PPL Hypertrophy Block',
      description: '6-day push pull legs split',
      isActive: true,
      programData: { workouts: mockWorkouts },
      createdAt: new Date('2026-08-01'),
      updatedAt: new Date('2026-08-01'),
    },
    {
      id: 'prog-2',
      userId: 'user-123',
      title: '4-Day Upper/Lower Strength',
      description: 'Strength focused split',
      isActive: false,
      sourceCoachName: 'Coach Alex',
      programData: { workouts: [] },
      createdAt: new Date('2026-08-15'),
      updatedAt: new Date('2026-08-15'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SupabaseData.fetchSavedRoutinePrograms).mockResolvedValue(mockPrograms);
  });

  it('renders list of saved programs with active status and coach proposals', async () => {
    render(
      <SavedRoutinesLibraryModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-123"
        currentWorkouts={mockWorkouts}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('PPL Hypertrophy Block')).toBeInTheDocument();
      expect(screen.getByText('4-Day Upper/Lower Strength')).toBeInTheDocument();
      expect(screen.getByText(/active program/i)).toBeInTheDocument();
      expect(screen.getByText(/proposed by coach alex/i)).toBeInTheDocument();
    });
  });

  it('allows saving current workout split as a new program in the library', async () => {
    const user = userEvent.setup();
    const newSavedProg: SavedRoutineProgram = {
      id: 'prog-3',
      userId: 'user-123',
      title: 'Arnold Split v1',
      description: 'Chest/Back, Shoulders/Arms, Legs',
      isActive: false,
      programData: { workouts: mockWorkouts },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(SupabaseData.saveRoutineProgramToLibrary).mockResolvedValue(newSavedProg);

    render(
      <SavedRoutinesLibraryModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-123"
        currentWorkouts={mockWorkouts}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save current split/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /save current split/i }));

    const titleInput = screen.getByPlaceholderText(/4-day upper\/lower/i);
    await user.type(titleInput, 'Arnold Split v1');

    const descInput = screen.getByPlaceholderText(/8-week progressive/i);
    await user.type(descInput, 'Chest/Back, Shoulders/Arms, Legs');

    await user.click(screen.getByRole('button', { name: /save to library/i }));

    await waitFor(() => {
      expect(SupabaseData.saveRoutineProgramToLibrary).toHaveBeenCalledWith(
        'user-123',
        'Arnold Split v1',
        { workouts: mockWorkouts },
        'Chest/Back, Shoulders/Arms, Legs'
      );
      expect(screen.getByText('Arnold Split v1')).toBeInTheDocument();
    });
  });

  it('allows activating an inactive program and notifies callback', async () => {
    const user = userEvent.setup();
    const onProgramActivated = vi.fn();
    vi.mocked(SupabaseData.setActiveRoutineProgram).mockResolvedValue();
    vi.mocked(SupabaseData.saveWorkoutsAndExercises).mockResolvedValue();

    render(
      <SavedRoutinesLibraryModal
        isOpen={true}
        onClose={vi.fn()}
        userId="user-123"
        currentWorkouts={mockWorkouts}
        onProgramActivated={onProgramActivated}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /activate/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /activate/i }));

    await waitFor(() => {
      expect(SupabaseData.setActiveRoutineProgram).toHaveBeenCalledWith('user-123', 'prog-2');
    });
  });
});
