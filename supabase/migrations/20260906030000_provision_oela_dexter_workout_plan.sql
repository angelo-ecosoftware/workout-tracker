-- 1. Ensure user_roles entry for Oela Dexter (e38a245e-008c-4ea1-ac90-52b337000eb2)
INSERT INTO public.user_roles (user_id, role, specialty, is_approved, created_at, updated_at)
VALUES ('e38a245e-008c-4ea1-ac90-52b337000eb2', 'athlete', NULL, true, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE
SET role = 'athlete', is_approved = true, updated_at = NOW();

-- 2. Ensure users profile row for Dexter
INSERT INTO public.users (
  id,
  user_id,
  email,
  name,
  last_completed_workout_order,
  max_workout_order,
  last_set_summary_per_exercise,
  metrics,
  date_of_birth,
  gender,
  height_cm,
  weight_kg,
  fitness_level,
  training_location,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'e38a245e-008c-4ea1-ac90-52b337000eb2',
  'dexteroela@gmail.com',
  'Oela Dexter',
  0,
  4,
  '{}'::jsonb,
  '{"gender": "male", "height": 185, "weight": 104, "fitnessLevel": "beginner", "trainingLocation": "gym"}'::jsonb,
  '2001-12-27',
  'male',
  185,
  104,
  'beginner',
  'gym',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET 
  max_workout_order = 4,
  updated_at = NOW();

-- 3. Clone all exercises for Dexter
INSERT INTO public.exercises (id, user_id, name, type, target_sets, target_rep_min, target_rep_max, created_at)
SELECT 
  'dexter_' || e.id,
  'e38a245e-008c-4ea1-ac90-52b337000eb2'::uuid,
  e.name,
  e.type,
  e.target_sets,
  e.target_rep_min,
  e.target_rep_max,
  NOW()
FROM public.exercises e
WHERE e.user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
ON CONFLICT (id) DO NOTHING;

-- 4. Clone all 4 workouts for Dexter
INSERT INTO public.workouts (id, user_id, name, "order", exercise_ids, created_at)
SELECT 
  'dexter_' || w.id,
  'e38a245e-008c-4ea1-ac90-52b337000eb2'::uuid,
  w.name,
  w."order",
  ARRAY(
    SELECT 'dexter_' || unnest(w.exercise_ids)
  ),
  NOW()
FROM public.workouts w
WHERE w.user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
ON CONFLICT (id) DO NOTHING;

-- 5. Clone workout_exercises junction rows for Dexter if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workout_exercises') THEN
    INSERT INTO public.workout_exercises (workout_id, exercise_id, position, user_id)
    SELECT 
      'dexter_' || we.workout_id,
      'dexter_' || we.exercise_id,
      we.position,
      'e38a245e-008c-4ea1-ac90-52b337000eb2'::uuid
    FROM public.workout_exercises we
    WHERE we.user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
