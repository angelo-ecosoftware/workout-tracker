import { Workout, Exercise, UserProfile, Session, WorkoutSet } from '../../src/models.ts';

export const userFactory = {
  build: (overrides: Partial<UserProfile> = {}): UserProfile => ({
    userId: `user_${Math.random().toString(36).substring(2, 9)}`,
    email: 'elon.athlete@spacex.com',
    name: 'Elon Musk',
    lastCompletedWorkoutOrder: 1,
    maxWorkoutOrder: 3,
    lastSetSummaryPerExercise: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
};

export const exerciseFactory = {
  build: (overrides: Partial<Exercise> = {}): Exercise => ({
    id: `ex_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Barbell Bench Press',
    targetSets: 4,
    targetRepMin: 8,
    targetRepMax: 12,
    type: 'strength',
    ...overrides,
  }),
  timed: (overrides: Partial<Exercise> = {}): Exercise => ({
    id: `ex_timed_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Plank Hold',
    targetSets: 3,
    targetRepMin: 45,
    targetRepMax: 60,
    type: 'timed',
    ...overrides,
  }),
};

export const workoutFactory = {
  build: (overrides: Partial<Workout & { exercises: Exercise[] }> = {}): Workout & { exercises: Exercise[] } => ({
    id: `wk_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Push Day Hypertrophy',
    order: 1,
    exercises: [
      exerciseFactory.build({ name: 'Incline Dumbbell Press' }),
      exerciseFactory.build({ name: 'Overhead Press' }),
    ],
    ...overrides,
  }),
};

export const sessionFactory = {
  build: (overrides: Partial<Session> = {}): Session => ({
    id: `sess_${Math.random().toString(36).substring(2, 9)}`,
    userId: 'user_1',
    workoutId: 'wk_push_1',
    status: 'completed',
    startedAt: new Date(),
    completedAt: new Date(),
    notes: 'Max effort sets completed cleanly.',
    photos: [],
    ...overrides,
  }),
};

export const setFactory = {
  build: (overrides: Partial<WorkoutSet> = {}): WorkoutSet => ({
    id: `set_${Math.random().toString(36).substring(2, 9)}`,
    sessionId: 'sess_1',
    userId: 'user_1',
    exerciseId: 'ex_bench',
    setNumber: 1,
    weight: 100,
    reps: 10,
    durationSeconds: null,
    loggedAt: new Date(),
    ...overrides,
  }),
};
