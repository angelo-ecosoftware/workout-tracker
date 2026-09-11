ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_version integer;

-- Existing users have already used the application and should not be
-- interrupted by the new first-login onboarding flow.
UPDATE public.users
SET onboarding_completed_at = COALESCE(onboarding_completed_at, created_at, now()),
    onboarding_version = COALESCE(onboarding_version, 1)
WHERE onboarding_completed_at IS NULL;
