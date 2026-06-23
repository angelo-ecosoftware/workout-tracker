export type ExerciseType = 'strength' | 'timed';

export interface LastSetSummary {
  lastWeight: number;
  lastReps: number;
  lastDurationSeconds?: number;
  lastSessionId: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  lastCompletedWorkoutOrder: number;
  maxWorkoutOrder: number;
  lastSetSummaryPerExercise: Record<string, LastSetSummary>;
  createdAt: Date;
}

export interface Workout {
  id: string;
  name: string;
  order: number;
  exerciseIds: string[];
}

export interface Exercise {
  id: string;
  name: string;
  type: ExerciseType;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
}

export interface Session {
  id: string;
  userId: string;
  workoutId: string;
  status: 'in_progress' | 'completed';
  startedAt: Date;
  completedAt: Date | null;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  userId: string;
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rir: number | null;
  durationSeconds: number | null;
  painScore: number | null;
  loggedAt: Date;
}
