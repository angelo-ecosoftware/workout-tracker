-- Restore all workout routines, exercises, sessions, and sets to Angelo Ghafoerkhan's authenticated account (2b4bd23c-ceff-460d-a73b-2c531686e3b2)

-- 1. Update Workouts (v9_w1, v9_w2, v9_w3, v9_w4)
UPDATE public.workouts
SET user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
WHERE id IN ('v9_w1', 'v9_w2', 'v9_w3', 'v9_w4') OR user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';

-- 2. Update Exercises
UPDATE public.exercises
SET user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
WHERE user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';

-- 3. Update Sessions
UPDATE public.sessions
SET user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
WHERE user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';

-- 4. Update Sets
UPDATE public.sets
SET user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
WHERE user_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2';

-- 5. Update Angelo's user profile with max_workout_order and last_completed_workout_order
UPDATE public.users
SET 
  last_completed_workout_order = 4,
  max_workout_order = 4,
  updated_at = NOW()
WHERE user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';
