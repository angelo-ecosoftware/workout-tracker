-- ==============================================================================
-- MIGRATION: Synchronize User Last Completed Workout Order on Session Deletion
-- Fixes:
-- Recalculates users.last_completed_workout_order whenever a session is deleted,
-- inserted, or updated. Prevents order gaps and incorrect suggested routine day
-- indicator (green dot) when athletes delete past workout sessions.
-- ==============================================================================

-- 1. Index on sessions for instant index-scan on latest completed session
CREATE INDEX IF NOT EXISTS idx_sessions_user_status_completed
  ON public.sessions (user_id, status, completed_at DESC);

-- 2. Trigger function to recalculate user's last_completed_workout_order
CREATE OR REPLACE FUNCTION public.sync_user_last_completed_workout_order()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id TEXT;
  latest_order INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  -- Find the most recent completed session for this user and get its workout's order
  SELECT w.order INTO latest_order
  FROM public.sessions s
  JOIN public.workouts w ON w.id = s.workout_id
  WHERE s.user_id = target_user_id
    AND s.status = 'completed'
    AND s.completed_at IS NOT NULL
  ORDER BY s.completed_at DESC
  LIMIT 1;

  -- Update users table with the actual latest completed workout order (or 0 if no completed sessions exist)
  UPDATE public.users
  SET last_completed_workout_order = COALESCE(latest_order, 0)
  WHERE user_id = target_user_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach trigger to sessions table
DROP TRIGGER IF EXISTS trg_sync_user_workout_order ON public.sessions;
CREATE TRIGGER trg_sync_user_workout_order
AFTER INSERT OR UPDATE OF status, completed_at, workout_id OR DELETE ON public.sessions
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_last_completed_workout_order();

-- 4. One-time data backfill: Re-align all users' last_completed_workout_order with actual sessions
UPDATE public.users u
SET last_completed_workout_order = COALESCE(
  (
    SELECT w.order
    FROM public.sessions s
    JOIN public.workouts w ON w.id = s.workout_id
    WHERE s.user_id = u.user_id
      AND s.status = 'completed'
      AND s.completed_at IS NOT NULL
    ORDER BY s.completed_at DESC
    LIMIT 1
  ),
  0
);
