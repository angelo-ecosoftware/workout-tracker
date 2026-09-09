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

describe('Sequential Set Mode & Motivational Praise Feature', () => {
  const mockUser = {
    uid: 'athlete-123',
    email: 'athlete@example.com',
    displayName: 'Test Athlete',
  };

  const mockWorkout = {
    id: 'w-sequential',
    userId: 'athlete-123',
    name: 'Day 1: Upper Body Focus',
    order: 1,
    exerciseIds: ['ex-1', 'ex-2'],
    createdAt: new Date(),
    exercises: [
      {
        id: 'ex-1',
        userId: 'athlete-123',
        name: 'Incline Dumbbell Press',
        type: 'strength',
        targetSets: 2,
        targetRepMin: 8,
        targetRepMax: 12,
        restDurationSeconds: 90,
        createdAt: new Date(),
      },
      {
        id: 'ex-2',
        userId: 'athlete-123',
        name: 'Cable Flyes',
        type: 'strength',
        targetSets: 2,
        targetRepMin: 10,
        targetRepMax: 15,
        restDurationSeconds: 60,
        createdAt: new Date(),
      },
    ],
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
    vi.mocked(SupabaseData.fetchWorkoutsData).mockResolvedValue({
      workoutsList: [mockWorkout],
      exercisesList: mockWorkout.exercises,
      workoutExercisesList: [],
      combinedWorkouts: [mockWorkout],
    } as any);
  });

  it('1. Renders Set(s) toggle next to Start Workout button and toggles state', async () => {
    const user = userEvent.setup();
    render(<WorkoutDayTracker />);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /set\(s\) mode/i })).toBeInTheDocument();
    });

    const setToggle = screen.getByRole('switch', { name: /set\(s\) mode/i });
    expect(setToggle).toHaveAttribute('aria-checked', 'false');

    // Click toggle to enable sequential set mode
    await user.click(setToggle);
    expect(setToggle).toHaveAttribute('aria-checked', 'true');
    expect(localStorage.getItem('setting_sequential_set_mode')).toBe('true');
  });

  it('2. Shows only Set 1 when sequential mode is enabled, reveals Set 2 on completion, and shows motivational praise toast', async () => {
    const user = userEvent.setup();
    render(<WorkoutDayTracker />);

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /set\(s\) mode/i })).toBeInTheDocument();
    });

    const setToggle = screen.getByRole('switch', { name: /set\(s\) mode/i });
    await user.click(setToggle);

    // Expand the first exercise card
    const ex1Header = screen.getByText(/incline dumbbell press/i);
    await user.click(ex1Header);

    // Only Set 1 should be visible initially in sequential mode
    expect(screen.getByText(/set 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/set 2/i)).not.toBeInTheDocument();

    // Start workout
    const startBtn = screen.getByRole('button', { name: /start workout/i });
    await user.click(startBtn);

    // Mark Set 1 complete
    const checkSet1Btn = screen.getByRole('checkbox', { name: /mark set 1 complete/i });
    await user.click(checkSet1Btn);

    // Now Set 2 should be revealed
    await waitFor(() => {
      expect(screen.getByText(/set 2/i)).toBeInTheDocument();
    });

    // A motivational toast popup is displayed
    const toast = screen.getByRole('status');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent(/incline dumbbell press • set 1 complete/i);
  });
});
