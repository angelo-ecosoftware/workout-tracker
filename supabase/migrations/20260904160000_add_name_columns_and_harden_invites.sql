-- ============================================================================
-- ADD MISSING NAME & METADATA COLUMNS TO COACH & PEER TABLES
-- ============================================================================

-- 1. coach_athlete_links: Add coach and athlete names and emails
ALTER TABLE coach_athlete_links ADD COLUMN IF NOT EXISTS coach_name TEXT;
ALTER TABLE coach_athlete_links ADD COLUMN IF NOT EXISTS coach_email TEXT;
ALTER TABLE coach_athlete_links ADD COLUMN IF NOT EXISTS athlete_name TEXT;
ALTER TABLE coach_athlete_links ADD COLUMN IF NOT EXISTS athlete_email TEXT;

-- 2. user_peer_shares: Add grantee name and email
ALTER TABLE user_peer_shares ADD COLUMN IF NOT EXISTS grantee_name TEXT;
ALTER TABLE user_peer_shares ADD COLUMN IF NOT EXISTS grantee_email TEXT;

-- 3. saved_routine_programs: Add source coach name
ALTER TABLE saved_routine_programs ADD COLUMN IF NOT EXISTS source_coach_name TEXT;

-- 4. routine_proposals: Add coach name
ALTER TABLE routine_proposals ADD COLUMN IF NOT EXISTS coach_name TEXT;

-- 5. coach_macro_prescriptions: Add coach name
ALTER TABLE coach_macro_prescriptions ADD COLUMN IF NOT EXISTS coach_name TEXT;

-- 6. workout_set_coach_feedback: Add coach name
ALTER TABLE workout_set_coach_feedback ADD COLUMN IF NOT EXISTS coach_name TEXT;

-- ============================================================================
-- HARDEN RLS POLICIES FOR INVITATION CLAIMING
-- ============================================================================

DROP POLICY IF EXISTS "Athletes and coaches can view their links" ON coach_athlete_links;
DROP POLICY IF EXISTS "Coaches can insert invitations" ON coach_athlete_links;
DROP POLICY IF EXISTS "Athletes and coaches can update their links" ON coach_athlete_links;

-- Allow authenticated users to view links they belong to OR pending invitation links
CREATE POLICY "Athletes and coaches can view their links"
  ON coach_athlete_links FOR SELECT
  TO authenticated
  USING (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id OR 
    (status = 'pending' AND invite_code IS NOT NULL)
  );

-- Allow authenticated users to insert invitations
CREATE POLICY "Coaches can insert invitations"
  ON coach_athlete_links FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

-- Allow authenticated users to accept/update invitations
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
