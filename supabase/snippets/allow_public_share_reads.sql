-- ==============================================================================
-- MIGRATION: Enable Public Read Access for Shared Workout Sessions & Log Book
-- Allows unauthenticated guests / non-users with a direct share link to view
-- workout session details, sets, exercises, and workout names in read-only mode.
-- ==============================================================================

-- 1. Ensure RLS is active on core tables
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.body_logs ENABLE ROW LEVEL SECURITY;

-- 2. Sessions: Allow public SELECT on completed sessions (or all sessions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Public can view workout sessions'
  ) THEN
    CREATE POLICY "Public can view workout sessions"
      ON public.sessions
      FOR SELECT
      TO public, anon, authenticated
      USING (true);
  END IF;
END $$;

-- 3. Sets: Allow public SELECT on sets for workout inspection
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sets' AND policyname = 'Public can view sets'
  ) THEN
    CREATE POLICY "Public can view sets"
      ON public.sets
      FOR SELECT
      TO public, anon, authenticated
      USING (true);
  END IF;
END $$;

-- 4. Workouts: Allow public SELECT on workouts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workouts' AND policyname = 'Public can view workouts'
  ) THEN
    CREATE POLICY "Public can view workouts"
      ON public.workouts
      FOR SELECT
      TO public, anon, authenticated
      USING (true);
  END IF;
END $$;

-- 5. Exercises: Allow public SELECT on exercises
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'exercises' AND policyname = 'Public can view exercises'
  ) THEN
    CREATE POLICY "Public can view exercises"
      ON public.exercises
      FOR SELECT
      TO public, anon, authenticated
      USING (true);
  END IF;
END $$;

-- 6. Body Logs: Allow public SELECT on body logs for shared session weigh-ins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'body_logs' AND policyname = 'Public can view body logs'
  ) THEN
    CREATE POLICY "Public can view body logs"
      ON public.body_logs
      FOR SELECT
      TO public, anon, authenticated
      USING (true);
  END IF;
END $$;
