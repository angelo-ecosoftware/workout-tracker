ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS training_days text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS session_duration_minutes smallint,
  ADD COLUMN IF NOT EXISTS goals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS injuries_notes text,
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS onboarding_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_session_duration_minutes_check,
  DROP CONSTRAINT IF EXISTS users_onboarding_status_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_session_duration_minutes_check
    CHECK (session_duration_minutes IS NULL OR session_duration_minutes IN (30, 60, 90, 120)),
  ADD CONSTRAINT users_onboarding_status_check
    CHECK (onboarding_status IN ('not_started', 'in_progress', 'deferred', 'completed'));

-- Do not interrupt existing users when this onboarding is introduced.
UPDATE public.users
SET onboarding_status = 'completed',
    onboarding_completed_at = COALESCE(onboarding_completed_at, updated_at, created_at, now())
WHERE onboarding_status = 'not_started'
  AND created_at < now();
