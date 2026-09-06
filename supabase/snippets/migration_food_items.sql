-- ==============================================================================
-- Workout Tracker Database Migration: Food Items Hive-Mind Catalog
-- Execute in Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.food_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  serving_unit TEXT DEFAULT 'gram',
  kcal_per_100g NUMERIC(7, 2) DEFAULT 0,
  protein_per_100g NUMERIC(7, 2) DEFAULT 0,
  carbs_per_100g NUMERIC(7, 2) DEFAULT 0,
  sugar_per_100g NUMERIC(7, 2) DEFAULT 0,
  fat_per_100g NUMERIC(7, 2) DEFAULT 0,
  fiber_per_100g NUMERIC(7, 2) DEFAULT 0,
  source_url TEXT,
  package_weight_grams NUMERIC,
  piece_count NUMERIC,
  is_custom BOOLEAN DEFAULT false,
  user_id TEXT,
  created_by TEXT DEFAULT 'community',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast case-insensitive search
CREATE INDEX IF NOT EXISTS idx_food_items_name ON public.food_items (name);
CREATE INDEX IF NOT EXISTS idx_food_items_brand ON public.food_items (brand);
CREATE INDEX IF NOT EXISTS idx_food_items_user_id ON public.food_items (user_id);
CREATE INDEX IF NOT EXISTS idx_food_items_is_custom ON public.food_items (is_custom);
CREATE INDEX IF NOT EXISTS idx_food_items_created_at ON public.food_items (created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access for hive-mind shared community catalog
DROP POLICY IF EXISTS "Allow public read access on food_items" ON public.food_items;
CREATE POLICY "Allow public read access on food_items"
  ON public.food_items FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public write access on food_items" ON public.food_items;
CREATE POLICY "Allow public write access on food_items"
  ON public.food_items FOR ALL
  USING (true)
  WITH CHECK (true);
