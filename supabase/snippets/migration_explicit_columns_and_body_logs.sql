-- ==============================================================================
-- Workout Tracker Database Migration: Explicit Columns & Body Logs
-- Execute in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

-- 1. Add Explicit Profile & Biometric Columns to 'users' table (if not existing)
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS fitness_level TEXT,
  ADD COLUMN IF NOT EXISTS training_location TEXT,
  ADD COLUMN IF NOT EXISTS metrics JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create 'body_logs' Table for Daily Time-Series Bodyweight & BMI History
CREATE TABLE IF NOT EXISTS public.body_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  weight_kg NUMERIC(5, 2) NOT NULL,
  height_cm NUMERIC(5, 2),
  calculated_bmi NUMERIC(4, 1),
  waist_cm NUMERIC(5, 2),
  body_fat_percentage NUMERIC(4, 1),
  notes TEXT,
  source TEXT DEFAULT 'profile',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT body_logs_user_date_unique UNIQUE (user_id, log_date)
);

-- Index for fast user timeline lookup
CREATE INDEX IF NOT EXISTS idx_body_logs_user_date ON public.body_logs (user_id, log_date ASC);

-- 3. Ensure 'workout_exercises' Junction Table exists and has 'sort_order' & 'position' columns
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  workout_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  sort_order INT4 NOT NULL DEFAULT 0,
  position INT4 NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- In case 'workout_exercises' already existed previously with 'sort_order', add 'position' or vice-versa
ALTER TABLE IF EXISTS public.workout_exercises
  ADD COLUMN IF NOT EXISTS sort_order INT4 DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position INT4 DEFAULT 0;

-- Sync position with sort_order if position was just added
UPDATE public.workout_exercises
SET position = COALESCE(position, sort_order, 0)
WHERE position IS NULL OR position = 0;

CREATE INDEX IF NOT EXISTS idx_workout_exercises_user_workout 
  ON public.workout_exercises (user_id, workout_id, position ASC);

-- 4. Enable Row Level Security (RLS) on new table
ALTER TABLE public.body_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Allow authenticated users to manage their own records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'body_logs' AND policyname = 'Users can manage their own body logs'
  ) THEN
    CREATE POLICY "Users can manage their own body logs"
      ON public.body_logs
      FOR ALL
      USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workout_exercises' AND policyname = 'Users can manage their own workout exercises'
  ) THEN
    CREATE POLICY "Users can manage their own workout exercises"
      ON public.workout_exercises
      FOR ALL
      USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;
