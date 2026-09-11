CREATE EXTENSION IF NOT EXISTS pgtap;

BEGIN;

SELECT plan(16);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'workouts',
        'workout_exercises',
        'sessions',
        'sets',
        'exercises'
      )
      AND (qual = 'true' OR with_check = 'true')
  ),
  'private resource policies contain no unconditional predicates'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'workouts',
        'workout_exercises',
        'sessions',
        'sets'
      )
      AND roles && ARRAY['anon', 'public']::name[]
  ),
  'anonymous roles have no base-table policy for private resources'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'exercises'
      AND policyname = 'Catalog exercises are publicly readable'
      AND qual LIKE '%00000000-0000-0000-0000-000000000000%'
  ),
  'anonymous catalog access uses the verified sentinel'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workouts'
      AND policyname = 'Owners can manage workouts'
  ),
  'workout owner policy exists'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workout_exercises'
      AND policyname = 'Owners can manage workout exercises'
      AND with_check LIKE '%workouts%'
      AND with_check LIKE '%exercises%'
  ),
  'workout exercise mutation checks both parents'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sessions'
      AND policyname = 'Owners can manage sessions'
      AND with_check LIKE '%workouts%'
  ),
  'session mutation checks the owning workout'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sets'
      AND policyname = 'Owners can manage sets'
      AND with_check LIKE '%sessions%'
      AND with_check LIKE '%exercises%'
  ),
  'set mutation checks both parent session and exercise'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'saved_routine_programs'
      AND policyname = 'Accepted coaches can read saved programs'
  ),
  'saved routine coach read policy is preserved'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_public_session_by_token'
  ),
  'public sessions use an explicit token function'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_session_coach_notes'
  ),
  'coach notes use a controlled function'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'mark_session_reviewed'
  ),
  'coach review uses a controlled function'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM public.public_session_shares
    WHERE false
  ) OR EXISTS (
    SELECT 1
    FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
      AND relname = 'public_session_shares'
      AND relrowsecurity
  ),
  'public share records have RLS enabled'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM storage.buckets
    WHERE id IN ('workout-media', 'media')
      AND public = true
  ),
  'private photo buckets are not public'
);

SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND roles && ARRAY['anon', 'public']::name[]
      AND qual LIKE '%workout-media%'
  ),
  'private workout media has no anonymous read policy'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Owners can read workout media'
      AND qual LIKE '%auth.uid%'
  ),
  'private media read is owner-scoped'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'public_session_shares'
      AND policyname = 'Users can manage their own public session shares'
  ),
  'share records are owner-managed'
);

SELECT * FROM finish();
ROLLBACK;
