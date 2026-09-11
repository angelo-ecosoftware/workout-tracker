-- Security Gate A: owner isolation, explicit public session shares,
-- and controlled coach review writes.

CREATE TABLE IF NOT EXISTS public.public_session_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  owner_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  share_photos boolean NOT NULL DEFAULT false,
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

ALTER TABLE public.public_session_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_session_shares FORCE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_public_session_shares_session
  ON public.public_session_shares (session_id);

CREATE INDEX IF NOT EXISTS idx_public_session_shares_owner
  ON public.public_session_shares (owner_id);

DROP POLICY IF EXISTS "Users can manage their own public session shares"
  ON public.public_session_shares;

CREATE POLICY "Users can manage their own public session shares"
  ON public.public_session_shares
  FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.id = public_session_shares.session_id
        AND s.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    owner_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.id = public_session_shares.session_id
        AND s.user_id = auth.uid()::text
    )
  );

-- Remove broad permissive policies whose USING/WITH CHECK true expressions
-- defeated the owner policies.
DROP POLICY IF EXISTS "Allow all for authenticated users on workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow anon select on workouts" ON public.workouts;
DROP POLICY IF EXISTS "Public can view workouts for shared sessions" ON public.workouts;
DROP POLICY IF EXISTS "Users can manage own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Users can manage their own workouts" ON public.workouts;

DROP POLICY IF EXISTS "Allow all users full access to workout_exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Public can view workout exercises for shared routines" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can manage own workout_exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Users can manage their own workout exercises" ON public.workout_exercises;

DROP POLICY IF EXISTS "Allow all for authenticated users on sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow anon select on sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow coaches to update review status" ON public.sessions;
DROP POLICY IF EXISTS "Coaches and athletes can update session coach notes" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can select their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view sessions" ON public.sessions;

DROP POLICY IF EXISTS "Allow all for authenticated users on sets" ON public.sets;
DROP POLICY IF EXISTS "Allow anon select on sets" ON public.sets;
DROP POLICY IF EXISTS "Users can delete own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can delete their own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can insert own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can insert their own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can manage own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can select their own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can update own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can update their own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can view sets" ON public.sets;

DROP POLICY IF EXISTS "Allow all for authenticated users on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow anon select on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Global catalog exercises are viewable by all" ON public.exercises;
DROP POLICY IF EXISTS "Users can delete custom exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can manage custom exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can manage own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can update custom exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view global and own exercises" ON public.exercises;

DROP POLICY IF EXISTS "Users manage their own saved programs" ON public.saved_routine_programs;
DROP POLICY IF EXISTS "Connected coaches can view athlete saved programs" ON public.saved_routine_programs;

CREATE POLICY "Owners can manage workouts"
  ON public.workouts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Accepted coaches can read workouts"
  ON public.workouts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.coach_athlete_links link
      WHERE link.coach_id = auth.uid()
        AND link.athlete_id::text = workouts.user_id
        AND link.status = 'accepted'
    )
  );

CREATE POLICY "Owners can manage workout exercises"
  ON public.workout_exercises
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
        AND w.user_id = auth.uid()::text
    )
    AND EXISTS (
      SELECT 1
      FROM public.exercises e
      WHERE e.id = workout_exercises.exercise_id
        AND (
          e.user_id = '00000000-0000-0000-0000-000000000000'
          OR e.user_id = auth.uid()::text
        )
    )
  );

CREATE POLICY "Accepted coaches can read workout exercises"
  ON public.workout_exercises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.workouts w
      JOIN public.coach_athlete_links link
        ON link.athlete_id::text = w.user_id
       AND link.coach_id = auth.uid()
       AND link.status = 'accepted'
      WHERE w.id = workout_exercises.workout_id
    )
  );

CREATE POLICY "Owners can manage sessions"
  ON public.sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.workouts w
      WHERE w.id = sessions.workout_id
        AND w.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Accepted coaches can read sessions"
  ON public.sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.coach_athlete_links link
      WHERE link.coach_id = auth.uid()
        AND link.athlete_id::text = sessions.user_id
        AND link.status = 'accepted'
    )
  );

