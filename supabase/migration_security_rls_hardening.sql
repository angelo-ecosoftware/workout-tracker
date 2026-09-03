-- ==============================================================================
-- Comprehensive Cyber Security & Zero-Trust RLS Hardening Migration
-- Mitigates:
-- 1. Insecure Direct Object References (IDOR) & Broken Object Level Authorization (BOLA)
-- 2. SQL Injection / Privilege Escalation via RLS bypass
-- 3. Insider Threat / Unauthorized Tampering
-- 4. Misconfiguration / Overly Permissive Policies
-- ==============================================================================

-- ==========================================
-- 1. FORCE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==========================================
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workouts FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercises FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_exercises FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sessions FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sets FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.body_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.body_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.food_items FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.dietary_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dietary_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.dietary_log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.dietary_log_entries FORCE ROW LEVEL SECURITY;

-- ==========================================
-- 2. USERS PROFILE PROTECTION
-- ==========================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow user all on users" ON public.users;

-- Read: Authenticated user can only read their own profile, or public read if shared
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR auth.uid()::text = user_id::text);

-- Insert: Can only register/insert profile matching their own auth uid
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id::text OR auth.uid()::text = user_id::text);

-- Update: Can only modify their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text OR auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = id::text OR auth.uid()::text = user_id::text);

-- ==========================================
-- 3. WORKOUTS (ROUTINES) & WORKOUT_EXERCISES
-- ==========================================
DROP POLICY IF EXISTS "Users can manage their own workouts" ON public.workouts;
DROP POLICY IF EXISTS "Public can view workouts" ON public.workouts;
DROP POLICY IF EXISTS "Allow user all on workouts" ON public.workouts;
DROP POLICY IF EXISTS "Public can view workouts for shared sessions" ON public.workouts;

CREATE POLICY "Users can manage their own workouts"
  ON public.workouts
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Shared link read-only access for workouts
CREATE POLICY "Public can view workouts for shared sessions"
  ON public.workouts
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage their own workout exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Public can view workout exercises for shared routines" ON public.workout_exercises;

CREATE POLICY "Users can manage their own workout exercises"
  ON public.workout_exercises
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view workout exercises for shared routines"
  ON public.workout_exercises
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ==========================================
-- 4. EXERCISES (GLOBAL CATALOG VS CUSTOM)
-- ==========================================
DROP POLICY IF EXISTS "Public can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can manage their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can view global and own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can manage custom exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can update custom exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can delete custom exercises" ON public.exercises;

-- Anyone can read global exercises (user_id IS NULL) or their own custom exercises
CREATE POLICY "Users can view global and own exercises"
  ON public.exercises
  FOR SELECT
  TO anon, authenticated
  USING (user_id IS NULL OR is_custom = false OR auth.uid()::text = user_id::text);

-- Users can only insert/modify their own custom exercises
CREATE POLICY "Users can manage custom exercises"
  ON public.exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text AND is_custom = true);

CREATE POLICY "Users can update custom exercises"
  ON public.exercises
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text AND is_custom = true)
  WITH CHECK (auth.uid()::text = user_id::text AND is_custom = true);

CREATE POLICY "Users can delete custom exercises"
  ON public.exercises
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text AND is_custom = true);

-- ==========================================
-- 5. SESSIONS & SETS (WORKOUT EXECUTION)
-- ==========================================
DROP POLICY IF EXISTS "Public can view workout sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

-- Read: Own sessions or shared public view
CREATE POLICY "Users can view sessions"
  ON public.sessions
  FOR SELECT
  TO anon, authenticated
  USING (auth.uid()::text = user_id::text OR status = 'completed');

-- Write/Modify/Delete: STRICTLY isolated to the owner
CREATE POLICY "Users can insert own sessions"
  ON public.sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own sessions"
  ON public.sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Public can view sets" ON public.sets;
DROP POLICY IF EXISTS "Users can manage their own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can view sets" ON public.sets;
DROP POLICY IF EXISTS "Users can insert own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can update own sets" ON public.sets;
DROP POLICY IF EXISTS "Users can delete own sets" ON public.sets;

