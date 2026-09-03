import { FoodItemNutrition, WorkoutSet, Exercise } from '../models.ts';

// ---------------------------------------------------------------------------
// Scraper & Grocery Ingestion DTO Contracts
// ---------------------------------------------------------------------------

export interface ScrapedProductDTO {
  id: string;
  name: string;
  brand?: string;
  servingUnit?: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  sugarPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  packageWeightGrams?: number;
  pieceCount?: number;
  sourceUrl?: string;
  isCustom?: boolean;
}

export interface SingleProductLinkRequest {
  url: string;
}

export interface SingleProductLinkResponse {
  success: boolean;
  product?: ScrapedProductDTO;
  error?: string;
}

export interface GroceryListBatchRequest {
  listUrl: string;
}

export interface GroceryListBatchResponse {
  success: boolean;
  products?: ScrapedProductDTO[];
  totalFound?: number;
  error?: string;
}

// ---------------------------------------------------------------------------
// Workout Session Timing & Input State DTO Contracts
// ---------------------------------------------------------------------------

export interface SetTimingRecord {
  startedAt?: Date;
  completedAt?: Date;
  restSeconds?: number;
  durationSeconds?: number;
}

export interface WorkoutSetInputState {
  weight: string;
  reps: string;
  durationSeconds?: string;
  difficulty?: string;
}

export type WorkoutInputsMap = Record<string, WorkoutSetInputState>;

export interface SetLogPayload {
  exerciseId: string;
  setNumber: number;
  weight?: number | null;
  reps?: number | null;
  durationSeconds?: number | null;
  difficulty?: number | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  restSeconds?: number | null;
}

export interface ProgressionAdviceResult {
  action: 'increase' | 'keep' | 'loading';
  details: string;
}
