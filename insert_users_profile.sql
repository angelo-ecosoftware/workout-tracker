-- ==============================================================================
-- INSERT PROFILE FOR USER & ENSURE RLS POLICIES
-- ==============================================================================

-- 1. Ensure id column has a default generator or allow text/serial
DO $$ BEGIN
  ALTER TABLE public.users ALTER COLUMN id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS last_completed_workout_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_workout_order INTEGER DEFAULT 4,
  ADD COLUMN IF NOT EXISTS last_set_summary_per_exercise JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER DEFAULT NULL;

-- Make user_id unique if not already
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Insert/Upsert profile for user 2b4bd23c-ceff-460d-a73b-2c531686e3b2
INSERT INTO public.users (
  user_id,
  email,
  name,
  last_completed_workout_order,
  max_workout_order,
  last_set_summary_per_exercise,
  onboarding_completed,
  training_days_per_week
)
VALUES (
  '2b4bd23c-ceff-460d-a73b-2c531686e3b2',
  'angelo@example.com',
  'angelo',
  1,
  4,
  '{
    "d1_e1_v9": {"lastWeight": 20, "lastReps": 10, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e2_v9": {"lastWeight": 30, "lastReps": 12, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e3_v9": {"lastWeight": 10, "lastReps": 10, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e4_v9": {"lastWeight": 30, "lastReps": 8, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e5_v9": {"lastWeight": 4, "lastReps": 12, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e6_v9": {"lastWeight": 0, "lastReps": 2, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"},
    "d1_e7_v9": {"lastWeight": 10, "lastReps": 12, "lastDurationSeconds": null, "lastSessionId": "Hwt15eI1VXQlf4IqY01D"}
  }'::jsonb,
  TRUE,
  4
)
ON CONFLICT (user_id) DO UPDATE SET
  onboarding_completed = TRUE,
  training_days_per_week = 4,
  last_completed_workout_order = 1;

-- 3. Configure permissive RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view profile" ON public.users;
CREATE POLICY "Users can view profile"
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (true);
