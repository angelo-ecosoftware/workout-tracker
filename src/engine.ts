import { UserProfile, Workout, Session, WorkoutSet, Exercise } from './models';

export class EngineError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'EngineError';
  }
}

export interface RoutineStreakStatus {
  streakCount: number; // 0, 1, 2, ... endless
  isBroken: boolean;
  hoursSinceLastSession: number | null;
  recoveryState: 'recovering' | 'ready' | 'streak_at_risk' | 'broken' | 'none';
  recoveryHoursRemaining: number; // 0 to 48
  hoursUntilStreakBreak: number; // 0 to 96
  lastCompletedAt: Date | null;
}

export const SessionEngine = {
  calculateNextWorkoutOrder(user: UserProfile, availableWorkouts?: Workout[]): number {
    if (typeof user.lastCompletedWorkoutOrder !== 'number') {
      throw new EngineError('WORKOUT_ORDER_CORRUPTION', 'Missing or invalid workout order sequence');
    }
    
    // Relational/Dynamic calculation based on available user workouts
    if (availableWorkouts && availableWorkouts.length > 0) {
      const sortedOrders = availableWorkouts.map(w => w.order).sort((a, b) => a - b);

      // If user has not completed any workout yet (0 or negative), begin with first workout
      if (user.lastCompletedWorkoutOrder <= 0) {
        return sortedOrders[0];
      }

      const currentIndex = sortedOrders.indexOf(user.lastCompletedWorkoutOrder);
      
      // If last completed order is not found or it was the last workout in the cycle -> loop back to the first
      if (currentIndex === -1 || currentIndex >= sortedOrders.length - 1) {
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
  },

  /**
   * Calculates continuous routine completion streak (1 to endless) and 48-hour recovery state.
   * Breaks officially if more than 96 hours elapse between consecutive completed sessions.
   * Supports athletes training daily (5-7 days/week) as well as those training every 48-72h.
   */
  calculateRoutineStreak(
    sessions?: Array<{ completedAt?: Date | string | null; startedAt?: Date | string | null; status?: string }>,
    referenceDate = new Date()
  ): RoutineStreakStatus {
    if (!sessions || sessions.length === 0) {
      return {
        streakCount: 0,
        isBroken: false,
        hoursSinceLastSession: null,
        recoveryState: 'none',
        recoveryHoursRemaining: 0,
        hoursUntilStreakBreak: 96,
        lastCompletedAt: null,
      };
    }

    const completed = sessions
      .filter((s) => s.status !== 'in_progress')
      .map((s) => {
        const raw = s.completedAt || s.startedAt;
        return raw ? new Date(raw) : null;
      })
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    if (completed.length === 0) {
      return {
        streakCount: 0,
        isBroken: false,
        hoursSinceLastSession: null,
        recoveryState: 'none',
        recoveryHoursRemaining: 0,
        hoursUntilStreakBreak: 96,
        lastCompletedAt: null,
      };
    }

    const now = new Date(referenceDate);
    const lastCompletedAt = completed[0];
    const diffMs = now.getTime() - lastCompletedAt.getTime();
    const hoursSinceLast = Math.max(0, diffMs / (1000 * 60 * 60));

    // If more than 96 hours elapsed since last completed session, streak is officially broken
    if (hoursSinceLast > 96) {
      return {
        streakCount: 0,
        isBroken: true,
        hoursSinceLastSession: Math.round(hoursSinceLast * 10) / 10,
        recoveryState: 'broken',
        recoveryHoursRemaining: 0,
        hoursUntilStreakBreak: 0,
        lastCompletedAt,
      };
    }

    // Streak is active! Count consecutive sessions completed within 96h of each other
    let streakCount = 1;
    for (let i = 0; i < completed.length - 1; i++) {
      const current = completed[i];
      const previous = completed[i + 1];
      const gapHours = (current.getTime() - previous.getTime()) / (1000 * 60 * 60);

      if (gapHours <= 96 && gapHours >= 0) {
        streakCount++;
      } else {
        break;
      }
    }

    let recoveryState: 'recovering' | 'ready' | 'streak_at_risk' = 'ready';
    let recoveryHoursRemaining = 0;
    const hoursUntilStreakBreak = Math.max(0, Math.ceil(96 - hoursSinceLast));

    if (hoursSinceLast < 48) {
      recoveryState = 'recovering';
      recoveryHoursRemaining = Math.max(0, Math.ceil(48 - hoursSinceLast));
    } else if (hoursSinceLast >= 72) {
      recoveryState = 'streak_at_risk';
    } else {
      recoveryState = 'ready';
    }

    return {
      streakCount,
      isBroken: false,
      hoursSinceLastSession: Math.round(hoursSinceLast * 10) / 10,
      recoveryState,
      recoveryHoursRemaining,
      hoursUntilStreakBreak,
      lastCompletedAt,
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
  calculate1RM(weight: number, reps: number): number {
    if (reps <= 1) return weight;
    // Epley Formula: 1RM = weight * (1 + reps / 30)
    const est = weight * (1 + reps / 30);
    return Math.round(est * 10) / 10;
  },

  calculateNextTarget(
    exercise: Exercise,
    lastSet: { lastWeight: number; lastReps: number; lastSessionId?: string }
  ): { type: 'weight' | 'reps'; suggestedWeight: number; suggestedReps: number } {
    if (lastSet.lastReps >= exercise.targetRepMax) {
      return {
        type: 'weight',
        suggestedWeight: lastSet.lastWeight + 2.5,
        suggestedReps: exercise.targetRepMin,
      };
    }
    return {
      type: 'reps',
      suggestedWeight: lastSet.lastWeight,
      suggestedReps: lastSet.lastReps + 1,
    };
  },

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
