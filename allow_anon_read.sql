-- ==============================================================================
-- FIX RLS SELECT POLICIES FOR ANON & AUTHENTICATED
-- ==============================================================================

-- Make sure anon role also has select policies for public data & checking
DROP POLICY IF EXISTS "Allow anon select on users" ON public.users;
DROP POLICY IF EXISTS "Allow anon select on workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow anon select on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Allow anon select on sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow anon select on sets" ON public.sets;

CREATE POLICY "Allow anon select on users" ON public.users FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon select on workouts" ON public.workouts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon select on exercises" ON public.exercises FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon select on sessions" ON public.sessions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon select on sets" ON public.sets FOR SELECT TO anon USING (true);
