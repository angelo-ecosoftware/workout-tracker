import { describe, it, expect } from 'vitest';

describe('Routine Deletion logic', () => {
  it('allows deleting down to 0 days', () => {
    let workouts = [
      { id: 'w1', name: 'Day 1 - Push', order: 1, exerciseIds: [], exercises: [] }
    ];

    const deleteIndex = 0;
    const filtered = workouts.filter((_, i) => i !== deleteIndex);
    const reindexed = filtered.map((w, i) => ({ ...w, order: i + 1 }));
    workouts = reindexed;

    expect(workouts.length).toBe(0);
    const newSelectedIndex = Math.max(0, Math.min(deleteIndex, workouts.length - 1));
    expect(newSelectedIndex).toBe(0);
  });

  it('correctly shifts index when deleting from multi-day workouts', () => {
    let workouts = [
      { id: 'w1', name: 'Day 1 - Push', order: 1, exerciseIds: [], exercises: [] },
      { id: 'w2', name: 'Day 2 - Pull', order: 2, exerciseIds: [], exercises: [] },
      { id: 'w3', name: 'Day 3 - Legs', order: 3, exerciseIds: [], exercises: [] }
    ];

    // Delete Day 2 (index 1)
    let deleteIndex = 1;
    let filtered = workouts.filter((_, i) => i !== deleteIndex);
    let reindexed = filtered.map((w, i) => ({ ...w, order: i + 1 }));
    workouts = reindexed;

    expect(workouts.length).toBe(2);
    expect(workouts[0].name).toBe('Day 1 - Push');
    expect(workouts[1].name).toBe('Day 3 - Legs');
    expect(workouts[1].order).toBe(2);
  });
});
