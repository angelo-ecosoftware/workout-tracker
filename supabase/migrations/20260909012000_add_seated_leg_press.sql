-- Migration: Insert Seated Leg Press into public.exercises
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
) VALUES (
  'cat_ex_seated_leg_press',
  '00000000-0000-0000-0000-000000000000',
  'Seated Leg Press',
  'strength',
  3,
  10,
  15,
  false,
  'Legs',
  'https://static.exercisedb.dev/media/2Qh2J1e.gif'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  is_custom = false;