CREATE POLICY "Owners can manage sets"
  ON public.sets
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.id = sets.session_id
        AND s.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    user_id = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM public.sessions s
      WHERE s.id = sets.session_id
        AND s.user_id = auth.uid()::text
    )
    AND EXISTS (
      SELECT 1
      FROM public.exercises e
      WHERE e.id = sets.exercise_id
        AND (
          e.user_id = '00000000-0000-0000-0000-000000000000'
          OR e.user_id = auth.uid()::text
        )
    )
  );

CREATE POLICY "Accepted coaches can read sets"
  ON public.sets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.sessions s
      JOIN public.coach_athlete_links link
        ON link.athlete_id::text = s.user_id
       AND link.coach_id = auth.uid()
       AND link.status = 'accepted'
      WHERE s.id = sets.session_id
    )
  );

CREATE POLICY "Catalog exercises are publicly readable"
  ON public.exercises
  FOR SELECT
  TO anon, authenticated
  USING (user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Owners can read own exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Owners can manage own exercises"
  ON public.exercises
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()::text
    AND user_id <> '00000000-0000-0000-0000-000000000000'
  )
  WITH CHECK (
    user_id = auth.uid()::text
    AND user_id <> '00000000-0000-0000-0000-000000000000'
  );

CREATE POLICY "Accepted coaches can read athlete exercises"
  ON public.exercises
  FOR SELECT
  TO authenticated
  USING (
    user_id <> '00000000-0000-0000-0000-000000000000'
    AND EXISTS (
      SELECT 1
      FROM public.coach_athlete_links link
      WHERE link.coach_id = auth.uid()
        AND link.athlete_id::text = exercises.user_id
        AND link.status = 'accepted'
    )
  );

CREATE POLICY "Owners can manage saved programs"
  ON public.saved_routine_programs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Accepted coaches can read saved programs"
  ON public.saved_routine_programs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.coach_athlete_links link
      WHERE link.coach_id = auth.uid()
        AND link.athlete_id = saved_routine_programs.user_id
        AND link.status = 'accepted'
    )
  );

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.get_public_session_by_token(p_token_hash text)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
  WITH authorized_share AS (
    SELECT
      ps.id AS share_id,
      ps.session_id,
      ps.owner_id,
      ps.share_photos,
      ps.photo_urls,
      s.status,
      s.started_at,
      s.completed_at,
      s.sleep_hours,
      s.energy_score,
      s.workout_id,
      w.name AS workout_name,
      COALESCE(ups.share_photos, false) AS owner_allows_photos
    FROM public.public_session_shares ps
    JOIN public.sessions s ON s.id = ps.session_id
    JOIN public.workouts w ON w.id = s.workout_id
    LEFT JOIN public.user_privacy_settings ups
      ON ups.user_id::text = s.user_id
    WHERE ps.token_hash = p_token_hash
      AND ps.revoked_at IS NULL
      AND s.status = 'completed'
  )
  SELECT CASE
    WHEN a.share_id IS NULL THEN NULL::jsonb
    ELSE jsonb_build_object(
      'session', jsonb_build_object(
        'id', a.session_id,
        'status', a.status,
        'startedAt', a.started_at,
        'completedAt', a.completed_at,
        'sleepHours', a.sleep_hours,
        'energyScore', a.energy_score
      ),
      'workout', jsonb_build_object(
        'id', a.workout_id,
        'name', a.workout_name
      ),
      'exercises', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', e.id,
            'name', e.name,
            'type', e.type
          )
          ORDER BY e.name
        )
        FROM (
          SELECT DISTINCT st.exercise_id
          FROM public.sets st
          WHERE st.session_id = a.session_id
        ) used
        JOIN public.exercises e ON e.id = used.exercise_id
      ), '[]'::jsonb),
      'sets', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', st.id,
            'exerciseId', st.exercise_id,
            'setNumber', st.set_number,
            'weight', st.weight,
            'reps', st.reps,
            'durationSeconds', st.duration_seconds
          )
          ORDER BY st.exercise_id, st.set_number, st.id
        )
        FROM public.sets st
        WHERE st.session_id = a.session_id
      ), '[]'::jsonb),
      'photos', CASE
        WHEN a.share_photos AND a.owner_allows_photos
          THEN a.photo_urls
        ELSE '[]'::jsonb
      END
    )
  END
  FROM authorized_share a;
