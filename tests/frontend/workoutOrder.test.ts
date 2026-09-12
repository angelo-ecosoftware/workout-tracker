import { describe, expect, it } from 'vitest';
import { getWorkoutOrderFromSessionRow } from '../../src/utils/workoutOrder.ts';

describe('workout order relation normalization', () => {
  it('reads the remaining workout order when Supabase returns the relation as an array', () => {
    expect(
      getWorkoutOrderFromSessionRow({
        workouts: [{ order: 3 }],
      })
    ).toBe(3);
  });

  it('supports the object relation and direct fallback order shapes', () => {
    expect(getWorkoutOrderFromSessionRow({ workouts: { order: 2 } })).toBe(2);
    expect(getWorkoutOrderFromSessionRow({ workout_order: 1 })).toBe(1);
  });
});
