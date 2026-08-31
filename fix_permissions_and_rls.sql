-- ==============================================================================
-- FIX SUPABASE PERMISSIONS & ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. Grant base table permissions to authenticated and anon roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- Ensure future tables also inherit permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing conflicting policies if any
DROP POLICY IF EXISTS "Allow public read for workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow public read for exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can manage sets" ON public.sets;
DROP POLICY IF EXISTS "Allow all for authenticated users on users" ON public.users;
DROP POLICY IF EXISTS "Allow all for authenticated users on workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow all for authenticated users on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow all for authenticated users on sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow all for authenticated users on sets" ON public.sets;

-- 4. Create RLS Policies for authenticated users
CREATE POLICY "Allow all for authenticated users on users"
ON public.users FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users on workouts"
ON public.workouts FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users on exercises"
ON public.exercises FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users on sessions"
ON public.sessions FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users on sets"
ON public.sets FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 5. Ensure schema types allow TEXT IDs for sessions and sets
DO $$ BEGIN
  ALTER TABLE public.sets DROP CONSTRAINT IF EXISTS sets_session_id_fkey;
  ALTER TABLE public.sets DROP CONSTRAINT IF EXISTS sets_session_id_sessions_id_fk;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.sessions ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.sets ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.sets ALTER COLUMN session_id TYPE TEXT;

DO $$ BEGIN
  ALTER TABLE public.sets ADD CONSTRAINT sets_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
