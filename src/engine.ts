import { UserProfile, Workout, Session, WorkoutSet } from './models';

export class EngineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

export const SessionEngine = {
  calculateNextWorkoutOrder(user: UserProfile): number {
    if (typeof user.lastCompletedWorkoutOrder !== 'number' || typeof user.maxWorkoutOrder !== 'number') {
      throw new EngineError('WORKOUT_ORDER_CORRUPTION', 'Missing or invalid workout order sequence');
    }
    
    let nextOrder = user.lastCompletedWorkoutOrder + 1;
    if (nextOrder > user.maxWorkoutOrder) {
      nextOrder = 1;
    }
    
    return nextOrder;
  },

  createSession(user: UserProfile, targetWorkout: Workout): Omit<Session, 'id'> {
    return {
      userId: user.userId,
      workoutId: targetWorkout.id,
      status: 'in_progress',
      startedAt: new Date(),
      completedAt: null
    };
  }
};

export const SetLogger = {
  validateAndCreateSet(payload: Partial<WorkoutSet>, type: 'strength' | 'timed'): Omit<WorkoutSet, 'id'> {
    if (!payload.sessionId || !payload.userId || !payload.exerciseId || !payload.setNumber) {
      throw new EngineError('INVALID_PAYLOAD', 'Missing required identifiers for set');
    }

    if (type === 'strength') {
      if (payload.weight == null || payload.reps == null) {
        throw new EngineError('INVALID_PAYLOAD', 'Strength sets require weight and reps');
      }
      if (payload.durationSeconds != null) {
        throw new EngineError('INVALID_PAYLOAD', 'Strength sets must not contain durationSeconds');
      }
    } else if (type === 'timed') {
      if (payload.durationSeconds == null) {
        throw new EngineError('INVALID_PAYLOAD', 'Timed sets require durationSeconds');
      }
      if (payload.weight != null || payload.reps != null) {
        throw new EngineError('INVALID_PAYLOAD', 'Timed sets must not contain weight or reps');
      }
    }
    
    return {
      sessionId: payload.sessionId,
      userId: payload.userId,
      exerciseId: payload.exerciseId,
      setNumber: payload.setNumber,
      weight: payload.weight ?? null,
      reps: payload.reps ?? null,
      rir: payload.rir ?? null,
      durationSeconds: payload.durationSeconds ?? null,
      painScore: payload.painScore ?? null,
      loggedAt: new Date()
    };
  }
};

export const ProgressionEngine = {
  evaluateProgression(
    exerciseId: string, 
    userCache?: UserProfile['lastSetSummaryPerExercise']
  ) {
    // PRIMARY LOOKUP: Write-through cache on user session completion
    const primarySummary = userCache?.[exerciseId];
    if (primarySummary) {
      return primarySummary; // Return O(1) cached lookup
    }

    // TERTIARY LOOKUP SIGNAL: App must fallback to querying sets collection
    // Callers must implement secondary/tertiary retrieval rules since the cache missed.
    return null;
  }
};
