-- ==============================================================================
-- INSERT LOGGED WORKOUT SESSION & SETS FROM FIREBASE EXPORT
-- TARGET USER ONLY: 2b4bd23c-ceff-460d-a73b-2c531686e3b2
-- Source session: Hwt15eI1VXQlf4IqY01D (Day 1 - Upper Body A, v9_w1)
-- ==============================================================================

-- 1. Insert/Upsert the Session for user 2b4bd23c-ceff-460d-a73b-2c531686e3b2
INSERT INTO public.sessions (
  id,
  user_id,
  workout_id,
  status,
  started_at,
  completed_at
)
VALUES (
  'Hwt15eI1VXQlf4IqY01D',
  '2b4bd23c-ceff-460d-a73b-2c531686e3b2',
  'v9_w1',
  'completed',
  to_timestamp(1787751652.2),
  to_timestamp(1787751651.0)
)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  workout_id = EXCLUDED.workout_id,
  status = EXCLUDED.status,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at;

-- 2. Insert/Upsert all 23 Workout Sets for user 2b4bd23c-ceff-460d-a73b-2c531686e3b2
INSERT INTO public.sets (
  id,
  session_id,
  user_id,
  exercise_id,
  set_number,
  weight,
  reps,
  duration_seconds,
  logged_at
)
VALUES
  ('aTz8Ay8dcPCBBRUWaKom', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e1_v9', 1, 10, 10, NULL, to_timestamp(1787751653.021)),
  ('7ygizELml7xb2sJQ0d9J', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e1_v9', 2, 10, 10, NULL, to_timestamp(1787751653.021)),
  ('DfuIUqlvkvLtCLYILa0X', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e1_v9', 3, 20, 8, NULL, to_timestamp(1787751653.021)),
  ('Khj3LPVSJCWsNNsofeZd', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e1_v9', 4, 20, 10, NULL, to_timestamp(1787751653.021)),

  ('vFmHNnnLYV1z4qMqTnA9', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e2_v9', 1, 30, 12, NULL, to_timestamp(1787751653.021)),
  ('Ll6eAfF9J6ZqreIBjryI', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e2_v9', 2, 30, 10, NULL, to_timestamp(1787751653.021)),
  ('5q6cNn61IS2VSCcF2wlj', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e2_v9', 3, 30, 12, NULL, to_timestamp(1787751653.021)),
  ('6pCl6THnoDBt2QL3LWJL', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e2_v9', 4, 30, 12, NULL, to_timestamp(1787751653.021)),

  ('VqkYspceSNLWhQtNWJMD', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e3_v9', 1, 10, 12, NULL, to_timestamp(1787751653.021)),
  ('yNH4aetmhvOYnqYPDwWS', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e3_v9', 2, 10, 10, NULL, to_timestamp(1787751653.021)),
  ('oWF0YDG856cyltU1lN9S', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e3_v9', 3, 10, 10, NULL, to_timestamp(1787751653.021)),

  ('y7YRrl3peWKEqXIc1L4e', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e4_v9', 1, 20, 12, NULL, to_timestamp(1787751653.021)),
  ('cqdFGA2FvVEpxx6ELc5R', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e4_v9', 2, 30, 8, NULL, to_timestamp(1787751653.021)),
  ('zUHpP52Cy1ndwTWAtFhf', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e4_v9', 3, 30, 8, NULL, to_timestamp(1787751653.021)),

  ('s4ZSFdFv0SFtXfRfy44s', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e5_v9', 1, 4, 16, NULL, to_timestamp(1787751653.021)),
  ('8rLowH65vmHVi56gq6zr', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e5_v9', 2, 4, 16, NULL, to_timestamp(1787751653.021)),
  ('wBfAdLBusAnEygtwW8E7', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e5_v9', 3, 4, 12, NULL, to_timestamp(1787751653.021)),
  ('gi2LtFzwkKQ98jym5GvU', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e5_v9', 4, 4, 12, NULL, to_timestamp(1787751653.021)),

  ('ArUnJ1FZJhAp4Jv7RKa6', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e6_v9', 1, 0, 8, NULL, to_timestamp(1787751653.021)),
  ('E88EbFq5Rd8B7BTVC3rX', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e6_v9', 2, 0, 6, NULL, to_timestamp(1787751653.021)),
  ('XW8iv5RR3fbphJKjs1QT', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e6_v9', 3, 0, 4, NULL, to_timestamp(1787751653.021)),
  ('WOG5J4y5zpNlEAB67fdz', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e6_v9', 4, 0, 2, NULL, to_timestamp(1787751653.021)),

  ('TasK30RRbuZP2X8jWyA1', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e7_v9', 1, 7.5, 12, NULL, to_timestamp(1787751653.021)),
  ('MWyI5Lx3lOHMUNuzxpqg', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e7_v9', 2, 7.5, 12, NULL, to_timestamp(1787751653.021)),
  ('ZbWj1sage2N9pg6tOwgE', 'Hwt15eI1VXQlf4IqY01D', '2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'd1_e7_v9', 3, 10, 12, NULL, to_timestamp(1787751653.021))
ON CONFLICT (id) DO UPDATE SET
  session_id = EXCLUDED.session_id,
  user_id = EXCLUDED.user_id,
  exercise_id = EXCLUDED.exercise_id,
  set_number = EXCLUDED.set_number,
  weight = EXCLUDED.weight,
  reps = EXCLUDED.reps,
  duration_seconds = EXCLUDED.duration_seconds,
  logged_at = EXCLUDED.logged_at;

-- 3. Update user progression cache so progression arrows and last weights reflect this completed session
UPDATE public.users
SET
  last_completed_workout_order = 1,
  last_set_summary_per_exercise = '{
    "d1_e1_v9": {"lastWeight": 20, "lastReps": 10, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e2_v9": {"lastWeight": 30, "lastReps": 12, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e3_v9": {"lastWeight": 10, "lastReps": 10, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e4_v9": {"lastWeight": 30, "lastReps": 8, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e5_v9": {"lastWeight": 4, "lastReps": 12, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e6_v9": {"lastWeight": 0, "lastReps": 2, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e7_v9": {"lastWeight": 10, "lastReps": 12, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"}
  }'::jsonb
WHERE user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
   OR id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';
