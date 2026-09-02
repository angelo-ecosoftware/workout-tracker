-- ==============================================================================
-- Workout Tracker Database Migration: Dietary Logs & Entries
-- ==============================================================================

-- 1. Daily dietary summary table per user per date
CREATE TABLE IF NOT EXISTS public.dietary_logs (
  id TEXT PRIMARY KEY, -- format: diet_log_{user_id}_{date} or UUID
  user_id TEXT NOT NULL,
  log_date DATE NOT NULL,
  total_kcal NUMERIC(7, 2) DEFAULT 0,
  total_protein NUMERIC(7, 2) DEFAULT 0,
  total_carbs NUMERIC(7, 2) DEFAULT 0,
  total_sugar NUMERIC(7, 2) DEFAULT 0,
  total_fat NUMERIC(7, 2) DEFAULT 0,
  total_fiber NUMERIC(7, 2) DEFAULT 0,
  entries_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_diet_date UNIQUE (user_id, log_date)
);

-- 2. Granular dietary log entries (relational to food_items and dietary_logs)
CREATE TABLE IF NOT EXISTS public.dietary_log_entries (
  id TEXT PRIMARY KEY,
  dietary_log_id TEXT,
  user_id TEXT NOT NULL,
  food_item_id TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  amount_grams NUMERIC(7, 2) NOT NULL,
  kcal_per_100g NUMERIC(7, 2) DEFAULT 0,
  protein_per_100g NUMERIC(7, 2) DEFAULT 0,
  carbs_per_100g NUMERIC(7, 2) DEFAULT 0,
  sugar_per_100g NUMERIC(7, 2) DEFAULT 0,
  fat_per_100g NUMERIC(7, 2) DEFAULT 0,
  fiber_per_100g NUMERIC(7, 2) DEFAULT 0,
  calculated_kcal NUMERIC(7, 2) DEFAULT 0,
  calculated_protein NUMERIC(7, 2) DEFAULT 0,
  calculated_carbs NUMERIC(7, 2) DEFAULT 0,
  calculated_sugar NUMERIC(7, 2) DEFAULT 0,
  calculated_fat NUMERIC(7, 2) DEFAULT 0,
  calculated_fiber NUMERIC(7, 2) DEFAULT 0,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast queries by user and date
CREATE INDEX IF NOT EXISTS idx_dietary_logs_user_date ON public.dietary_logs (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_dietary_log_entries_user ON public.dietary_log_entries (user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_dietary_log_entries_food ON public.dietary_log_entries (food_item_id);

-- 4. Enable Row Level Security & Policies
ALTER TABLE public.dietary_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dietary_log_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow user all on dietary_logs" ON public.dietary_logs;
CREATE POLICY "Allow user all on dietary_logs"
  ON public.dietary_logs FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow user all on dietary_log_entries" ON public.dietary_log_entries;
CREATE POLICY "Allow user all on dietary_log_entries"
  ON public.dietary_log_entries FOR ALL
  USING (true)
  WITH CHECK (true);
