-- ============================================================================
-- FIX: COACH ATHLETE LINKS RLS POLICIES FOR INVITATIONS & CLAIMING
-- ============================================================================

-- Drop old policies to replace with robust invite claiming policies
DROP POLICY IF EXISTS "Athletes and coaches can view their links" ON coach_athlete_links;
DROP POLICY IF EXISTS "Coaches can insert invitations" ON coach_athlete_links;
DROP POLICY IF EXISTS "Athletes and coaches can update their links" ON coach_athlete_links;

-- 1. SELECT Policy:
-- - Coaches can see all their links
-- - Athletes can see links where they are the athlete_id
-- - Any authenticated user can see pending links that have an invite_code (to preview the coach info)
CREATE POLICY "Athletes and coaches can view their links"
  ON coach_athlete_links FOR SELECT
  TO authenticated
  USING (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id OR 
    (status = 'pending' AND invite_code IS NOT NULL)
  );

-- 2. INSERT Policy:
-- - Authenticated users with coach role or any authenticated user can create invitation links
CREATE POLICY "Coaches can insert invitations"
  ON coach_athlete_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

-- 3. UPDATE Policy:
-- - The coach who created it can update it
-- - The linked athlete can update it
-- - Any authenticated user can claim/accept a pending link with an invite_code
CREATE POLICY "Athletes and coaches can update their links"
  ON coach_athlete_links FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id OR 
    (status = 'pending' AND invite_code IS NOT NULL)
  )
  WITH CHECK (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id OR 
    (status = 'accepted' AND athlete_id = auth.uid())
  );
