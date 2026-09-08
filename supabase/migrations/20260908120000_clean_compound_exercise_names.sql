-- Migration: Clean compound exercise names to adhere to single-exercise taxonomy
-- "1 exercise is 1 exercise - no multi-type compound sentences with 'or' or '/'"

UPDATE public.exercises
SET name = 'Barbell Bench Press'
WHERE name = 'Bench Press (barbell or dumbbell)';

UPDATE public.exercises
SET name = 'Pull-ups'
WHERE name = 'Pull-ups / Lat Pulldown';

UPDATE public.exercises
SET name = 'Seated Cable Row'
WHERE name = 'Seated Cable Row / Dumbbell Row';

UPDATE public.exercises
SET name = 'Triceps Pushdown'
WHERE name = 'Triceps Pushdown or Dips';

UPDATE public.exercises
SET name = 'Barbell Back Squat'
WHERE name = 'Back Squat or Goblet Squat';

UPDATE public.exercises
SET name = 'Lying Leg Curl'
WHERE name = 'Leg Curl (machine or Nordic)';

UPDATE public.exercises
SET name = 'Chest-Supported Row'
WHERE name = 'Chest-Supported Row or Rear-Delt Fly';

UPDATE public.exercises
SET name = 'Barbell Deadlift'
WHERE name = 'Deadlift or Romanian Deadlift';

UPDATE public.exercises
SET name = 'Front Squat'
WHERE name = 'Front Squat or Leg Press';

UPDATE public.exercises
SET name = 'Chest Dips'
WHERE name = 'Dips (Chest / Triceps)';

UPDATE public.exercises
SET name = 'Rear Delt Flyes'
WHERE name = 'Rear Delt Flyes (Machine or Dumbbell)';

UPDATE public.exercises
SET name = 'Lying Leg Curl'
WHERE name = 'Leg Curl (Lying or Seated)';

UPDATE public.exercises
SET name = 'Hanging Knee Raises'
WHERE name = 'Hanging Leg / Knee Raises';

UPDATE public.exercises
SET name = 'Overhead Press'
WHERE name = 'Overhead Press / Military Press';
