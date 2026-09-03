export type ExerciseType = 'strength' | 'timed';

export interface LastSetSummary {
  lastWeight: number;
  lastReps: number;
  lastDurationSeconds?: number;
  lastSessionId: string;
}

export interface UserMetrics {
  dateOfBirth?: string; // YYYY-MM-DD
  height?: number; // cm
  weight?: number; // kg
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  goals?: string[]; // Multiple standard goals selected
  trainingLocation?: 'gym' | 'home' | 'hybrid';
  bodyMeasurementsNotes?: string; // Freeform notes
  updatedAt?: string;
}

export interface BodyMeasurementLog {
  id: string;
  userId: string;
  logDate: string; // YYYY-MM-DD (unique per day per user)
  weightKg: number;
  heightCm?: number;
  calculatedBmi?: number;
  waistCm?: number;
  bodyFatPercentage?: number;
  notes?: string;
  source?: 'profile' | 'workout_session' | 'manual';
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm?: number;
  weightKg?: number;
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  trainingLocation?: 'gym' | 'home' | 'hybrid';
  lastCompletedWorkoutOrder: number;
  maxWorkoutOrder: number;
  lastSetSummaryPerExercise: Record<string, LastSetSummary>;
  createdAt: Date;
  updatedAt?: Date;
  metrics?: UserMetrics;
}

export interface WorkoutExercise {
  id: string;
  userId?: string;
  workoutId: string;
  exerciseId: string;
  sortOrder: number;
  createdAt?: Date;
}

export interface Workout {
  id: string;
  userId?: string;
  name: string;
  order: number;
  exerciseIds?: string[];
  exercises?: Exercise[];
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
  notes?: string | null;
  photos?: string[] | null;
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  userId: string;
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  durationSeconds: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  restSeconds?: number | null;
  loggedAt: Date;
}

// ==========================================
// Dietary & Nutrition Models
// ==========================================

export interface FoodItemNutrition {
  id: string;
  name: string;
  brand?: string;
  servingUnit?: string; // default 'gram' or 'ml'
  // Base nutrition values normalized PER 100g / 100ml
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sourceUrl?: string;
  barcode?: string;
  // Package sizing and user isolation
  packageWeightGrams?: number;
  pieceCount?: number;
  isCustom?: boolean;
  userId?: string;
}

export interface LoggedDietaryEntry {
  id: string;
  foodItemId: string;
  name: string;
  brand?: string;
  amountGrams: number; // e.g. 40g
  // Base 100g values for recalculation
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  // Calculated actual consumed values based on amountGrams
  calculatedKcal: number;
  calculatedProtein: number;
  calculatedCarbs: number;
  calculatedSugar: number;
  calculatedFat: number;
  calculatedFiber: number;
  loggedAt?: string;
}

export interface DailyDietaryLog {
  date: string; // YYYY-MM-DD
  entries: LoggedDietaryEntry[];
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalSugar: number;
  totalFat: number;
  totalFiber: number;
}