$$;

REVOKE ALL ON FUNCTION private.get_public_session_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_public_session_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_session_by_token(p_token_hash text)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private, extensions, pg_temp
AS $$
  SELECT private.get_public_session_by_token(p_token_hash);
$$;

REVOKE ALL ON FUNCTION public.get_public_session_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_session_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.update_session_coach_notes(
  p_session_id text,
  p_coach_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  target_session public.sessions;
  display_name text;
BEGIN
  SELECT s.*
  INTO target_session
  FROM public.sessions s
  WHERE s.id = p_session_id
    AND EXISTS (
      SELECT 1
      FROM public.coach_athlete_links link
      WHERE link.coach_id = auth.uid()
        AND link.athlete_id::text = s.user_id
        AND link.status = 'accepted'
    );

  IF target_session.id IS NULL THEN
    RAISE EXCEPTION 'Not authorized to update coach notes';
  END IF;

  SELECT COALESCE(u.name, u.email, 'Coach')
  INTO display_name
  FROM public.users u
  WHERE u.user_id = auth.uid()::text
  LIMIT 1;

  UPDATE public.sessions
  SET coach_notes = NULLIF(trim(p_coach_notes), '')
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'coachNotes', NULLIF(trim(p_coach_notes), ''),
    'coachName', COALESCE(display_name, 'Coach')
  );
END;
$$;

REVOKE ALL ON FUNCTION private.update_session_coach_notes(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.update_session_coach_notes(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_session_coach_notes(
  p_session_id text,
  p_coach_notes text
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private, extensions, pg_temp
AS $$
  SELECT private.update_session_coach_notes(p_session_id, p_coach_notes);
$$;

REVOKE ALL ON FUNCTION public.update_session_coach_notes(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_session_coach_notes(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION private.mark_session_reviewed(
  p_session_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  display_name text;
  v_reviewed_at timestamptz := now();
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.sessions s
    JOIN public.coach_athlete_links link
      ON link.athlete_id::text = s.user_id
     AND link.coach_id = auth.uid()
     AND link.status = 'accepted'
    WHERE s.id = p_session_id
  ) THEN
    RAISE EXCEPTION 'Not authorized to review session';
  END IF;

  SELECT COALESCE(u.name, u.email, 'Coach')
  INTO display_name
  FROM public.users u
  WHERE u.user_id = auth.uid()::text
  LIMIT 1;

  UPDATE public.sessions
  SET reviewed_at = v_reviewed_at,
      reviewed_by_coach_id = auth.uid(),
      reviewed_by_coach_name = COALESCE(display_name, 'Coach')
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'reviewedAt', v_reviewed_at,
    'coachName', COALESCE(display_name, 'Coach')
  );
END;
$$;

REVOKE ALL ON FUNCTION private.mark_session_reviewed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.mark_session_reviewed(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_session_reviewed(
  p_session_id text
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public, private, extensions, pg_temp
AS $$
  SELECT private.mark_session_reviewed(p_session_id);
$$;

REVOKE ALL ON FUNCTION public.mark_session_reviewed(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_session_reviewed(text) TO authenticated;

-- User/session media must not remain globally readable. Owner access is
-- granted by the first path segment, which is the authenticated user ID.
UPDATE storage.buckets
SET public = false
WHERE id IN ('workout-media', 'media');

DROP POLICY IF EXISTS "Allow public read access to workout-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to workout media" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to media" ON storage.objects;
DROP POLICY IF EXISTS "Allow athletes to upload photos to own folder in workout-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow athletes to delete own photos in workout-media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can only view their own media files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

CREATE POLICY "Owners can read workout media"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('workout-media', 'media')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can upload workout media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('workout-media', 'media')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can update workout media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('workout-media', 'media')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('workout-media', 'media')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners can delete workout media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('workout-media', 'media')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