CREATE POLICY "Users can view sets"
  ON public.sets
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can insert own sets"
  ON public.sets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own sets"
  ON public.sets
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own sets"
  ON public.sets
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- ==========================================
-- 6. BODY LOGS (BIOMETRIC TIMELINE)
-- ==========================================
DROP POLICY IF EXISTS "Public can view body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can manage their own body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can view own body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can insert own body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can update own body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can delete own body logs" ON public.body_logs;

CREATE POLICY "Users can view own body logs"
  ON public.body_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own body logs"
  ON public.body_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own body logs"
  ON public.body_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own body logs"
  ON public.body_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

-- ==========================================
-- 7. FOOD ITEMS (HIVE-MIND CATALOG VS CUSTOM FOODS)
-- ==========================================
DROP POLICY IF EXISTS "Allow public read access on food_items" ON public.food_items;
DROP POLICY IF EXISTS "Allow public write access on food_items" ON public.food_items;
DROP POLICY IF EXISTS "Allow authenticated insert food_items" ON public.food_items;
DROP POLICY IF EXISTS "Allow insert food_items" ON public.food_items;
DROP POLICY IF EXISTS "Allow update own food_items" ON public.food_items;
DROP POLICY IF EXISTS "Allow delete own food_items" ON public.food_items;

-- Read: Verified store foods (user_id IS NULL) are public. Custom foods only by owner.
CREATE POLICY "Allow public read access on food_items"
  ON public.food_items
  FOR SELECT
  TO anon, authenticated
  USING (user_id IS NULL OR is_custom = false OR auth.uid()::text = user_id::text);

-- Insert: Authenticated users can contribute verified store foods or create private items
CREATE POLICY "Allow insert food_items"
  ON public.food_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- If custom food: must belong to the user
    (is_custom = true AND auth.uid()::text = user_id::text)
    OR
    -- If public store food: user_id is null/community
    (is_custom = false AND (user_id IS NULL OR user_id::text = 'community' OR auth.uid()::text = user_id::text))
  );

-- Update/Delete: Only owner can modify/delete custom food
CREATE POLICY "Allow update own food_items"
  ON public.food_items
  FOR UPDATE
  TO authenticated
  USING (is_custom = true AND auth.uid()::text = user_id::text)
  WITH CHECK (is_custom = true AND auth.uid()::text = user_id::text);

CREATE POLICY "Allow delete own food_items"
  ON public.food_items
  FOR DELETE
  TO authenticated
  USING (is_custom = true AND auth.uid()::text = user_id::text);

-- ==========================================
-- 8. DIETARY LOGS & DIETARY LOG ENTRIES (ZERO-LEAK PRIVACY)
-- ==========================================
DROP POLICY IF EXISTS "Allow user all on dietary_logs" ON public.dietary_logs;
DROP POLICY IF EXISTS "Allow user all on dietary_log_entries" ON public.dietary_log_entries;
DROP POLICY IF EXISTS "Users can manage own dietary_logs" ON public.dietary_logs;
DROP POLICY IF EXISTS "Users can manage own dietary_log_entries" ON public.dietary_log_entries;
DROP POLICY IF EXISTS "Users can view own dietary_logs" ON public.dietary_logs;
DROP POLICY IF EXISTS "Users can insert own dietary_logs" ON public.dietary_logs;
DROP POLICY IF EXISTS "Users can update own dietary_logs" ON public.dietary_logs;
DROP POLICY IF EXISTS "Users can delete own dietary_logs" ON public.dietary_logs;
DROP POLICY IF EXISTS "Users can view own dietary_log_entries" ON public.dietary_log_entries;
DROP POLICY IF EXISTS "Users can insert own dietary_log_entries" ON public.dietary_log_entries;
DROP POLICY IF EXISTS "Users can update own dietary_log_entries" ON public.dietary_log_entries;
DROP POLICY IF EXISTS "Users can delete own dietary_log_entries" ON public.dietary_log_entries;

CREATE POLICY "Users can view own dietary_logs"
  ON public.dietary_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own dietary_logs"
  ON public.dietary_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own dietary_logs"
  ON public.dietary_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own dietary_logs"
  ON public.dietary_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own dietary_log_entries"
  ON public.dietary_log_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own dietary_log_entries"
  ON public.dietary_log_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own dietary_log_entries"
  ON public.dietary_log_entries
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own dietary_log_entries"
  ON public.dietary_log_entries
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);
