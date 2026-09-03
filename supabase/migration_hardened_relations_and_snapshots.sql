-- ==============================================================================
-- Workout Tracker Database Hardening: Robust Constraints, Cascades & Precision
-- ==============================================================================

-- 1. Ensure 'food_items' table has nullable user_id for global items
ALTER TABLE IF EXISTS public.food_items
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Foreign Key from dietary_log_entries -> food_items with ON DELETE SET NULL
-- This guarantees that if a catalog product is modified/removed, the user's historical log snapshot is protected
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dietary_log_entries_food_item'
  ) THEN
    ALTER TABLE public.dietary_log_entries
      ADD CONSTRAINT fk_dietary_log_entries_food_item
      FOREIGN KEY (food_item_id) REFERENCES public.food_items (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Foreign Key from dietary_log_entries -> dietary_logs with ON DELETE CASCADE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dietary_log_entries_dietary_log'
  ) THEN
    ALTER TABLE public.dietary_log_entries
      ADD CONSTRAINT fk_dietary_log_entries_dietary_log
      FOREIGN KEY (dietary_log_id) REFERENCES public.dietary_logs (id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Fast Compound B-Tree Indexes for zero-latency queries
CREATE INDEX IF NOT EXISTS idx_dietary_log_entries_user_log ON public.dietary_log_entries (user_id, dietary_log_id);
CREATE INDEX IF NOT EXISTS idx_dietary_log_entries_user_date ON public.dietary_log_entries (user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_items_global_user ON public.food_items (user_id, is_custom);

-- 5. Hardened RLS Policy for food_items: Global items (user_id IS NULL) are readable by everyone, custom items are private
DROP POLICY IF EXISTS "Allow public read access on food_items" ON public.food_items;
CREATE POLICY "Allow public read access on food_items"
  ON public.food_items FOR SELECT
  USING (user_id IS NULL OR is_custom = false OR auth.uid()::text = user_id);
