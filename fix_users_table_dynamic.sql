-- ==============================================================================
-- FIX PUBLIC.USERS FOREIGN KEY CONSTRAINT & SETUP FOR DYNAMIC MULTI-USER REGISTRATION
-- ==============================================================================

-- 1. Drop foreign key constraint on users.id pointing to auth.users if it blocks or mismatches
DO $$ BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_users_id_fk;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Make sure users.id has a default UUID generator so it never requires manual id
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Ensure all required dynamic columns exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS user_id TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS last_completed_workout_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_workout_order INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS last_set_summary_per_exercise JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS training_days_per_week INTEGER DEFAULT NULL;

-- 4. Ensure unique constraint on user_id for conflict resolution
DO $$ BEGIN
  ALTER TABLE public.users ADD CONSTRAINT users_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. Open RLS policies for dynamic user operations
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public users select" ON public.users;
CREATE POLICY "Public users select" ON public.users 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public users insert" ON public.users;
CREATE POLICY "Public users insert" ON public.users 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public users update" ON public.users;
CREATE POLICY "Public users update" ON public.users 
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public users delete" ON public.users;
CREATE POLICY "Public users delete" ON public.users 
  FOR DELETE USING (true);
