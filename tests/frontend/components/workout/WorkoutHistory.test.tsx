import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutHistory } from '../../../../src/components/workout/WorkoutHistory.tsx';
import * as AuthContext from '../../../../src/context/AuthContext.tsx';
import * as SupabaseData from '../../../../src/lib/supabaseData.ts';
import { Session, WorkoutSet } from '../../../../src/models.ts';

vi.mock('../../../../src/lib/supabaseData.ts', () => ({
  fetchWorkoutHistory: vi.fn(),
  fetchSetsForSession: vi.fn(),
  deleteSessions: vi.fn(),
  updateSessionDate: vi.fn(),
  updateSessionNotes: vi.fn(),
  updateSessionPhotos: vi.fn(),
  fetchWorkoutsData: vi.fn(),
  fetchBodyMeasurementLogs: vi.fn(),
  logDailyBodyWeight: vi.fn(),
  initializeUser: vi.fn(),
}));

describe('WorkoutHistory Component', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'athlete@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: mockUser as any,
      token: 'mock-token',
      loading: false,
      loginWithGoogle: vi.fn(),
      switchAccount: vi.fn(),
      logout: vi.fn(),
    });

    vi.mocked(SupabaseData.fetchWorkoutsData).mockResolvedValue({
      workoutsList: [],
      exercisesList: [],
      workoutExercisesList: [],
    } as any);

    vi.mocked(SupabaseData.fetchBodyMeasurementLogs).mockResolvedValue([]);
    vi.mocked(SupabaseData.initializeUser).mockResolvedValue({
      userId: 'test-user-123',
      email: 'athlete@example.com',
      name: 'Test Athlete',
      lastCompletedWorkoutOrder: 1,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
      createdAt: new Date(),
    });
  });

  it('renders loading spinner while hydrating workout logs', () => {
    vi.mocked(SupabaseData.fetchWorkoutHistory).mockReturnValue(new Promise(() => {}));

    render(<WorkoutHistory />);
    expect(screen.getByText(/loading history\.\.\./i)).toBeInTheDocument();
  });

  it('renders empty history state when no past sessions exist', async () => {
    vi.mocked(SupabaseData.fetchWorkoutHistory).mockResolvedValue([]);

    render(<WorkoutHistory />);

    await waitFor(() => {
      expect(screen.getByText(/no workouts yet/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/complete your first workout to see it logged here/i)).toBeInTheDocument();
  });

  it('renders list of completed sessions with titles, dates, and total volume', async () => {
    vi.mocked(SupabaseData.fetchWorkoutsData).mockResolvedValue({
      workoutsList: [
        {
          id: 'workout-push',
          userId: 'test-user-123',
          name: 'Push Day A',
          order: 1,
          exerciseIds: ['ex-bench'],
          createdAt: new Date(),
        },
      ],
      exercisesList: [
        {
          id: 'ex-bench',
          userId: 'test-user-123',
          name: 'Barbell Bench Press',
          type: 'strength',
          targetSets: 3,
          targetReps: '8-12',
          createdAt: new Date(),
        },
      ],
      workoutExercisesList: [],
    } as any);

    const mockSessions: Session[] = [
      {
        id: 'session-1',
        userId: 'test-user-123',
        workoutId: 'workout-push',
        status: 'completed',
        notes: 'Felt strong on bench press',
        startedAt: new Date('2026-09-01T09:00:00Z'),
        completedAt: new Date('2026-09-01T10:00:00Z'),
      },
    ];

    const mockSets: WorkoutSet[] = [
      {
        id: 'set-1',
        sessionId: 'session-1',
        userId: 'test-user-123',
        exerciseId: 'ex-bench',
        weight: 100,
        reps: 8,
        durationSeconds: null,
        setNumber: 1,
        loggedAt: new Date(),
      },
      {
        id: 'set-2',
        sessionId: 'session-1',
        userId: 'test-user-123',
        exerciseId: 'ex-bench',
        weight: 100,
        reps: 8,
        durationSeconds: null,
        setNumber: 2,
        loggedAt: new Date(),
      },
    ];

    vi.mocked(SupabaseData.fetchWorkoutHistory).mockResolvedValue(mockSessions);
    vi.mocked(SupabaseData.fetchSetsForSession).mockResolvedValue(mockSets);

    render(<WorkoutHistory />);

    await waitFor(() => {
      expect(screen.getByText(/push day a/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/2 sets/i)).toBeInTheDocument();
  });

  it('toggles session expansion detail view on click and allows inline note editing', async () => {
    const user = userEvent.setup();
    vi.mocked(SupabaseData.fetchWorkoutsData).mockResolvedValue({
      workoutsList: [
        {
          id: 'workout-pull',
          userId: 'test-user-123',
          name: 'Pull Day Hypertrophy',
          order: 2,
          exerciseIds: ['ex-lat-pulldown'],
          createdAt: new Date(),
        },
      ],
      exercisesList: [
        {
          id: 'ex-lat-pulldown',
          userId: 'test-user-123',
          name: 'Lat Pulldown',
          type: 'strength',
          targetSets: 3,
          targetReps: '10-12',
          createdAt: new Date(),
        },
      ],
      workoutExercisesList: [],
    } as any);

    const mockSessions: Session[] = [
      {
        id: 'session-expand',
        userId: 'test-user-123',
        workoutId: 'workout-pull',
        status: 'completed',
        notes: 'Focused on lat contraction',
        startedAt: new Date('2026-09-02T09:00:00Z'),
        completedAt: new Date('2026-09-02T10:00:00Z'),
      },
    ];

    const mockSets: WorkoutSet[] = [
      {
        id: 'set-pull-1',
        sessionId: 'session-expand',
        userId: 'test-user-123',
        exerciseId: 'ex-lat-pulldown',
        weight: 75,
        reps: 10,
        durationSeconds: null,
        setNumber: 1,
        loggedAt: new Date(),
      },
    ];

    vi.mocked(SupabaseData.fetchWorkoutHistory).mockResolvedValue(mockSessions);
    vi.mocked(SupabaseData.fetchSetsForSession).mockResolvedValue(mockSets);
    vi.mocked(SupabaseData.updateSessionNotes).mockResolvedValue(undefined as any);

    render(<WorkoutHistory />);

    await waitFor(() => {
      expect(screen.getByText(/pull day hypertrophy/i)).toBeInTheDocument();
    });

    const card = screen.getByText(/pull day hypertrophy/i);
    await user.click(card);

    await waitFor(() => {
      expect(screen.getByText(/focused on lat contraction/i)).toBeInTheDocument();
    });

    // Test inline notes editing workflow
    const editNotesBtn = screen.getByTitle(/edit notes/i);
    await user.click(editNotesBtn);

    const notesTextarea = screen.getByDisplayValue('Focused on lat contraction');
    await user.clear(notesTextarea);
    await user.type(notesTextarea, 'Great mind-muscle connection and clean form');

    const saveNotesBtn = screen.getByRole('button', { name: /^save$/i });
    await user.click(saveNotesBtn);

    await waitFor(() => {
      expect(SupabaseData.updateSessionNotes).toHaveBeenCalledWith(
        'session-expand',
        'Great mind-muscle connection and clean form'
      );
    });
  });
});
