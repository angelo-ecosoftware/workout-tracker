import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutDayTracker } from '../../../../src/components/workout/WorkoutDayTracker.tsx';
import * as AuthContext from '../../../../src/context/AuthContext.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  fetchWorkoutsData: vi.fn(),
  initializeUser: vi.fn(),
  fetchWorkoutHistory: vi.fn(),
  fetchSetsForSession: vi.fn(),
  logDailyBodyWeight: vi.fn(),
  logWorkoutSession: vi.fn(),
  logSessionCompletion: vi.fn(),
  uploadWorkoutPhotos: vi.fn(),
  saveWorkoutsAndExercises: vi.fn(),
  fetchBodyMeasurementLogs: vi.fn(),
  seedTemplatesIfMissing: vi.fn(),
  getUserProgressState: vi.fn(),
}));

describe('WorkoutDayTracker Component', () => {
  const mockUser = {
    uid: 'athlete-123',
    email: 'athlete@example.com',
    displayName: 'Test Athlete',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser as any,
      loading: false,
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(SupabaseData.initializeUser).mockResolvedValue({
      userId: 'athlete-123',
      email: 'athlete@example.com',
      name: 'Test Athlete',
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
      createdAt: new Date(),
    });

    vi.mocked(SupabaseData.getUserProgressState).mockResolvedValue({
      profile: {
        userId: 'athlete-123',
        email: 'athlete@example.com',
        name: 'Test Athlete',
        lastCompletedWorkoutOrder: 0,
        maxWorkoutOrder: 3,
        lastSetSummaryPerExercise: {},
        createdAt: new Date(),
      },
      lastSessionDay: 0,
      suggestedDay: 1,
    } as any);

    vi.mocked(SupabaseData.fetchWorkoutHistory).mockResolvedValue([]);
    vi.mocked(SupabaseData.fetchBodyMeasurementLogs).mockResolvedValue([]);
  });

  it('renders empty routine setup state when no routines exist', async () => {
    vi.mocked(SupabaseData.fetchWorkoutsData).mockResolvedValue({
      workoutsList: [],
      exercisesList: [],
      workoutExercisesList: [],
      combinedWorkouts: [],
    } as any);

    render(<WorkoutDayTracker />);

    await waitFor(() => {
      expect(screen.getByText(/no routines configured/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /configure your routine now/i })).toBeInTheDocument();
  });

  it('renders active workout and allows editing exercise set weight, reps, notes, and submitting session', async () => {
    const user = userEvent.setup();
    const mockWorkout = {
      id: 'w-push',
      userId: 'athlete-123',
      name: 'Day 1: Push Hypertrophy',
      order: 1,
      exerciseIds: ['ex-bench'],
      createdAt: new Date(),
      exercises: [
        {
          id: 'ex-bench',
          userId: 'athlete-123',
          name: 'Incline Dumbbell Press',
          type: 'strength',
          targetSets: 1,
          targetRepMin: 8,
          targetRepMax: 12,
          restDurationSeconds: 90,
          createdAt: new Date(),
        },
      ],
    };

    vi.mocked(SupabaseData.fetchWorkoutsData).mockResolvedValue({
      workoutsList: [mockWorkout],
      exercisesList: mockWorkout.exercises,
      workoutExercisesList: [],
      combinedWorkouts: [mockWorkout],
    } as any);

    vi.mocked(SupabaseData.logSessionCompletion).mockResolvedValue({
      session: {
        id: 'session-logged-1',
        userId: 'athlete-123',
        workoutId: 'w-push',
      },
    } as any);

    render(<WorkoutDayTracker />);

    await waitFor(() => {
      expect(screen.getAllByText(/day 1: push hypertrophy/i)[0]).toBeInTheDocument();
    });

    expect(screen.getByText(/incline dumbbell press/i)).toBeInTheDocument();

    // Locate weight and reps inputs for SET 1 (first exercise is auto-expanded)
    const setLabel = await screen.findByText(/set 1/i);
    expect(setLabel).toBeInTheDocument();

    const setRow = setLabel.closest('div[class*="rounded-xl"]');
    expect(setRow).toBeInTheDocument();

    const rowInputs = setRow!.querySelectorAll('input[type="text"]');
    const weightInput = rowInputs[0] as HTMLInputElement;
    const repsInput = rowInputs[1] as HTMLInputElement;

    // Edit weight to 100 kg and reps to 10
    await user.clear(weightInput);
    await user.type(weightInput, '100');
    expect(weightInput).toHaveValue('100');

    await user.clear(repsInput);
    await user.type(repsInput, '10');
    expect(repsInput).toHaveValue('10');

    const submitBtn = screen.getByRole('button', { name: /submit workout/i });
    expect(submitBtn).toBeInTheDocument();

    // Type workout session notes
    const notesInput = screen.getByPlaceholderText(/e\.g\., felt strong on pushups/i);
    await user.clear(notesInput);
    await user.type(notesInput, 'Crushed incline press today');
    expect(notesInput).toHaveValue('Crushed incline press today');

    // Click submit workout button and verify submission pipeline dispatch
    await user.click(submitBtn);

    await waitFor(() => {
      expect(SupabaseData.logSessionCompletion).toHaveBeenCalledTimes(1);
    });

    const [userId, workoutId, setsPayload, exercisesPayload, , notes] =
      vi.mocked(SupabaseData.logSessionCompletion).mock.calls[0];

    expect(userId).toBe('athlete-123');
    expect(workoutId).toBe('w-push');
    expect(notes).toBe('Crushed incline press today');
    expect(setsPayload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exerciseId: 'ex-bench',
          setNumber: 1,
          weight: 100,
          reps: 10,
        }),
      ])
    );
    expect(exercisesPayload[0].name).toBe('Incline Dumbbell Press');
  });
});
