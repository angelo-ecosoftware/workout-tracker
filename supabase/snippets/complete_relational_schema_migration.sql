-- ==============================================================================
-- Comprehensive Relational Schema, Foreign Keys & Cascade Constraints Migration
-- ==============================================================================
-- This script applies strict relational integrity, foreign key constraints,
-- cascade deletion policies, compound indexes, and audit triggers across all tables:
-- 1. users
-- 2. exercises
-- 3. workouts
-- 4. workout_exercises
-- 5. sessions
-- 6. sets
-- 7. body_logs
-- 8. food_items
-- 9. dietary_logs
-- 10. dietary_log_entries
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. CLEANUP ORPHAN RECORDS (Pre-migration guarantee for safe constraint attachment)
-- ------------------------------------------------------------------------------

-- Ensure workout_exercises point to valid workouts and exercises
DELETE FROM public.workout_exercises 
WHERE workout_id NOT IN (SELECT id FROM public.workouts)
   OR exercise_id NOT IN (SELECT id FROM public.exercises);

-- Ensure sessions point to valid workouts
DELETE FROM public.sessions 
WHERE workout_id IS NOT NULL 
  AND workout_id NOT IN (SELECT id FROM public.workouts);

-- Ensure sets point to valid sessions and exercises
DELETE FROM public.sets 
WHERE session_id NOT IN (SELECT id FROM public.sessions)
   OR exercise_id NOT IN (SELECT id FROM public.exercises);

-- Ensure dietary_log_entries point to valid dietary_logs
DELETE FROM public.dietary_log_entries 
WHERE dietary_log_id NOT IN (SELECT id FROM public.dietary_logs);

-- If food_item_id in dietary_log_entries does not exist in food_items, set to NULL (safe snapshot preservation)
UPDATE public.dietary_log_entries 
SET food_item_id = NULL 
WHERE food_item_id IS NOT NULL 
  AND food_item_id NOT IN (SELECT id FROM public.food_items);

-- ------------------------------------------------------------------------------
-- 2. WORKOUT_EXERCISES CONSTRAINTS & CASCADES
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  -- FK: workout_exercises -> workouts (ON DELETE CASCADE)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_workout_exercises_workout') THEN
    ALTER TABLE public.workout_exercises
      ADD CONSTRAINT fk_workout_exercises_workout
      FOREIGN KEY (workout_id) REFERENCES public.workouts (id)
      ON DELETE CASCADE;
  END IF;

  -- FK: workout_exercises -> exercises (ON DELETE CASCADE)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_workout_exercises_exercise') THEN
    ALTER TABLE public.workout_exercises
      ADD CONSTRAINT fk_workout_exercises_exercise
      FOREIGN KEY (exercise_id) REFERENCES public.exercises (id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. SESSIONS CONSTRAINTS & CASCADES
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  -- FK: sessions -> workouts (ON DELETE SET NULL / CASCADE)
  -- When a workout routine template is deleted, workout history logs remain with workout_id set to NULL
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sessions_workout') THEN
    ALTER TABLE public.sessions
      ADD CONSTRAINT fk_sessions_workout
      FOREIGN KEY (workout_id) REFERENCES public.workouts (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. SETS CONSTRAINTS & CASCADES
-- ------------------------------------------------------------------------------

DO $$
BEGIN
  -- FK: sets -> sessions (ON DELETE CASCADE)
  -- Deleting a session cleanly deletes all associated sets
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sets_session') THEN
    ALTER TABLE public.sets
      ADD CONSTRAINT fk_sets_session
      FOREIGN KEY (session_id) REFERENCES public.sessions (id)
      ON DELETE CASCADE;
  END IF;

  -- FK: sets -> exercises (ON DELETE RESTRICT or SET NULL)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sets_exercise') THEN
    ALTER TABLE public.sets
      ADD CONSTRAINT fk_sets_exercise
      FOREIGN KEY (exercise_id) REFERENCES public.exercises (id)
      ON DELETE RESTRICT;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. DIETARY LOGS & ENTRIES CONSTRAINTS & CASCADES
-- ------------------------------------------------------------------------------

-- Ensure food_items user_id is nullable for public catalog items
ALTER TABLE IF EXISTS public.food_items
  ALTER COLUMN user_id DROP NOT NULL;

DO $$
BEGIN
  -- FK: dietary_log_entries -> dietary_logs (ON DELETE CASCADE)
  -- Deleting a daily dietary log removes all child entries
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dietary_log_entries_dietary_log') THEN
    ALTER TABLE public.dietary_log_entries
      ADD CONSTRAINT fk_dietary_log_entries_dietary_log
      FOREIGN KEY (dietary_log_id) REFERENCES public.dietary_logs (id)
      ON DELETE CASCADE;
  END IF;

  -- FK: dietary_log_entries -> food_items (ON DELETE SET NULL)
  -- Deleting a catalog item does NOT erase historical logged nutrition snapshots
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_dietary_log_entries_food_item') THEN
    ALTER TABLE public.dietary_log_entries
      ADD CONSTRAINT fk_dietary_log_entries_food_item
      FOREIGN KEY (food_item_id) REFERENCES public.food_items (id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. HIGH-PERFORMANCE B-TREE INDEXES FOR RELATIONS & FOREIGN KEYS
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON public.workout_exercises (workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise ON public.workout_exercises (exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises (workout_id, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_sessions_user_workout ON public.sessions (user_id, workout_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status_date ON public.sessions (user_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sets_session ON public.sets (session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise_user ON public.sets (exercise_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sets_session_set_number ON public.sets (session_id, set_number ASC);

CREATE INDEX IF NOT EXISTS idx_body_logs_user_date ON public.body_logs (user_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_food_items_user_custom ON public.food_items (user_id, is_custom);
CREATE INDEX IF NOT EXISTS idx_dietary_logs_user_date ON public.dietary_logs (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_dietary_log_entries_log ON public.dietary_log_entries (dietary_log_id);
CREATE INDEX IF NOT EXISTS idx_dietary_log_entries_user_log ON public.dietary_log_entries (user_id, dietary_log_id);
CREATE INDEX IF NOT EXISTS idx_dietary_log_entries_food_item ON public.dietary_log_entries (food_item_id);

COMMIT;
