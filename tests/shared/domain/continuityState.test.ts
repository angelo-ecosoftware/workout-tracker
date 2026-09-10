// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearContinuity,
  getContinuityKey,
  readContinuity,
  writeContinuity,
} from '../../../src/utils/continuityState.ts';

describe('continuity state envelopes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('scopes values by user, resource type, and resource identity', () => {
    writeContinuity('user-a', 'workout-editor', 'workout-a', 1, { value: 'A' });
    writeContinuity('user-b', 'workout-editor', 'workout-a', 1, { value: 'B' });

    expect(readContinuity<{ value: string }>('user-a', 'workout-editor', 'workout-a', 1)?.payload.value).toBe('A');
    expect(readContinuity<{ value: string }>('user-b', 'workout-editor', 'workout-a', 1)?.payload.value).toBe('B');
    expect(readContinuity<{ value: string }>('user-a', 'workout-editor', 'workout-b', 1)).toBeNull();
  });

  it('rejects unsupported versions and malformed ownership envelopes', () => {
    const key = getContinuityKey('user-a', 'profile-editor', 'profile');
    localStorage.setItem(key!, JSON.stringify({
      version: 99,
      userId: 'user-a',
      resourceType: 'profile-editor',
      resourceId: 'profile',
      updatedAt: new Date().toISOString(),
      payload: { value: 'future' },
    }));
    expect(readContinuity('user-a', 'profile-editor', 'profile', 1)).toBeNull();

    localStorage.setItem(key!, JSON.stringify({
      version: 1,
      userId: 'user-b',
      resourceType: 'profile-editor',
      resourceId: 'profile',
      updatedAt: new Date().toISOString(),
      payload: { value: 'wrong owner' },
    }));
    expect(readContinuity('user-a', 'profile-editor', 'profile', 1)).toBeNull();
  });

  it('clears only the matching resource envelope', () => {
    writeContinuity('user-a', 'editor', 'a', 1, { value: 'A' });
    writeContinuity('user-a', 'editor', 'b', 1, { value: 'B' });
    clearContinuity('user-a', 'editor', 'a');
    expect(readContinuity('user-a', 'editor', 'a', 1)).toBeNull();
    expect(readContinuity<{ value: string }>('user-a', 'editor', 'b', 1)?.payload.value).toBe('B');
  });
});
