import { UserProfile, Workout, Session, WorkoutSet } from '../types/index.ts';

export class EngineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

export const SessionEngine = {
  calculateNextWorkoutOrder(user: UserProfile, availableWorkouts?: Workout[]): number {
    if (typeof user.lastCompletedWorkoutOrder !== 'number') {
      throw new EngineError('WORKOUT_ORDER_CORRUPTION', 'Missing or invalid workout order sequence');
    }
    
    // Relational/Dynamic calculation based on available user workouts
    if (availableWorkouts && availableWorkouts.length > 0) {
      const sortedOrders = availableWorkouts.map(w => w.order).sort((a, b) => a - b);
      const currentIndex = sortedOrders.indexOf(user.lastCompletedWorkoutOrder);
      
      // If last completed order is not found or it was the last workout in the cycle -> loop back to the first
      if (currentIndex === -1 || currentIndex === sortedOrders.length - 1) {
        return sortedOrders[0];
      }
      return sortedOrders[currentIndex + 1];
    }

    // Fallback if workouts are not passed
    const maxOrder = user.maxWorkoutOrder || 3;
    let nextOrder = user.lastCompletedWorkoutOrder + 1;
    if (nextOrder > maxOrder) {
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
      durationSeconds: payload.durationSeconds ?? null,
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

    // Cache miss
    return null;
  }
};
