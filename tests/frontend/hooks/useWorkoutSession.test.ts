// @vitest-environment jsdom

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWorkoutSession } from '../../../src/components/workout/tracker/useWorkoutSession.ts';
import {
  getSelectedWorkoutKey,
  getWorkoutDraftKey,
  getWorkoutSessionTimerKey,
} from '../../../src/components/workout/tracker/workoutSessionDraft.ts';
import {
  fetchWorkoutHistory,
  fetchWorkoutsData,
  getUserProgressState,
} from '../../../src/lib/supabaseData.ts';
import { userFactory, workoutFactory, exerciseFactory } from '../../shared/fixtures/factories.ts';
import { AuthUser } from '../../../src/context/AuthContext.tsx';
import { Exercise } from '../../../src/models.ts';
import { loadDraftPhotosFromStorage } from '../../../src/utils/draftPhotoStorage.ts';

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

const sampleWorkout = {
  ...workoutFactory.build({
    id: 'wk_push_1',
    name: 'Push Day 1',
    order: 1,
    exercises: [benchExercise],
  }),
  exerciseIds: ['ex_bench'],
};

const secondWorkout = {
  ...workoutFactory.build({
    id: 'wk_pull_2',
    name: 'Pull Day 2',
    order: 2,
    exercises: [benchExercise],
  }),
  exerciseIds: ['ex_bench'],
};

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
    exercisesList: [],
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
    vi.mocked(fetchWorkoutsData).mockImplementation(async () => ({
      combinedWorkouts: [sampleWorkout],
      workoutsList: [sampleWorkout],
      exercisesList: [],
    }));
    vi.mocked(getUserProgressState).mockImplementation(async () => ({
      profile: mockProfile,
      isNewUser: false,
    }));
    vi.mocked(fetchWorkoutHistory).mockImplementation(async () => []);
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

  it('does not commit stale hydration results after the authenticated identity changes', async () => {
    let resolveUserA!: (value: {
      combinedWorkouts: typeof sampleWorkout[];
      workoutsList: typeof sampleWorkout[];
      exercisesList: Exercise[];
    }) => void;
    const userAHydration = new Promise<{
      combinedWorkouts: typeof sampleWorkout[];
      workoutsList: typeof sampleWorkout[];
      exercisesList: Exercise[];
    }>((resolve) => {
      resolveUserA = resolve;
    });
    const userB = { ...mockUser, id: 'usr_user_b', uid: 'usr_user_b' };
    const userBWorkout = { ...secondWorkout, exercises: [benchExercise] };
    const userBProfile = userFactory.build({
      userId: userB.uid,
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
    });

    vi.mocked(fetchWorkoutsData)
      .mockImplementationOnce(async () => userAHydration)
      .mockImplementationOnce(async () => ({
        combinedWorkouts: [userBWorkout],
        workoutsList: [userBWorkout],
        exercisesList: [],
      }));
    vi.mocked(getUserProgressState)
      .mockImplementationOnce(async () => ({ profile: mockProfile, isNewUser: false }))
      .mockImplementationOnce(async () => ({ profile: userBProfile, isNewUser: false }));

    const { result, rerender } = renderHook(
      ({ currentUser }: { currentUser: AuthUser | null }) => useWorkoutSession(currentUser),
      { initialProps: { currentUser: mockUser } }
    );

    rerender({ currentUser: userB });
    await waitFor(() => {
      expect(result.current.activeWorkout?.id).toBe('wk_pull_2');
      expect(result.current.userProfile?.userId).toBe(userB.uid);
    });

    resolveUserA({
      combinedWorkouts: [sampleWorkout],
      workoutsList: [sampleWorkout],
      exercisesList: [],
    });
    await Promise.resolve();

    expect(result.current.activeWorkout?.id).toBe('wk_pull_2');
    expect(result.current.userProfile?.userId).toBe(userB.uid);
  });

  it('commits only the final identity when A, B, and C hydrate in hostile order', async () => {
    let resolveA!: (value: {
      combinedWorkouts: typeof sampleWorkout[];
      workoutsList: typeof sampleWorkout[];
      exercisesList: Exercise[];
    }) => void;
    let resolveB!: (value: {
      combinedWorkouts: typeof sampleWorkout[];
      workoutsList: typeof sampleWorkout[];
      exercisesList: Exercise[];
    }) => void;
    const pendingA = new Promise<{
      combinedWorkouts: typeof sampleWorkout[];
      workoutsList: typeof sampleWorkout[];
      exercisesList: Exercise[];
    }>((resolve) => {
      resolveA = resolve;
    });
    const pendingB = new Promise<{
      combinedWorkouts: typeof sampleWorkout[];
      workoutsList: typeof sampleWorkout[];
      exercisesList: Exercise[];
    }>((resolve) => {
      resolveB = resolve;
    });
    const userB = { ...mockUser, id: 'usr_user_b', uid: 'usr_user_b' };
    const userC = { ...mockUser, id: 'usr_user_c', uid: 'usr_user_c' };
    const userCWorkout = { ...secondWorkout, id: 'wk_user_c' };
    const userCProfile = userFactory.build({
      userId: userC.uid,
      lastCompletedWorkoutOrder: 0,
      maxWorkoutOrder: 3,
      lastSetSummaryPerExercise: {},
    });

    vi.mocked(fetchWorkoutsData)
      .mockImplementationOnce(async () => pendingA)
      .mockImplementationOnce(async () => pendingB)
      .mockImplementationOnce(async () => ({
        combinedWorkouts: [userCWorkout],
        workoutsList: [userCWorkout],
        exercisesList: [],
      }));
    vi.mocked(getUserProgressState)
      .mockImplementationOnce(async () => ({ profile: mockProfile, isNewUser: false }))
      .mockImplementationOnce(async () => ({
        profile: { ...mockProfile, userId: userB.uid },
        isNewUser: false,
      }))
      .mockImplementationOnce(async () => ({ profile: userCProfile, isNewUser: false }));

    const { result, rerender } = renderHook(
      ({ currentUser }: { currentUser: AuthUser | null }) => useWorkoutSession(currentUser),
      { initialProps: { currentUser: mockUser } }
    );
    rerender({ currentUser: userB });
    rerender({ currentUser: userC });

    await waitFor(() => {
      expect(result.current.activeWorkout?.id).toBe(userCWorkout.id);
      expect(result.current.userProfile?.userId).toBe(userC.uid);
    });

    resolveB({
      combinedWorkouts: [secondWorkout],
      workoutsList: [secondWorkout],
      exercisesList: [],
    });
    resolveA({
      combinedWorkouts: [sampleWorkout],
      workoutsList: [sampleWorkout],
      exercisesList: [],
    });
    await Promise.resolve();

    expect(result.current.activeWorkout?.id).toBe(userCWorkout.id);
    expect(result.current.userProfile?.userId).toBe(userC.uid);
    expect(result.current.workouts[0]?.id).toBe(userCWorkout.id);
  });

  it('does not restore authenticated workout state after logout during hydration', async () => {
    let resolveUserA!: (value: {
      combinedWorkouts: typeof sampleWorkout[];
      workoutsList: typeof sampleWorkout[];
      exercisesList: Exercise[];
    }) => void;
    const userAHydration = new Promise<{
      combinedWorkouts: typeof sampleWorkout[];
      workoutsList: typeof sampleWorkout[];
      exercisesList: Exercise[];
    }>((resolve) => {
      resolveUserA = resolve;
    });
    vi.mocked(fetchWorkoutsData).mockImplementationOnce(async () => userAHydration);

    const { result, rerender } = renderHook(
      ({ currentUser }: { currentUser: AuthUser | null }) => useWorkoutSession(currentUser),
      { initialProps: { currentUser: mockUser } }
    );

    rerender({ currentUser: null });
    resolveUserA({
      combinedWorkouts: [sampleWorkout],
      workoutsList: [sampleWorkout],
      exercisesList: [],
    });
    await Promise.resolve();

    expect(result.current.workouts).toHaveLength(0);
    expect(result.current.activeWorkout).toBeNull();
    expect(result.current.userProfile).toBeNull();
  });

  it('ignores late photo restoration after the active workout changes', async () => {
    let resolvePhotos!: (files: File[]) => void;
    const pendingPhotos = new Promise<File[]>((resolve) => {
      resolvePhotos = resolve;
    });
    vi.mocked(loadDraftPhotosFromStorage).mockImplementationOnce(async () => pendingPhotos);

    const { result } = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.activeWorkout?.id).toBe(sampleWorkout.id);
    });

    act(() => {
      result.current.setActiveWorkout(secondWorkout);
    });
    expect(result.current.selectedPhotos).toHaveLength(0);

    await act(async () => {
      resolvePhotos([new File(['user-a-photo'], 'a.jpg', { type: 'image/jpeg' })]);
      await Promise.resolve();
    });

    expect(result.current.activeWorkout?.id).toBe(secondWorkout.id);
    expect(result.current.selectedPhotos).toHaveLength(0);
    expect(result.current.photoPreviews).toHaveLength(0);
  });

  it('isolates active workout timer persistence by user identity', async () => {
    const userB = { ...mockUser, id: 'usr_user_b', uid: 'usr_user_b' };
    const first = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    act(() => {
      first.result.current.handleStartWorkout();
    });

    const userATimerKey = getWorkoutSessionTimerKey(mockUser.uid, sampleWorkout.id, 'active');
    const userBTimerKey = getWorkoutSessionTimerKey(userB.uid, sampleWorkout.id, 'active');
    expect(userATimerKey).not.toBe(userBTimerKey);
    expect(userATimerKey ? localStorage.getItem(userATimerKey) : null).toBe('true');
    expect(userBTimerKey ? localStorage.getItem(userBTimerKey) : null).toBeNull();
    first.unmount();
  });

  it('restores a valid explicitly selected workout without persisting the workout object', async () => {
    vi.mocked(fetchWorkoutsData).mockImplementation(async () => ({
      combinedWorkouts: [sampleWorkout, secondWorkout],
      workoutsList: [sampleWorkout, secondWorkout],
      exercisesList: [],
    }));

    const first = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    act(() => {
      first.result.current.setActiveWorkout(secondWorkout);
    });
    expect(localStorage.getItem(getSelectedWorkoutKey(mockUser.uid)!)).toBe(secondWorkout.id);
    first.unmount();

    const second = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => {
      expect(second.result.current.loading).toBe(false);
      expect(second.result.current.activeWorkout?.id).toBe(secondWorkout.id);
    });
  });

  it('ignores and removes an invalid persisted workout selection', async () => {
    const selectedKey = getSelectedWorkoutKey(mockUser.uid)!;
    localStorage.setItem(selectedKey, 'workout-no-longer-available');

    const { result } = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.activeWorkout?.id).toBe(sampleWorkout.id);
    });
    expect(localStorage.getItem(selectedKey)).toBeNull();
  });

  it('writes versioned drafts and safely ignores corrupt or unsupported drafts', async () => {
    const draftKey = getWorkoutDraftKey(mockUser.uid, sampleWorkout.id)!;
    const { result, unmount } = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.handleTextChange('ex_bench-1', 'weight', '140');
    });
    expect(JSON.parse(localStorage.getItem(draftKey)!).version).toBe(1);
    unmount();

    localStorage.setItem(draftKey, '{not-json');
    const corrupt = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => expect(corrupt.result.current.loading).toBe(false));
    expect(corrupt.result.current.inputs['ex_bench-1']?.weight).toBe('20');
    corrupt.unmount();

    localStorage.setItem(
      draftKey,
      JSON.stringify({
        version: 999,
        inputs: { 'ex_bench-1': { weight: '999', reps: '1' } },
      })
    );
    const unsupported = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => expect(unsupported.result.current.loading).toBe(false));
    expect(unsupported.result.current.inputs['ex_bench-1']?.weight).toBe('20');
    unsupported.unmount();

    localStorage.setItem(
      draftKey,
      JSON.stringify({
        version: 1,
        workoutId: 'another-workout',
        inputs: { 'ex_bench-1': { weight: '999', reps: '1' } },
      })
    );
    const wrongWorkout = renderHook(() => useWorkoutSession(mockUser));
    await waitFor(() => expect(wrongWorkout.result.current.loading).toBe(false));
    expect(wrongWorkout.result.current.inputs['ex_bench-1']?.weight).toBe('20');
  });

  it('keeps drafts isolated when another user has the same workout id', async () => {
    const userAKey = getWorkoutDraftKey(mockUser.uid, sampleWorkout.id)!;
    localStorage.setItem(
      userAKey,
      JSON.stringify({
        version: 1,
        workoutId: sampleWorkout.id,
        inputs: { 'ex_bench-1': { weight: '140', reps: '5' } },
      })
    );
    const userB = { ...mockUser, id: 'usr_user_b', uid: 'usr_user_b' };
    const { result } = renderHook(() => useWorkoutSession(userB));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.inputs['ex_bench-1']?.weight).toBe('20');
  });
});
