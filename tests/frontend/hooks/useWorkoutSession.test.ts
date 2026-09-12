import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkoutSession } from '../../../src/components/workout/tracker/useWorkoutSession.ts';
import { userFactory, workoutFactory, exerciseFactory } from '../../shared/fixtures/factories.ts';
import { AuthUser } from '../../../src/context/AuthContext.tsx';

const mockUser: AuthUser = {
  id: 'usr_test_athlete',
  uid: 'usr_test_athlete',
  email: 'athlete@test.com',
  displayName: 'Test Athlete',
};

const benchExercise = exerciseFactory.build({
  id: 'ex_bench',
  name: 'Barbell Bench Press',
  targetSets: 3,
  targetRepMin: 8,
  targetRepMax: 12,
  type: 'strength',
});

const sampleWorkout = workoutFactory.build({
  id: 'wk_push_1',
  name: 'Push Day 1',
  order: 1,
  exercises: [benchExercise],
});

let mockProfile = userFactory.build({
  userId: 'usr_test_athlete',
  lastCompletedWorkoutOrder: 0,
  maxWorkoutOrder: 3,
  lastSetSummaryPerExercise: {},
});

vi.mock('../../../src/lib/supabaseData.ts', () => ({
  fetchWorkoutsData: vi.fn(async () => ({
    combinedWorkouts: [sampleWorkout],
    workoutsList: [sampleWorkout],
    customExercisesList: [],
  })),
  getUserProgressState: vi.fn(async () => ({
    profile: mockProfile,
    isNewUser: false,
  })),
  fetchWorkoutHistory: vi.fn(async () => []),
  seedTemplatesIfMissing: vi.fn(async () => {}),
  logSessionCompletion: vi.fn(async () => ({ success: true })),
  logDailyBodyWeight: vi.fn(async () => {}),
}));

vi.mock('../../../src/lib/storage.ts', () => ({
  uploadWorkoutPhotos: vi.fn(async () => []),
}));

vi.mock('../../../src/utils/draftPhotoStorage.ts', () => ({
  saveDraftPhotosToStorage: vi.fn(async () => {}),
  loadDraftPhotosFromStorage: vi.fn(async () => []),
  clearDraftPhotosFromStorage: vi.fn(async () => {}),
}));

