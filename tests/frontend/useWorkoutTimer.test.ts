import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useWorkoutTimer } from '../../src/components/workout/tracker/useWorkoutTimer.ts';

describe('useWorkoutTimer', () => {
  it('persists an active session across remounts and clears it on reset', () => {
    const firstRender = renderHook(() => useWorkoutTimer('workout-timer-test'));

    act(() => {
      firstRender.result.current.start();
    });

    expect(firstRender.result.current.isActive).toBe(true);
    expect(localStorage.getItem('workout_session_active_workout-timer-test')).toBe('true');

    firstRender.unmount();
    const secondRender = renderHook(() => useWorkoutTimer('workout-timer-test'));
    expect(secondRender.result.current.isActive).toBe(true);
    expect(secondRender.result.current.startTime).toBeGreaterThan(0);

    act(() => {
      secondRender.result.current.reset();
    });

    expect(secondRender.result.current.isActive).toBe(false);
    expect(localStorage.getItem('workout_session_active_workout-timer-test')).toBeNull();
    expect(localStorage.getItem('workout_session_start_time_workout-timer-test')).toBeNull();
    secondRender.unmount();
  });
});
