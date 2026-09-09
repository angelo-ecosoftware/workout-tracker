-- Migration: Add traditional Treadmill and Treadmill Running to public.exercises with verified animated GIF
INSERT INTO public.exercises (
  id,
  user_id,
  name,
  type,
  target_sets,
  target_rep_min,
  target_rep_max,
  is_custom,
  category,
  image_url
) VALUES
  (
    'cat_ex_treadmill',
    '00000000-0000-0000-0000-000000000000',
    'Treadmill',
    'timed',
    1,
    900,
    1800,
    false,
    'Cardio',
    'https://static.exercisedb.dev/media/rjiM4L3.gif'
  ),
  (
    'cat_ex_treadmill_running',
    '00000000-0000-0000-0000-000000000000',
    'Treadmill Running',
    'timed',
    1,
    1200,
    2400,
    false,
    'Cardio',
    'https://static.exercisedb.dev/media/rjiM4L3.gif'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  target_sets = EXCLUDED.target_sets,
  target_rep_min = EXCLUDED.target_rep_min,
  target_rep_max = EXCLUDED.target_rep_max,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  is_custom = false;
