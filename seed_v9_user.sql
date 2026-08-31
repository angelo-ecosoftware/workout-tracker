-- ==============================================================================
-- SEED SCRIPT: v9_spartan (4-Day Split & 27 Exercises)
-- TARGET USER ONLY: 2b4bd23c-ceff-460d-a73b-2c531686e3b2
-- ==============================================================================

-- 1. Upsert Exercises Catalog (v9_spartan) with user_id
INSERT INTO public.exercises (id, user_id, name, type, target_sets, target_rep_min, target_rep_max)
VALUES
  ('d1_e1_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Bench Press (barbell or dumbbell)', 'strength', 4, 6, 10),
  ('d1_e2_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Pull-ups / Lat Pulldown', 'strength', 4, 6, 10),
  ('d1_e3_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Overhead Press', 'strength', 3, 6, 10),
  ('d1_e4_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Seated Cable Row / Dumbbell Row', 'strength', 3, 8, 12),
  ('d1_e5_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Lateral Raises', 'strength', 4, 12, 20),
  ('d1_e6_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Push-up Ladder', 'strength', 4, 12, 15),
  ('d1_e7_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Triceps Pushdown or Dips', 'strength', 3, 8, 12),
  ('d2_e1_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Back Squat or Goblet Squat', 'strength', 4, 6, 10),
  ('d2_e2_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Romanian Deadlift', 'strength', 3, 8, 10),
  ('d2_e3_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Bulgarian Split Squat', 'strength', 3, 8, 12),
  ('d2_e4_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Leg Curl (machine or Nordic)', 'strength', 3, 10, 15),
  ('d2_e5_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Hanging Knee Raises', 'strength', 3, 10, 15),
  ('d2_e6_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Plank', 'timed', 3, 45, 60),
  ('d2_e7_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Conditioning Block (10 min)', 'timed', 10, 30, 30),
  ('d3_e1_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Incline Dumbbell Press', 'strength', 4, 8, 12),
  ('d3_e2_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Pull-ups / Lat Pulldown', 'strength', 4, 8, 12),
  ('d3_e3_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Dumbbell Shoulder Press', 'strength', 3, 8, 12),
  ('d3_e4_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Chest-Supported Row or Rear-Delt Fly', 'strength', 3, 12, 20),
  ('d3_e5_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Lateral Raises', 'strength', 4, 12, 20),
  ('d3_e6_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Hammer Curls', 'strength', 3, 8, 12),
  ('d3_e7_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Push-up Ladder', 'strength', 4, 12, 15),
  ('d4_e1_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Deadlift or Romanian Deadlift', 'strength', 3, 5, 8),
  ('d4_e2_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Front Squat or Leg Press', 'strength', 3, 8, 12),
  ('d4_e3_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Walking Lunges', 'strength', 3, 10, 10),
  ('d4_e4_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Calf Raises', 'strength', 3, 10, 15),
  ('d4_e5_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Ab-Wheel Rollout or Hanging Leg Raises', 'strength', 3, 6, 15),
  ('d4_e6_v9', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Conditioning Block (10 min)', 'timed', 10, 30, 30)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  target_sets = EXCLUDED.target_sets,
  target_rep_min = EXCLUDED.target_rep_min,
  target_rep_max = EXCLUDED.target_rep_max;

-- 2. Upsert Workout Split Routines (v9_spartan) with user_id
INSERT INTO public.workouts (id, user_id, name, "order", exercise_ids)
VALUES
  ('v9_w1', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Day 1 - Upper Body A', 1, ARRAY['d1_e1_v9', 'd1_e2_v9', 'd1_e3_v9', 'd1_e4_v9', 'd1_e5_v9', 'd1_e6_v9', 'd1_e7_v9']),
  ('v9_w2', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Day 2 - Lower Body A + Abs', 2, ARRAY['d2_e1_v9', 'd2_e2_v9', 'd2_e3_v9', 'd2_e4_v9', 'd2_e5_v9', 'd2_e6_v9', 'd2_e7_v9']),
  ('v9_w3', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Day 3 - Upper Body B', 3, ARRAY['d3_e1_v9', 'd3_e2_v9', 'd3_e3_v9', 'd3_e4_v9', 'd3_e5_v9', 'd3_e6_v9', 'd3_e7_v9']),
  ('v9_w4', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'Day 4 - Lower Body B + Abs', 4, ARRAY['d4_e1_v9', 'd4_e2_v9', 'd4_e3_v9', 'd4_e4_v9', 'd4_e5_v9', 'd4_e6_v9'])
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  name = EXCLUDED.name,
  "order" = EXCLUDED."order",
  exercise_ids = EXCLUDED.exercise_ids;

-- 3. Update User Profile for 2b4bd23c-ceff-460d-a73b-2c531686e3b2 to 4-day max workout cycle
UPDATE public.users
SET max_workout_order = 4
WHERE user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
   OR id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';
