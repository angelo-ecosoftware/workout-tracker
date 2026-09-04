-- ============================================================================
-- FIX: RESOLVE RLS INFINITE RECURSION ON user_roles & HARDEN coach_athlete_links
-- ============================================================================

-- 1. Fix user_roles policies (drop recursive policy)
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can manage their own role" ON user_roles;

-- Clean non-recursive policy: users manage their own role row directly
CREATE POLICY "Users can manage their own role"
  ON user_roles FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Public/anon read policy for initial role checking if needed
CREATE POLICY "Allow authenticated to read user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- 2. Fix coach_athlete_links RLS policies completely
DROP POLICY IF EXISTS "Athletes and coaches can view their links" ON coach_athlete_links;
DROP POLICY IF EXISTS "Coaches can insert invitations" ON coach_athlete_links;
DROP POLICY IF EXISTS "Athletes and coaches can update their links" ON coach_athlete_links;
DROP POLICY IF EXISTS "Athletes and coaches can delete their links" ON coach_athlete_links;

CREATE POLICY "Athletes and coaches can view their links"
  ON coach_athlete_links FOR SELECT
  TO authenticated
  USING (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id OR 
    (status = 'pending' AND invite_code IS NOT NULL)
  );

CREATE POLICY "Coaches can insert invitations"
  ON coach_athlete_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Athletes and coaches can update their links"
  ON coach_athlete_links FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id OR 
    (status = 'pending' AND invite_code IS NOT NULL)
  )
  WITH CHECK (true);

CREATE POLICY "Athletes and coaches can delete their links"
  ON coach_athlete_links FOR DELETE
  TO authenticated
  USING (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id
  );

-- ============================================================================
-- 3. ENSURE COACH USER (078b01df-a405-4ab0-99c1-7a315c76f935) IS APPROVED COACH IN DB
-- ============================================================================
INSERT INTO user_roles (user_id, role, specialty, is_approved)
VALUES ('078b01df-a405-4ab0-99c1-7a315c76f935', 'coach', 'strength', true)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'coach',
  specialty = 'strength',
  is_approved = true;

-- Ensure athlete role row
INSERT INTO user_roles (user_id, role, specialty, is_approved)
VALUES ('2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'athlete', null, true)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'athlete',
  is_approved = true;