describe('useWorkoutSession Hook (Dynamic Reactive State Machine)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockProfile = userFactory.build({
      userId: 'usr_test_athlete',
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
    });
  });

  it('initializes and loads active workout routine for user', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.activeWorkout).not.toBeNull();
      // Exercises start collapsed by default for a clean overview
      expect(result.current.expandedExerciseId).toBeNull();
    });

    expect(result.current.workouts).toHaveLength(1);
    expect(result.current.activeWorkout?.id).toBe('wk_push_1');
    expect(result.current.userProfile?.userId).toBe('usr_test_athlete');
  });

  it('dynamically manages recovery metrics (sleep, energy, notes)', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Default values
    expect(result.current.sleepHours).toBe(8);
    expect(result.current.energyScore).toBe(7);

    // Update sleep and energy
    act(() => {
      result.current.setSleepHours(9);
      result.current.setEnergyScore(9);
      result.current.setSessionNotes('Felt incredible on all compound lifts.');
    });

    expect(result.current.sleepHours).toBe(9);
    expect(result.current.energyScore).toBe(9);
    expect(result.current.sessionNotes).toBe('Felt incredible on all compound lifts.');
  });

  it('handles set input changes via handleTextChange and updates state', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleTextChange('ex_bench-1', 'weight', '100');
      result.current.handleTextChange('ex_bench-1', 'reps', '10');
    });

    expect(result.current.inputs['ex_bench-1']?.weight).toBe('100');
    expect(result.current.inputs['ex_bench-1']?.reps).toBe('10');
  });

  it('debounces rapid draft writes into one final localStorage save', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    setItemSpy.mockClear();
    vi.useFakeTimers();

    try {
      act(() => {
        result.current.handleTextChange('ex_bench-1', 'weight', '100');
        result.current.handleTextChange('ex_bench-1', 'weight', '105');
      });

      expect(setItemSpy).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(250);
      });

      const draftWrites = setItemSpy.mock.calls.filter(([key]) =>
        String(key).startsWith('workout_draft_')
      );
      expect(draftWrites).toHaveLength(1);
      expect(JSON.parse(String(draftWrites[0][1])).inputs['ex_bench-1'].weight).toBe('105');
    } finally {
      vi.useRealTimers();
      setItemSpy.mockRestore();
    }
  });

  it('expands and collapses exercise cards dynamically', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Starts collapsed by default
    expect(result.current.expandedExerciseId).toBeNull();

    // Expand
    act(() => {
      result.current.setExpandedExerciseId('ex_bench');
    });
    expect(result.current.expandedExerciseId).toBe('ex_bench');

    // Collapse
    act(() => {
      result.current.setExpandedExerciseId(null);
    });
    expect(result.current.expandedExerciseId).toBeNull();
  });

  it('switches active workout to another routine dynamically', async () => {
    const legWorkout = workoutFactory.build({
      id: 'wk_legs_2',
      name: 'Leg Day Hypertrophy',
      order: 2,
      exercises: [],
    });

    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setActiveWorkout(legWorkout);
    });

    expect(result.current.activeWorkout?.id).toBe('wk_legs_2');
    expect(result.current.activeWorkout?.name).toBe('Leg Day Hypertrophy');
  });

  it('blocks handleLogWorkout when the session has not been started', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isSessionActive).toBe(false);

    await act(async () => {
      await result.current.handleLogWorkout();
    });

    expect(result.current.errorMsg).toContain('start the workout before submitting');
    expect(result.current.successMsg).toBeNull();
  });

  it('handles vice versa lifecycle: start activates session, cancel reverts to unstarted, submit completes session', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // 1. Initial state: not started, cannot submit
    expect(result.current.isSessionActive).toBe(false);

    // 2. Start workout: becomes active
    act(() => {
      result.current.handleStartWorkout();
    });
    expect(result.current.isSessionActive).toBe(true);

    // 3. Vice versa: cancel reverts to unstarted
    act(() => {
      result.current.handleCancelSession();
    });
    expect(result.current.isSessionActive).toBe(false);

    // 4. Start again and submit: finishes session and resets to unstarted
    act(() => {
      result.current.handleStartWorkout();
    });
    expect(result.current.isSessionActive).toBe(true);

    await act(async () => {
      await result.current.handleLogWorkout();
    });
    expect(result.current.isSessionActive).toBe(false);
    expect(result.current.successMsg).toContain('Workout successfully saved');
  });

  it('dispatches handleLogWorkout and resets session form state', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleStartWorkout();
      result.current.setSessionNotes('Solid workout session completed.');
    });

    await act(async () => {
      await result.current.handleLogWorkout();
    });

    expect(result.current.successMsg).toContain('Workout successfully saved');
    expect(result.current.sessionNotes).toBe('');
    expect(result.current.isSessionActive).toBe(false);
  });

  it('strictly isolates drafts per workout routine and prevents cross-day leakage', async () => {
    const pullExercise = exerciseFactory.build({
      id: 'ex_pullup',
      name: 'Pullups',
      targetSets: 3,
      targetRepMin: 6,
      targetRepMax: 10,
      type: 'strength',
    });

    const pullWorkout = workoutFactory.build({
      id: 'wk_pull_2',
      name: 'Pull Day 2',
      order: 2,
      exercises: [pullExercise],
    });

    // Save a draft for Day 1
    localStorage.setItem(
      `workout_draft_${mockUser.uid}_wk_push_1`,
      JSON.stringify({
        workoutId: 'wk_push_1',
        inputs: {
          'ex_bench-1': { weight: '140', reps: '5', durationSeconds: '', difficulty: '' },
        },
      })
    );

    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Day 1 has Day 1 draft
    expect(result.current.inputs['ex_bench-1']?.weight).toBe('140');

    // Switch to Day 2 which has no draft
    act(() => {
      result.current.setActiveWorkout(pullWorkout);
    });

    // Day 2 must have its own fresh default inputs and NOT inherit Day 1's draft
    expect(result.current.inputs['ex_pullup-1']?.weight).toBe('20');
    expect(result.current.inputs['ex_bench-1']).toBeUndefined();
  });

  it('clamps exercise difficulty adjustments strictly between 1 and 10', async () => {
    const timedExercise = exerciseFactory.build({
      id: 'ex_plank',
      name: 'Plank Hold',
      targetSets: 2,
      targetRepMin: 30,
      targetRepMax: 60,
      type: 'timed',
    });

    const timedWorkout = workoutFactory.build({
      id: 'wk_core',
      name: 'Core Workout',
      order: 1,
      exercises: [timedExercise],
    });

    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setActiveWorkout(timedWorkout);
    });

    // Default difficulty is 7
    expect(result.current.inputs['ex_plank-1']?.difficulty).toBe('7');

    // Step up past 10
    act(() => {
      result.current.updateInputValue('ex_plank-1', 'difficulty', 5);
    });
    expect(result.current.inputs['ex_plank-1']?.difficulty).toBe('10');

    // Step down below 1
    act(() => {
      result.current.updateInputValue('ex_plank-1', 'difficulty', -15);
    });
    expect(result.current.inputs['ex_plank-1']?.difficulty).toBe('1');
  });

  it('validates and bounds direct text input for exercise difficulty rating (1-10)', async () => {
    const timedExercise = exerciseFactory.build({
      id: 'ex_timed_test',
      name: 'Deadhang',
      targetSets: 1,
      targetRepMin: 30,
      targetRepMax: 60,
      type: 'timed',
    });

    const timedWorkout = workoutFactory.build({
      id: 'wk_timed_test',
      name: 'Timed Test',
      order: 1,
      exercises: [timedExercise],
    });

    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setActiveWorkout(timedWorkout);
    });

    // Test typing a value exceeding 10 -> bounds to 10
    act(() => {
      result.current.handleTextChange('ex_timed_test-1', 'difficulty', '15');
    });
    expect(result.current.inputs['ex_timed_test-1']?.difficulty).toBe('10');

    // Test typing a valid value 8 -> keeps 8
    act(() => {
      result.current.handleTextChange('ex_timed_test-1', 'difficulty', '8');
    });
    expect(result.current.inputs['ex_timed_test-1']?.difficulty).toBe('8');

    // Test typing non-numeric characters -> sanitized
    act(() => {
      result.current.handleTextChange('ex_timed_test-1', 'difficulty', 'abc');
    });
    expect(result.current.inputs['ex_timed_test-1']?.difficulty).toBe('');
  });

  it('triggers unrealistic value warning guard modal when outlier inputs are entered (>350kg or >100 reps)', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Start workout
    act(() => {
      result.current.handleStartWorkout();
    });

    // Enter unrealistic weight (500kg)
    act(() => {
      result.current.handleTextChange('ex_bench-1', 'weight', '500');
      result.current.handleTextChange('ex_bench-1', 'reps', '120');
    });

    await act(async () => {
      await result.current.handleLogWorkout();
    });

    // Confirmation guard should be triggered
    expect(result.current.unrealisticWarningConfig.isOpen).toBe(true);
    expect(result.current.unrealisticWarningConfig.warnings.length).toBeGreaterThan(0);
    expect(result.current.unrealisticWarningConfig.warnings[0]).toContain('unusually high');

    // Confirming should execute save
    await act(async () => {
      await result.current.unrealisticWarningConfig.onConfirm();
    });

    expect(result.current.successMsg).toContain('Workout successfully saved');
  });

  it('supports skipping exercises: toggles skipped state and blocks submitting if all exercises skipped', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Start workout
    act(() => {
      result.current.handleStartWorkout();
    });

    // Initial state: not skipped
    expect(result.current.skippedExerciseIds.has('ex_bench')).toBe(false);

    // Skip ex_bench
    act(() => {
      result.current.toggleSkipExercise('ex_bench');
    });

    expect(result.current.skippedExerciseIds.has('ex_bench')).toBe(true);

    // Attempting to submit when all exercises are skipped triggers an error message
    await act(async () => {
      await result.current.handleLogWorkout();
    });

    expect(result.current.errorMsg).toContain('All exercises are skipped');

    // Un-skip ex_bench
    act(() => {
      result.current.toggleSkipExercise('ex_bench');
    });

    expect(result.current.skippedExerciseIds.has('ex_bench')).toBe(false);
  });
});
