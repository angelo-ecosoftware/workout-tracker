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
      expect(result.current.expandedExerciseId).toBe('ex_bench');
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

  it('expands and collapses exercise cards dynamically', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.expandedExerciseId).toBe('ex_bench');

    // Collapse
    act(() => {
      result.current.setExpandedExerciseId(null);
    });
    expect(result.current.expandedExerciseId).toBeNull();

    // Re-expand
    act(() => {
      result.current.setExpandedExerciseId('ex_bench');
    });
    expect(result.current.expandedExerciseId).toBe('ex_bench');
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

  it('dispatches handleLogWorkout and resets session form state', async () => {
    const { result } = renderHook(() => useWorkoutSession(mockUser));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setSessionNotes('Solid workout session completed.');
    });

    await act(async () => {
      await result.current.handleLogWorkout();
    });

    expect(result.current.successMsg).toContain('Workout successfully saved');
    expect(result.current.sessionNotes).toBe('');
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
});
