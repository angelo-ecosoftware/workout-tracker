import { describe, it, expect } from 'vitest';
import { SessionEngine, SetLogger, ProgressionEngine } from '../src/engine.ts';
import { UserProfile, Workout, Exercise } from '../src/models.ts';
import { calculateInsights, calculateExerciseProgression } from '../src/lib/insightsEngine.ts';
import { compressWorkoutImage } from '../src/utils/imageCompressor.ts';

describe('End-to-End Happy Path Tests: All Forms & Tracking Cases', () => {

  const testUser: UserProfile = {
    userId: 'user_happy_test_123',
    email: 'athlete@example.com',
    name: 'Champion Athlete',
    lastCompletedWorkoutOrder: 0,
    maxWorkoutOrder: 3,
    lastSetSummaryPerExercise: {},
    createdAt: new Date(),
  };

  const sampleWorkouts: Workout[] = [
    { id: 'w_1', name: 'Day 1 - Push Focus', order: 1, exerciseIds: ['ex_bench', 'ex_pushup'] },
    { id: 'w_2', name: 'Day 2 - Pull Focus', order: 2, exerciseIds: ['ex_pullup', 'ex_row'] },
    { id: 'w_3', name: 'Day 3 - Legs & Core', order: 3, exerciseIds: ['ex_squat', 'ex_plank'] },
  ];

  const sampleExercises: Exercise[] = [
    { id: 'ex_bench', name: 'Barbell Bench Press', type: 'strength', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
    { id: 'ex_pushup', name: 'Push-ups (Bodyweight)', type: 'strength', targetSets: 3, targetRepMin: 15, targetRepMax: 20 },
    { id: 'ex_plank', name: 'Plank Hold', type: 'timed', targetSets: 3, targetRepMin: 30, targetRepMax: 60 },
  ];

  /* -------------------------------------------------------------
   * Form 1: Workout Split Cycling & Session Creation
   * ------------------------------------------------------------- */
  describe('Form 1: Routine Sequence & Session Initialization', () => {
    it('accurately advances cycle through Day 1 -> Day 2 -> Day 3 -> Day 1', () => {
      // Starting from 0 -> Day 1
      let next = SessionEngine.calculateNextWorkoutOrder(testUser, sampleWorkouts);
      expect(next).toBe(1);

      // Completed Day 1 -> Day 2
      next = SessionEngine.calculateNextWorkoutOrder({ ...testUser, lastCompletedWorkoutOrder: 1 }, sampleWorkouts);
      expect(next).toBe(2);

      // Completed Day 2 -> Day 3
      next = SessionEngine.calculateNextWorkoutOrder({ ...testUser, lastCompletedWorkoutOrder: 2 }, sampleWorkouts);
      expect(next).toBe(3);

      // Completed Day 3 -> Cycles cleanly back to Day 1
      next = SessionEngine.calculateNextWorkoutOrder({ ...testUser, lastCompletedWorkoutOrder: 3 }, sampleWorkouts);
      expect(next).toBe(1);
    });

    it('creates in-progress session header with valid user & target workout link', () => {
      const session = SessionEngine.createSession(testUser, sampleWorkouts[0]);
      expect(session.userId).toBe(testUser.userId);
      expect(session.workoutId).toBe('w_1');
      expect(session.status).toBe('in_progress');
      expect(session.completedAt).toBeNull();
      expect(session.startedAt instanceof Date).toBe(true);
    });
  });

  /* -------------------------------------------------------------
   * Form 2: Standard Strength Exercise Logging (Weighted)
   * ------------------------------------------------------------- */
  describe('Form 2: Standard Weighted Strength Set Logging', () => {
    it('validates and records structured strength sets with progressive weights & reps', () => {
      const set1 = SetLogger.validateAndCreateSet({
        sessionId: 'sess_100',
        userId: testUser.userId,
        exerciseId: 'ex_bench',
        setNumber: 1,
        weight: 80,
        reps: 10,
      }, 'strength');

      expect(set1.weight).toBe(80);
      expect(set1.reps).toBe(10);
      expect(set1.durationSeconds).toBeNull();
      expect(set1.setNumber).toBe(1);

      const set2 = SetLogger.validateAndCreateSet({
        sessionId: 'sess_100',
        userId: testUser.userId,
        exerciseId: 'ex_bench',
        setNumber: 2,
        weight: 85,
        reps: 8,
      }, 'strength');

      expect(set2.weight).toBe(85);
      expect(set2.reps).toBe(8);
    });

    it('calculates 1RM estimate accurately using Epley formula', () => {
      // 80kg x 10 reps -> 80 * (1 + 10/30) = 80 * 1.3333 = 106.67 kg
      const est1RM = ProgressionEngine.calculate1RM(80, 10);
      expect(est1RM).toBe(106.7);

      // 1 rep max: weight equals 1RM
      expect(ProgressionEngine.calculate1RM(100, 1)).toBe(100);
    });
  });

  /* -------------------------------------------------------------
   * Form 3: Bodyweight Exercise Logging (0kg Added Weight)
   * ------------------------------------------------------------- */
  describe('Form 3: Bodyweight Exercise Logging (0kg Added Weight)', () => {
    it('successfully records 0 kg added weight with total rep volume tracking', () => {
      const bwSet1 = SetLogger.validateAndCreateSet({
        sessionId: 'sess_100',
        userId: testUser.userId,
        exerciseId: 'ex_pushup',
        setNumber: 1,
        weight: 0,
        reps: 25,
      }, 'strength');

      expect(bwSet1.weight).toBe(0);
      expect(bwSet1.reps).toBe(25);
      expect(bwSet1.durationSeconds).toBeNull();

      const bwSet2 = SetLogger.validateAndCreateSet({
        sessionId: 'sess_100',
        userId: testUser.userId,
        exerciseId: 'ex_pushup',
        setNumber: 2,
        weight: 0,
        reps: 20,
      }, 'strength');

      expect(bwSet2.reps).toBe(20);
    });
  });

  /* -------------------------------------------------------------
   * Form 4: Timed / Isometric Exercise Logging
   * ------------------------------------------------------------- */
  describe('Form 4: Timed Isometric Set Logging', () => {
    it('validates and records duration in seconds without requiring weight/reps', () => {
      const timedSet = SetLogger.validateAndCreateSet({
        sessionId: 'sess_100',
        userId: testUser.userId,
        exerciseId: 'ex_plank',
        setNumber: 1,
        durationSeconds: 60,
      }, 'timed');

      expect(timedSet.durationSeconds).toBe(60);
      expect(timedSet.weight).toBeNull();
      expect(timedSet.reps).toBeNull();
    });
  });

  /* -------------------------------------------------------------
   * Form 5: Progression Suggestion Engine (Double Progression)
   * ------------------------------------------------------------- */
  describe('Form 5: Progressive Overload Engine Recommendations', () => {
    it('recommends weight increase (+2.5kg) when user hits target rep ceiling', () => {
      const exercise: Exercise = {
        id: 'ex_bench',
        name: 'Bench Press',
        type: 'strength',
        targetSets: 3,
        targetRepMin: 8,
        targetRepMax: 12,
      };

      // User hit 12 reps at 80kg
      const suggestion = ProgressionEngine.calculateNextTarget(
        exercise,
        { lastWeight: 80, lastReps: 12, lastSessionId: 'sess_1' }
      );

      expect(suggestion.type).toBe('weight');
      expect(suggestion.suggestedWeight).toBe(82.5); // 80 + 2.5kg increment
      expect(suggestion.suggestedReps).toBe(8); // Reset to rep floor
    });

    it('recommends rep increase (+1 rep) when within rep range', () => {
      const exercise: Exercise = {
        id: 'ex_bench',
        name: 'Bench Press',
        type: 'strength',
        targetSets: 3,
        targetRepMin: 8,
        targetRepMax: 12,
      };

      // User hit 9 reps at 80kg
      const suggestion = ProgressionEngine.calculateNextTarget(
        exercise,
        { lastWeight: 80, lastReps: 9, lastSessionId: 'sess_1' }
      );

      expect(suggestion.type).toBe('reps');
      expect(suggestion.suggestedWeight).toBe(80);
      expect(suggestion.suggestedReps).toBe(10); // 9 + 1 rep
    });
  });

  /* -------------------------------------------------------------
   * Form 6: Insights & 90-Day Analytics Engine
   * ------------------------------------------------------------- */
  describe('Form 6: 90-Day Log Book Insights & Heatmaps', () => {
    it('aggregates completed sessions, tonnage volume, and workout streaks', () => {
      const mockSessions = [
        {
          id: 's1',
          userId: testUser.userId,
          workoutId: 'w_1',
          status: 'completed' as const,
          startedAt: new Date(Date.now() - 86400000 * 2),
          completedAt: new Date(Date.now() - 86400000 * 2 + 3600000),
          notes: 'Great chest pump',
          photos: ['https://example.com/photo1.webp'],
        },
        {
          id: 's2',
          userId: testUser.userId,
          workoutId: 'w_2',
          status: 'completed' as const,
          startedAt: new Date(Date.now() - 86400000),
          completedAt: new Date(Date.now() - 86400000 + 3600000),
          notes: null,
          photos: null,
        },
      ];

      const mockSets = [
        { id: '1', sessionId: 's1', userId: testUser.userId, exerciseId: 'ex_bench', setNumber: 1, weight: 80, reps: 10, durationSeconds: null, startedAt: null, completedAt: null, restSeconds: 60, loggedAt: new Date() },
        { id: '2', sessionId: 's1', userId: testUser.userId, exerciseId: 'ex_bench', setNumber: 2, weight: 80, reps: 10, durationSeconds: null, startedAt: null, completedAt: null, restSeconds: 60, loggedAt: new Date() },
        { id: '3', sessionId: 's2', userId: testUser.userId, exerciseId: 'ex_pushup', setNumber: 1, weight: 0, reps: 20, durationSeconds: null, startedAt: null, completedAt: null, restSeconds: 60, loggedAt: new Date() },
      ];

      const insights = calculateInsights(mockSessions, mockSets, sampleWorkouts);
      expect(insights.totalCompletedSessions).toBe(2);
      expect(insights.totalVolumeKg).toBe(1600); // 80*10 + 80*10 = 1600kg
      expect(insights.heatmapData.length).toBe(90);
    });

    it('computes progression curve for individual exercise drill-down', () => {
      const mockSessions = [
        {
          id: 's1',
          userId: testUser.userId,
          workoutId: 'w_1',
          status: 'completed' as const,
          startedAt: new Date(Date.now() - 86400000 * 5),
          completedAt: new Date(Date.now() - 86400000 * 5 + 3600000),
        },
        {
          id: 's2',
          userId: testUser.userId,
          workoutId: 'w_1',
          status: 'completed' as const,
          startedAt: new Date(Date.now() - 86400000 * 1),
          completedAt: new Date(Date.now() - 86400000 * 1 + 3600000),
        },
      ];

      const mockSets = [
        { id: '1', sessionId: 's1', userId: testUser.userId, exerciseId: 'ex_bench', setNumber: 1, weight: 80, reps: 8, durationSeconds: null, startedAt: null, completedAt: null, restSeconds: null, loggedAt: new Date() },
        { id: '2', sessionId: 's2', userId: testUser.userId, exerciseId: 'ex_bench', setNumber: 1, weight: 85, reps: 8, durationSeconds: null, startedAt: null, completedAt: null, restSeconds: null, loggedAt: new Date() },
      ];

      const curve = calculateExerciseProgression('ex_bench', mockSessions, mockSets, sampleExercises);
      expect(curve.exerciseName).toBe('Barbell Bench Press');
      expect(curve.dataPoints.length).toBe(2);
      expect(curve.maxWeightAllTime).toBe(85);
      expect(curve.estimated1RMAllTime).toBeGreaterThan(100);
    });
  });

  /* -------------------------------------------------------------
   * Form 7: Photo Compression Resiliency
   * ------------------------------------------------------------- */
  describe('Form 7: High-Definition Progress Photo Compression', () => {
    it('fallbacks to original file safely when DOM Canvas is unavailable in node/test environment', async () => {
      const dummyFile = new File(['dummy photo data'], 'progress.jpg', { type: 'image/jpeg' });
      const processed = await compressWorkoutImage(dummyFile);
      expect(processed).toBeDefined();
      expect(processed.name).toBe('progress.jpg');
    });
  });

});
