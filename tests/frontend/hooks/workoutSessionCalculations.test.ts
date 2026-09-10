import { describe, expect, it } from 'vitest';
import { exerciseFactory, userFactory, workoutFactory } from '../../shared/fixtures/factories.ts';
import {
  buildWorkoutSetPayload,
  calculateWorkoutCelebrationSummary,
  sanitizeWorkoutInputValue,
} from '../../../src/components/workout/tracker/workoutSessionCalculations.ts';

describe('workout session calculations', () => {
  it('preserves the session input normalization rules', () => {
    expect(sanitizeWorkoutInputValue('weight', '12kg.5.4')).toBe('12.54');
    expect(sanitizeWorkoutInputValue('difficulty', '15')).toBe('10');
    expect(sanitizeWorkoutInputValue('reps', '10 reps')).toBe('10');
  });

  it('builds ordered strength payloads and preserves warning thresholds', () => {
    const exercise = exerciseFactory.build({ id: 'ex-1', targetSets: 2 });
    const workout = workoutFactory.build({ exercises: [exercise] });
    const result = buildWorkoutSetPayload(
      workout,
      new Set(),
      {
        'ex-1-1': { weight: '500', reps: '120', durationSeconds: '', difficulty: '' },
        'ex-1-2': { weight: '100', reps: '10', durationSeconds: '', difficulty: '' },
      },
      userFactory.build(),
      false
    );

    expect(result.finalSetsPayload.map((set) => set.setNumber)).toEqual([1, 2]);
    expect(result.finalSetsPayload[0]).toMatchObject({ weight: 500, reps: 120 });
    expect(result.warnings).toEqual(expect.arrayContaining([
      'Barbell Bench Press (Set 1): Weight (500 kg) is unusually high (>350 kg).',
      'Barbell Bench Press (Set 1): Rep count (120 reps) is unusually high (>100 reps).',
    ]));
  });

  it('calculates celebration totals and personal-record improvements', () => {
    const exercise = exerciseFactory.build({ id: 'ex-1', targetSets: 1 });
    const workout = workoutFactory.build({ exercises: [exercise] });
    const summary = calculateWorkoutCelebrationSummary(
      workout,
      [{ exerciseId: 'ex-1', setNumber: 1, weight: 100, reps: 10 }],
      new Set(),
      userFactory.build({
        lastSetSummaryPerExercise: {
          'ex-1': { lastWeight: 90, lastReps: 8, lastSessionId: 'session-1' },
        },
      })
    );

    expect(summary.totalVolumeKg).toBe(1000);
    expect(summary.totalReps).toBe(10);
    expect(summary.completedSetsCount).toBe(1);
    expect(summary.prsAchieved).toHaveLength(1);
  });
});
