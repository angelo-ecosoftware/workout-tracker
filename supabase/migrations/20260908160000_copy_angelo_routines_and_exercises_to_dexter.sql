-- Migration: Copy all routines and exercises from Angelo Ghafoerkhan to Oela Dexter
-- Angelo Ghafoerkhan: '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
-- Oela Dexter: 'e38a245e-008c-4ea1-ac90-52b337000eb2'

-- 1. Remove outdated/unlinked workout_exercises, workouts, and exercises for Dexter
DELETE FROM public.workout_exercises WHERE user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';
DELETE FROM public.workouts WHERE user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';
DELETE FROM public.exercises WHERE user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';

-- 2. Insert all current exercises from Angelo to Dexter
INSERT INTO public.exercises (
  id,
  user_id,
  name,
  type,
  target_sets,
  target_rep_min,
  target_rep_max,
  is_custom,
  custom_cues,
  created_at
)
SELECT 
  'dexter_' || e.id,
  'e38a245e-008c-4ea1-ac90-52b337000eb2',
  e.name,
  e.type,
  e.target_sets,
  e.target_rep_min,
  e.target_rep_max,
  e.is_custom,
  e.custom_cues,
  NOW()
FROM public.exercises e
WHERE e.user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';

-- 3. Insert all current workouts from Angelo to Dexter
INSERT INTO public.workouts (
  id,
  user_id,
  name,
  "order",
  exercise_ids,
  created_at
)
SELECT 
  'dexter_' || w.id,
  'e38a245e-008c-4ea1-ac90-52b337000eb2',
  w.name,
  w."order",
  ARRAY(
    SELECT 'dexter_' || unnest(w.exercise_ids)
  ),
  NOW()
FROM public.workouts w
WHERE w.user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';

-- 4. Insert all workout_exercises junction rows from Angelo to Dexter
INSERT INTO public.workout_exercises (
  workout_id,
  exercise_id,
  position,
  user_id
)
SELECT 
  'dexter_' || we.workout_id,
  'dexter_' || we.exercise_id,
  we.position,
  'e38a245e-008c-4ea1-ac90-52b337000eb2'
FROM public.workout_exercises we
WHERE we.user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';

-- 5. Synchronize max_workout_order on Dexter's profile
UPDATE public.users
SET 
  max_workout_order = (SELECT max_workout_order FROM public.users WHERE user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'),
  updated_at = NOW()
WHERE user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';
