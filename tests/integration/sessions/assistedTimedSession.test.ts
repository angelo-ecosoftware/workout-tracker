import { describe, it, expect } from 'vitest';
import { SessionEngine, SetLogger, EngineError } from '../../../src/engine.ts';
import { userFactory, exerciseFactory, workoutFactory, sessionFactory } from '../../fixtures/factories.ts';

describe('Assisted & Timed Session Execution Mechanics', () => {
  const user = userFactory.build({ userId: 'usr_timed_athlete' });

  it('1. Correctly segregates timed exercise duration (seconds) vs strength reps', () => {
    const plankExercise = exerciseFactory.timed({ name: 'Plank Hold', type: 'timed' });
    const curlExercise = exerciseFactory.build({ name: 'Bicep Curl', type: 'strength' });
    const workout = workoutFactory.build({ exercises: [plankExercise, curlExercise] });

    const session = SessionEngine.createSession(user, workout);

    // Timed Set: duration 45 seconds
    const timedSet = SetLogger.validateAndCreateSet({
      sessionId: 'sess_timed_1',
      userId: user.userId,
      exerciseId: plankExercise.id,
      setNumber: 1,
      durationSeconds: 45,
    }, 'timed');
    expect(timedSet.durationSeconds).toBe(45);
    expect(timedSet.reps).toBeNull();
    expect(timedSet.weight).toBeNull();

    // Strength Set: 12 reps with 20kg
    const strengthSet = SetLogger.validateAndCreateSet({
      sessionId: 'sess_timed_1',
      userId: user.userId,
      exerciseId: curlExercise.id,
      setNumber: 1,
      weight: 20,
      reps: 12,
    }, 'strength');
    expect(strengthSet.reps).toBe(12);
    expect(strengthSet.weight).toBe(20);
    expect(strengthSet.durationSeconds).toBeNull();
  });

  it('2. Throws error if strength set payload has durationSeconds or missing reps', () => {
    expect(() => {
      SetLogger.validateAndCreateSet({
        sessionId: 'sess_1',
        userId: user.userId,
        exerciseId: 'ex_1',
        setNumber: 1,
        weight: 100,
        durationSeconds: 30,
      }, 'strength');
    }).toThrowError(EngineError);
  });

  it('3. Throws error if timed set payload contains weight or reps', () => {
    expect(() => {
      SetLogger.validateAndCreateSet({
        sessionId: 'sess_1',
        userId: user.userId,
        exerciseId: 'ex_plank',
        setNumber: 1,
        durationSeconds: 60,
        reps: 10,
      }, 'timed');
    }).toThrowError(EngineError);
  });

  it('4. Supports multiple timed rounds with distinct duration milestones', () => {
    const hollowHold = exerciseFactory.timed({ name: 'Hollow Body Hold' });

    const round1 = SetLogger.validateAndCreateSet({
      sessionId: 'sess_rounds',
      userId: user.userId,
      exerciseId: hollowHold.id,
      setNumber: 1,
      durationSeconds: 30,
    }, 'timed');

    const round2 = SetLogger.validateAndCreateSet({
      sessionId: 'sess_rounds',
      userId: user.userId,
      exerciseId: hollowHold.id,
      setNumber: 2,
      durationSeconds: 40,
    }, 'timed');

    const round3 = SetLogger.validateAndCreateSet({
      sessionId: 'sess_rounds',
      userId: user.userId,
      exerciseId: hollowHold.id,
      setNumber: 3,
      durationSeconds: 50,
    }, 'timed');

    expect(round1.durationSeconds).toBe(30);
    expect(round2.durationSeconds).toBe(40);
    expect(round3.durationSeconds).toBe(50);
  });
});
