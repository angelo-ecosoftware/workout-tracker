import { describe, it, expect } from 'vitest';

export interface SetTimingState {
  exerciseIndex: number;
  setNumber: number;
  totalExercises: number;
  targetSets: number;
  setStartTime: number | null;
  phase: 'ready' | 'in_progress' | 'resting' | 'completed_all';
}

export function startSet(state: SetTimingState, now: number): SetTimingState {
  return {
    ...state,
    setStartTime: now,
    phase: 'in_progress',
  };
}

export function finishSet(state: SetTimingState, now: number): { nextState: SetTimingState; durationSeconds: number } {
  const duration = state.setStartTime ? Math.max(1, Math.round((now - state.setStartTime) / 1000)) : 0;
  const isLastSet = state.setNumber >= state.targetSets;
  const isLastExercise = state.exerciseIndex >= state.totalExercises - 1;

  if (isLastSet && isLastExercise) {
    return {
      durationSeconds: duration,
      nextState: {
        ...state,
        setStartTime: null,
        phase: 'completed_all',
      },
    };
  }

  return {
    durationSeconds: duration,
    nextState: {
      ...state,
      setStartTime: null,
      phase: 'resting',
    },
  };
}

export function advanceStep(state: SetTimingState, targetSetsNextEx: number = 3): SetTimingState {
  if (state.setNumber < state.targetSets) {
    return {
      ...state,
      setNumber: state.setNumber + 1,
      phase: 'ready',
    };
  }

  if (state.exerciseIndex < state.totalExercises - 1) {
    return {
      ...state,
      exerciseIndex: state.exerciseIndex + 1,
      setNumber: 1,
      targetSets: targetSetsNextEx,
      phase: 'ready',
    };
  }

  return {
    ...state,
    phase: 'completed_all',
  };
}

describe('Assisted Timed Workout Engine', () => {
  it('should start a set silently recording start time in background', () => {
    const initialState: SetTimingState = {
      exerciseIndex: 0,
      setNumber: 1,
      totalExercises: 2,
      targetSets: 3,
      setStartTime: null,
      phase: 'ready',
    };

    const startTime = 1000000;
    const running = startSet(initialState, startTime);
    expect(running.phase).toBe('in_progress');
    expect(running.setStartTime).toBe(startTime);
  });

  it('should compute duration (end - start) in seconds upon set completion and trigger resting phase', () => {
    const runningState: SetTimingState = {
      exerciseIndex: 0,
      setNumber: 1,
      totalExercises: 2,
      targetSets: 3,
      setStartTime: 1000000,
      phase: 'in_progress',
    };

    const finishTime = 1045000; // 45 seconds later
    const { nextState, durationSeconds } = finishSet(runningState, finishTime);

    expect(durationSeconds).toBe(45);
    expect(nextState.phase).toBe('resting');
    expect(nextState.setStartTime).toBeNull();
  });

  it('should advance to next set when rest finishes', () => {
    const restingState: SetTimingState = {
      exerciseIndex: 0,
      setNumber: 1,
      totalExercises: 2,
      targetSets: 3,
      setStartTime: null,
      phase: 'resting',
    };

    const nextSetState = advanceStep(restingState);
    expect(nextSetState.phase).toBe('ready');
    expect(nextSetState.setNumber).toBe(2);
    expect(nextSetState.exerciseIndex).toBe(0);
  });

  it('should transition to next exercise after completing all sets of current exercise', () => {
    const lastSetState: SetTimingState = {
      exerciseIndex: 0,
      setNumber: 3,
      totalExercises: 2,
      targetSets: 3,
      setStartTime: null,
      phase: 'resting',
    };

    const nextExerciseState = advanceStep(lastSetState, 4);
    expect(nextExerciseState.exerciseIndex).toBe(1);
    expect(nextExerciseState.setNumber).toBe(1);
    expect(nextExerciseState.targetSets).toBe(4);
    expect(nextExerciseState.phase).toBe('ready');
  });

  it('should reach completed_all after final set of final exercise is finished', () => {
    const finalSetRunning: SetTimingState = {
      exerciseIndex: 1,
      setNumber: 4,
      totalExercises: 2,
      targetSets: 4,
      setStartTime: 2000000,
      phase: 'in_progress',
    };

    const { nextState, durationSeconds } = finishSet(finalSetRunning, 2030000); // 30s
    expect(durationSeconds).toBe(30);
    expect(nextState.phase).toBe('completed_all');
  });
});
