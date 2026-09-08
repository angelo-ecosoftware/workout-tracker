-- Migration: Log completed Day 1 workout session for Oela Dexter (2026-09-06)
-- Athlete: e38a245e-008c-4ea1-ac90-52b337000eb2 (Oela Dexter)
-- Workout: dexter_v9_w1 (Day 1 - Upper Body A)

-- 1. Ensure exercise dexter_d1_e2_v9 is titled Lat Pulldown
UPDATE public.exercises
SET name = 'Lat Pulldown'
WHERE id = 'dexter_d1_e2_v9' AND user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';

-- 2. Insert Session into public.sessions
DO $$
DECLARE
  v_session_id TEXT := 'd10e1a00-0000-4000-8000-000000000001';
  v_dexter_id TEXT := 'e38a245e-008c-4ea1-ac90-52b337000eb2';
  v_workout_id TEXT := 'dexter_v9_w1';
  v_logged_at TIMESTAMPTZ := '2026-09-06T15:00:00.000Z';
BEGIN
  -- Insert session
  INSERT INTO public.sessions (
    id,
    user_id,
    workout_id,
    status,
    sleep_hours,
    energy_score,
    started_at,
    completed_at,
    notes,
    photos
  ) VALUES (
    v_session_id,
    v_dexter_id,
    v_workout_id,
    'completed',
    7,
    7,
    '2026-09-06T14:00:00.000Z',
    v_logged_at,
    'first time after long time i took it easy and did a few upper body excercises',
    '[]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE
  SET
    status = 'completed',
    sleep_hours = 7,
    energy_score = 7,
    started_at = '2026-09-06T14:00:00.000Z',
    completed_at = v_logged_at,
    notes = 'first time after long time i took it easy and did a few upper body excercises';

  -- Clean up any existing sets for this session to ensure exact state
  DELETE FROM public.sets WHERE session_id = v_session_id;

  -- 3. Insert sets for Lat Pulldown (dexter_d1_e2_v9): 3 sets x 10 reps x 30kg
  INSERT INTO public.sets (id, session_id, user_id, exercise_id, set_number, weight, reps, logged_at, rest_seconds)
  VALUES
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e2_v9', 1, 30, 10, v_logged_at, 90),
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e2_v9', 2, 30, 10, v_logged_at, 90),
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e2_v9', 3, 30, 10, v_logged_at, 90);

  -- 4. Insert sets for Triceps Pushdown (dexter_d1_e7_v9): 3 sets x 10 reps x 10kg
  INSERT INTO public.sets (id, session_id, user_id, exercise_id, set_number, weight, reps, logged_at, rest_seconds)
  VALUES
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e7_v9', 1, 10, 10, v_logged_at, 90),
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e7_v9', 2, 10, 10, v_logged_at, 90),
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e7_v9', 3, 10, 10, v_logged_at, 90);

  -- 5. Insert sets for Lateral Raises (dexter_d1_e5_v9): 3 sets x 10 reps x 5kg
  INSERT INTO public.sets (id, session_id, user_id, exercise_id, set_number, weight, reps, logged_at, rest_seconds)
  VALUES
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e5_v9', 1, 5, 10, v_logged_at, 90),
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e5_v9', 2, 5, 10, v_logged_at, 90),
    (gen_random_uuid()::text, v_session_id, v_dexter_id, 'dexter_d1_e5_v9', 3, 5, 10, v_logged_at, 90);

  -- 6. Insert Body Log for session date: 105 kg
  INSERT INTO public.body_logs (id, user_id, log_date, weight_kg, source, created_at, updated_at)
  VALUES (
    'd10e1a00-0000-4000-8000-000000000002',
    v_dexter_id,
    '2026-09-06',
    105.0,
    'workout_session',
    v_logged_at,
    v_logged_at
  )
  ON CONFLICT (user_id, log_date) DO UPDATE
  SET weight_kg = 105.0, updated_at = v_logged_at, source = 'workout_session';

  -- 7. Update Dexter's User Profile
  UPDATE public.users
  SET
    weight_kg = 105.0,
    last_completed_workout_order = 1,
    last_set_summary_per_exercise = jsonb_build_object(
      'dexter_d1_e2_v9', jsonb_build_object('lastWeight', 30, 'lastReps', 10, 'lastSessionId', v_session_id),
      'dexter_d1_e7_v9', jsonb_build_object('lastWeight', 10, 'lastReps', 10, 'lastSessionId', v_session_id),
      'dexter_d1_e5_v9', jsonb_build_object('lastWeight', 5, 'lastReps', 10, 'lastSessionId', v_session_id)
    ),
    updated_at = NOW()
  WHERE user_id = v_dexter_id;

END $$;
