import {
  Workout,
  Exercise,
  UserProfile,
  Session,
  WorkoutSet,
  BodyMeasurementLog,
  FoodItemNutrition,
  DailyDietaryLog,
} from '../../src/models.ts';

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
  create: (overrides: Partial<Session> = {}): Session => sessionFactory.build(overrides),
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

export const workoutSetFactory = setFactory;

export const bodyMeasurementFactory = {
  build: (overrides: Partial<BodyMeasurementLog> = {}): BodyMeasurementLog => ({
    id: `log_${Math.random().toString(36).substring(2, 9)}`,
    userId: 'user_1',
    logDate: '2025-05-01',
    weightKg: 80.0,
    heightCm: 180,
    calculatedBmi: 24.7,
    waistCm: 82.0,
    bodyFatPercentage: 14.5,
    notes: 'Morning weigh-in',
    source: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),
  create: (overrides: Partial<BodyMeasurementLog> = {}): BodyMeasurementLog => bodyMeasurementFactory.build(overrides),
};

export const foodItemFactory = {
  build: (overrides: Partial<FoodItemNutrition> = {}): FoodItemNutrition => ({
    id: `food_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Standard Whey Isolate',
    brand: 'Optimum Nutrition',
    servingUnit: 'gram',
    kcalPer100g: 375,
    proteinPer100g: 82.0,
    carbsPer100g: 3.5,
    sugarPer100g: 1.2,
    fatPer100g: 1.5,
    fiberPer100g: 0.5,
    packageWeightGrams: 1000,
    isCustom: false,
    ...overrides,
  }),
  create: (overrides: Partial<FoodItemNutrition> = {}): FoodItemNutrition => foodItemFactory.build(overrides),
};

export const dailyDietaryLogFactory = {
  build: (overrides: Partial<DailyDietaryLog> = {}): DailyDietaryLog => ({
    date: '2025-05-15',
    entries: [],
    totalKcal: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalSugar: 0,
    totalFat: 0,
    totalFiber: 0,
    ...overrides,
  }),
  create: (overrides: Partial<DailyDietaryLog> = {}): DailyDietaryLog => dailyDietaryLogFactory.build(overrides),
};
