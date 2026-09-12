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
      token: 'mock-token',
      loading: false,
      roleInfo: null,
      userRole: 'athlete',
      specialty: null,
      isApprovedCoach: false,
      isCoach: false,
      isAdmin: false,
      isAthlete: true,
      refreshUserRole: vi.fn(),
      requestCoachRole: vi.fn(),
      loginWithGoogle: vi.fn(),
      loginWithEmailPassword: vi.fn(),
      logout: vi.fn(),
      switchAccount: vi.fn(),
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

    const exerciseHeader = screen.getByText(/incline dumbbell press/i);
    expect(exerciseHeader).toBeInTheDocument();

    // Click to expand exercise card (collapsed by default)
    await user.click(exerciseHeader);

    // Locate weight and reps inputs for SET 1
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

    // Exactly 1 START WORKOUT button exists on the screen (in the header card)
    const startBtns = screen.getAllByRole('button', { name: /start workout/i });
    expect(startBtns).toHaveLength(1);

    // Exactly 1 SUBMIT WORKOUT button exists on the screen (at the bottom) and is disabled before start
    const submitBtns = screen.getAllByRole('button', { name: /submit workout/i });
    expect(submitBtns).toHaveLength(1);
    expect(submitBtns[0]).toBeDisabled();

    // Start the workout session using the single Start Workout button
    expect(screen.getByText(/select routine/i)).toBeInTheDocument();
    await user.click(startBtns[0]);

    // Now workout is started: the single submit button becomes enabled and accessible
    expect(submitBtns[0]).toBeEnabled();
    expect(screen.queryByText(/select routine/i)).not.toBeInTheDocument();

    // Reset returns the routine selector so the user can choose another day.
    await user.click(screen.getByRole('button', { name: /reset workout timer/i }));
    expect(screen.getByText(/select routine/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /start workout/i }));

    // Ensure no duplicate submit/finish button was created in the header
    expect(screen.getAllByRole('button', { name: /submit workout/i })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /finish workout/i })).not.toBeInTheDocument();

    // Expand Recovery & Readiness card to type session notes (collapsed by default)
    const recoveryHeader = screen.getByText(/recovery & readiness/i);
    await user.click(recoveryHeader);

    // Type workout session notes
    const notesInput = screen.getByPlaceholderText(/e\.g\., felt strong on pushups/i);
    await user.clear(notesInput);
    await user.type(notesInput, 'Crushed incline press today');
    expect(notesInput).toHaveValue('Crushed incline press today');

    // Click the single submit workout button to open Finish Workout modal
    await user.click(submitBtns[0]);

    // Confirm in the Finish Workout modal
    const saveAndCompleteBtn = await screen.findByRole('button', { name: /save & complete session/i });
    expect(saveAndCompleteBtn).toBeInTheDocument();
    await user.click(saveAndCompleteBtn);

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
  }, 15000);
});
