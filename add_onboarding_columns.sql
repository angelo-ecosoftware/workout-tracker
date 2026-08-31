-- ==============================================================================
-- ADD ONBOARDING ATTRIBUTES TO USERS TABLE
-- ==============================================================================

-- 1. Add onboarding columns if they don't already exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER DEFAULT NULL;

-- 2. Ensure existing main user (2b4bd23c-ceff-460d-a73b-2c531686e3b2) is marked completed with 4 days
UPDATE public.users
SET 
  onboarding_completed = TRUE,
  training_days_per_week = 4
WHERE user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
   OR id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';
