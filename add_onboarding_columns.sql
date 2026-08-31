-- ==============================================================================
-- ADD ONBOARDING ATTRIBUTES & CONFIGURE RLS ON USERS TABLE
-- ==============================================================================

-- 1. Add onboarding columns if they don't already exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER DEFAULT NULL;

-- 2. Ensure RLS policies allow authenticated users to SELECT, INSERT and UPDATE their profile
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id::uuid OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id::uuid OR auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id::uuid OR auth.uid()::text = user_id);

-- 3. Ensure existing main user (2b4bd23c-ceff-460d-a73b-2c531686e3b2) is marked completed with 4 days
UPDATE public.users
SET 
  onboarding_completed = TRUE,
  training_days_per_week = 4
WHERE user_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2'
   OR id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2';
