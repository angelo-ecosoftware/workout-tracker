import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SessionEngine, SetLogger } from '../../../src/engine.ts';
import { updateSessionNotes, updateSessionPhotos, updateSessionDate } from '../../../src/lib/db/sessions.ts';
import { sessionFactory, setFactory, userFactory, workoutFactory, exerciseFactory } from '../../fixtures/factories.ts';

let mockSessionsDb: any[] = [];
let shouldFailDb = false;

vi.mock('../../../src/lib/supabase.ts', () => {
  const createBuilder = (table: string) => {
    const builder: any = {
      _filters: [] as { field: string; val: any }[],
      select: vi.fn(() => builder),
      eq: vi.fn((field: string, val: any) => {
        builder._filters.push({ field, val });
        return builder;
      }),
      update: vi.fn((patch: any) => ({
        eq: (field: string, val: any) => {
          if (shouldFailDb) return Promise.resolve({ data: null, error: { message: 'DB Error', code: '500' } });
          const idx = mockSessionsDb.findIndex((r) => r[field] === val);
          if (idx >= 0) {
            mockSessionsDb[idx] = { ...mockSessionsDb[idx], ...patch };
            return Promise.resolve({ data: mockSessionsDb[idx], error: null });
          }
          return Promise.resolve({ data: null, error: { message: 'Not found', code: '404' } });
        },
      })),
    };
    return builder;
  };

  return {
    supabase: {
      from: vi.fn((table: string) => createBuilder(table)),
    },
  };
});

describe('Happy Path Session Forms: Live Logging, Notes, Photos & Edits', () => {
  beforeEach(() => {
    mockSessionsDb = [];
    shouldFailDb = false;
    vi.clearAllMocks();
  });

  describe('Form 1: Live Session Initialization & Set Logging Form', () => {
    it('creates active session and logs strength & timed sets consecutively', () => {
      const user = userFactory.build();
      const benchEx = exerciseFactory.build({ name: 'Barbell Bench Press', type: 'strength' });
      const plankEx = exerciseFactory.timed({ name: 'Plank', type: 'timed' });
      const workout = workoutFactory.build({ exercises: [benchEx, plankEx] });

      const session = SessionEngine.createSession(user, workout);
      expect(session.status).toBe('in_progress');
      expect(session.workoutId).toBe(workout.id);

      const set1 = SetLogger.validateAndCreateSet({
        sessionId: 'sess_live_1',
        userId: user.userId,
        exerciseId: benchEx.id,
        setNumber: 1,
        weight: 80,
        reps: 10,
      }, 'strength');
      expect(set1.weight).toBe(80);
      expect(set1.reps).toBe(10);
      expect(set1.durationSeconds).toBeNull();

      const set2 = SetLogger.validateAndCreateSet({
        sessionId: 'sess_live_1',
        userId: user.userId,
        exerciseId: plankEx.id,
        setNumber: 1,
        durationSeconds: 60,
      }, 'timed');
      expect(set2.durationSeconds).toBe(60);
      expect(set2.reps).toBeNull();

      const completedSession = sessionFactory.build({
        ...session,
        id: 'sess_live_1',
        status: 'completed',
        notes: 'Crushed the whole workout!',
        completedAt: new Date(),
      });
      expect(completedSession.status).toBe('completed');
      expect(completedSession.notes).toBe('Crushed the whole workout!');
      expect(completedSession.completedAt instanceof Date).toBe(true);
    });
  });

  describe('Form 2: Session Notes & Post-Workout Reflection Form', () => {
    it('updates post-workout notes via database update form', async () => {
      mockSessionsDb = [{ id: 'sess_form_2', user_id: 'user_1', notes: null }];

      await updateSessionNotes('sess_form_2', 'Felt energized, increased bench weight by 2.5kg');
      expect(mockSessionsDb[0].notes).toBe('Felt energized, increased bench weight by 2.5kg');
    });
  });

  describe('Form 3: Session Photos & Proof Attachment Form', () => {
    it('attaches and modifies photo URLs array for completed workout session', async () => {
      mockSessionsDb = [{ id: 'sess_form_3', user_id: 'user_1', photos: null }];

      const photos = ['https://storage.supabase.co/workout-proof-1.jpg', 'https://storage.supabase.co/workout-proof-2.jpg'];
      await updateSessionPhotos('sess_form_3', photos);

      expect(mockSessionsDb[0].photos).toEqual(photos);
    });
  });

  describe('Form 4: Session Date & Retrospective Rescheduling Form', () => {
    it('updates session completed_at date timestamp', async () => {
      mockSessionsDb = [{ id: 'sess_form_4', user_id: 'user_1', completed_at: '2025-05-01T10:00:00.000Z' }];

      const newDate = new Date('2025-05-02T14:30:00.000Z');
      await updateSessionDate('sess_form_4', newDate);

      expect(mockSessionsDb[0].completed_at).toBe(newDate.toISOString());
    });
  });
});
