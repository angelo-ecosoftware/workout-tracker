import { describe, expect, it } from 'vitest';
import {
  createWorkoutDraftPayload,
  getWorkoutDraftKey,
  parseWorkoutDraft,
} from '../../../src/components/workout/tracker/workoutSessionDraft.ts';

describe('workout draft continuity', () => {
  it('scopes drafts by user and workout', () => {
    expect(getWorkoutDraftKey('user-a', 'workout-a')).not.toBe(getWorkoutDraftKey('user-b', 'workout-a'));
    expect(getWorkoutDraftKey('user-a', 'workout-a')).not.toBe(getWorkoutDraftKey('user-a', 'workout-b'));
  });

  it('does not expose one user’s stored draft to another user', () => {
    const userADraftKey = getWorkoutDraftKey('user-a', 'workout-a')!;
    const userBDraftKey = getWorkoutDraftKey('user-b', 'workout-a')!;
    localStorage.clear();
    localStorage.setItem(userADraftKey, JSON.stringify({ workoutId: 'workout-a', inputs: { secret: true } }));

    expect(localStorage.getItem(userADraftKey)).toContain('"secret":true');
    expect(localStorage.getItem(userBDraftKey)).toBeNull();
  });

  it('accepts the current shape and ignores corrupt or unsupported versions', () => {
    const payload = createWorkoutDraftPayload(
      'workout-a',
      undefined,
      { 'exercise-a-1': { weight: '20', reps: '8', durationSeconds: '', difficulty: '7' } },
      '2026-09-11',
      8,
      7,
      'notes',
      '80',
      []
    );
    expect(parseWorkoutDraft(JSON.stringify(payload))?.workoutId).toBe('workout-a');
    expect(parseWorkoutDraft('{invalid')).toBeNull();
    expect(parseWorkoutDraft(JSON.stringify({ ...payload, version: 99 }))).toBeNull();
  });
});
