import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPublicSessionShare,
  fetchPublicWorkoutSession,
} from '../../../src/lib/db/publicSessionSharing.ts';

const { insertMock, rpcMock } = vi.hoisted(() => ({
  insertMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock('../../../src/lib/storage.ts', () => ({
  createSharedPhotoUrl: vi.fn(async (photo: string) => `signed:${photo}`),
}));

vi.mock('../../../src/lib/supabase.ts', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'owner-a' } } })),
    },
    from: vi.fn(() => ({
      insert: insertMock,
    })),
    rpc: rpcMock,
  },
}));

describe('Security Gate A public session sharing', () => {
  beforeEach(() => {
    insertMock.mockReset().mockResolvedValue({ error: null });
    rpcMock.mockReset();
  });

  it('creates a cryptographically random token and never publishes photos when disabled', async () => {
    const token = await createPublicSessionShare(
      'session-a',
      ['storage://workout-media/owner-a/private.jpg'],
      false
    );

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(token).not.toBe('session-a');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'session-a',
        owner_id: 'owner-a',
        share_photos: false,
        photo_urls: [],
      })
    );
  });

  it('stores only owner-created signed photo URLs when photo sharing is enabled', async () => {
    await createPublicSessionShare(
      'session-a',
      ['storage://workout-media/owner-a/private.jpg'],
      true
    );

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        share_photos: true,
        photo_urls: ['signed:storage://workout-media/owner-a/private.jpg'],
      })
    );
  });

  it('maps the RPC projection without private notes, profiles, or body-log data', async () => {
    rpcMock.mockResolvedValue({
      data: {
        session: {
          id: 'session-a',
          status: 'completed',
          completedAt: '2026-09-11T08:00:00Z',
          sleepHours: 8,
          energyScore: 7,
        },
        workout: { id: 'workout-a', name: 'Leg Day' },
        exercises: [{ id: 'exercise-a', name: 'Back Squat', type: 'strength' }],
        sets: [{
          id: 'set-a',
          exerciseId: 'exercise-a',
          setNumber: 1,
          weight: 100,
          reps: 5,
        }],
        photos: [],
      },
      error: null,
    });

    const result = await fetchPublicWorkoutSession('opaque-token');

    expect(result?.workoutName).toBe('Leg Day');
    expect(result?.session.notes).toBeNull();
    expect(result?.session.coachNotes).toBeNull();
    expect(result?.bodyWeightKg).toBeNull();
    expect(result?.sets).toHaveLength(1);
  });

  it('returns no public data when the token RPC rejects the share', async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: 'not found' } });

    await expect(fetchPublicWorkoutSession('revoked-or-random-token')).resolves.toBeNull();
  });
});
