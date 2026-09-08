-- Migration: Fix column names in public.purge_user_account_gdpr
-- user_peer_shares uses owner_id and grantee_id
-- missing_product_reports uses user_id

CREATE OR REPLACE FUNCTION public.purge_user_account_gdpr(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  calling_user_id UUID;
  is_caller_admin BOOLEAN := false;
  deleted_stats JSONB;
  del_body_logs INT := 0;
  del_dietary_entries INT := 0;
  del_dietary_logs INT := 0;
  del_food_items INT := 0;
  del_sets INT := 0;
  del_sessions INT := 0;
  del_workout_drafts INT := 0;
  del_workout_exercises INT := 0;
  del_exercises INT := 0;
  del_workouts INT := 0;
  del_saved_programs INT := 0;
  del_proposals INT := 0;
  del_prescriptions INT := 0;
  del_feedback INT := 0;
  del_peer_shares INT := 0;
  del_coach_links INT := 0;
  del_privacy INT := 0;
  del_roles INT := 0;
  del_reports INT := 0;
  del_users INT := 0;
BEGIN
  calling_user_id := auth.uid();

  -- 1. Authorization check: caller must be the user themselves or a verified platform admin
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required to execute account purge.';
  END IF;

  IF calling_user_id != target_user_id THEN
    -- Check if calling user is admin
    SELECT EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = calling_user_id AND role = 'admin' AND is_approved = true
    ) INTO is_caller_admin;

    IF NOT is_caller_admin THEN
      RAISE EXCEPTION 'Forbidden: You may only execute GDPR purge for your own account.';
    END IF;
  END IF;

  -- 2. Execute atomic cascade deletion across all relational tables

  -- Biometric logs (GDPR Special Category Health Data)
  WITH deleted AS (
    DELETE FROM public.body_logs
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_body_logs FROM deleted;

  -- Dietary logs & entries
  WITH deleted AS (
    DELETE FROM public.dietary_log_entries
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_dietary_entries FROM deleted;

  WITH deleted AS (
    DELETE FROM public.dietary_logs
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_dietary_logs FROM deleted;

  -- Custom user food items (do not delete system items)
  WITH deleted AS (
    DELETE FROM public.food_items
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_food_items FROM deleted;

  -- Workout tracking data: sets, sessions, drafts
  WITH deleted AS (
    DELETE FROM public.sets
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_sets FROM deleted;

  WITH deleted AS (
    DELETE FROM public.sessions
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_sessions FROM deleted;

  WITH deleted AS (
    DELETE FROM public.workout_drafts
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_workout_drafts FROM deleted;

  -- Workout routines & exercises
  WITH deleted AS (
    DELETE FROM public.workout_exercises
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_workout_exercises FROM deleted;

  WITH deleted AS (
    DELETE FROM public.exercises
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_exercises FROM deleted;

  WITH deleted AS (
    DELETE FROM public.workouts
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_workouts FROM deleted;

  WITH deleted AS (
    DELETE FROM public.saved_routine_programs
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_saved_programs FROM deleted;

  -- Coaching relationships, proposals, prescriptions, feedback
  WITH deleted AS (
    DELETE FROM public.routine_proposals
    WHERE athlete_id::text = target_user_id::text OR coach_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_proposals FROM deleted;

  WITH deleted AS (
    DELETE FROM public.coach_macro_prescriptions
    WHERE athlete_id::text = target_user_id::text OR coach_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_prescriptions FROM deleted;

  WITH deleted AS (
    DELETE FROM public.workout_set_coach_feedback
    WHERE coach_id::text = target_user_id::text OR athlete_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_feedback FROM deleted;

  WITH deleted AS (
    DELETE FROM public.coach_athlete_links
    WHERE athlete_id::text = target_user_id::text OR coach_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_coach_links FROM deleted;

  -- Privacy settings & peer shares (uses owner_id and grantee_id)
  WITH deleted AS (
    DELETE FROM public.user_peer_shares
    WHERE owner_id::text = target_user_id::text OR grantee_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_peer_shares FROM deleted;

  WITH deleted AS (
    DELETE FROM public.user_privacy_settings
    WHERE user_id::text = target_user_id::text
    RETURNING user_id
  )
  SELECT count(*) INTO del_privacy FROM deleted;

  -- Missing product reports
  WITH deleted AS (
    DELETE FROM public.missing_product_reports
    WHERE user_id::text = target_user_id::text
    RETURNING id
  )
  SELECT count(*) INTO del_reports FROM deleted;

  -- User roles
  WITH deleted AS (
    DELETE FROM public.user_roles
    WHERE user_id::text = target_user_id::text
    RETURNING user_id
  )
  SELECT count(*) INTO del_roles FROM deleted;

  -- Public user profile
  WITH deleted AS (
    DELETE FROM public.users
    WHERE user_id::text = target_user_id::text
    RETURNING user_id
  )
  SELECT count(*) INTO del_users FROM deleted;

  -- Auth user record in auth.users
  DELETE FROM auth.users WHERE id = target_user_id;

  -- 3. Return summary of purged records
  deleted_stats := jsonb_build_object(
    'success', true,
    'purged_user_id', target_user_id,
    'purged_at', now(),
    'records_purged', jsonb_build_object(
      'body_logs', del_body_logs,
      'dietary_entries', del_dietary_entries,
      'dietary_logs', del_dietary_logs,
      'food_items', del_food_items,
      'sets', del_sets,
      'sessions', del_sessions,
      'workout_drafts', del_workout_drafts,
      'workout_exercises', del_workout_exercises,
      'exercises', del_exercises,
      'workouts', del_workouts,
      'saved_routine_programs', del_saved_programs,
      'routine_proposals', del_proposals,
      'coach_macro_prescriptions', del_prescriptions,
      'coach_feedback', del_feedback,
      'coach_athlete_links', del_coach_links,
      'user_peer_shares', del_peer_shares,
      'user_privacy_settings', del_privacy,
      'missing_product_reports', del_reports,
      'user_roles', del_roles,
      'users', del_users
    )
  );

  RETURN deleted_stats;
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_user_account_gdpr(UUID) TO authenticated;
