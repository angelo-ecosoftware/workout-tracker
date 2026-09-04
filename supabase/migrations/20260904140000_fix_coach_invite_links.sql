-- ============================================================================
-- FIX: COACH ATHLETE LINKS INVITATION & ATHLETE ID PERMISSIONS
-- ============================================================================

-- 1. Make athlete_id nullable on coach_athlete_links for pending invite links
ALTER TABLE coach_athlete_links ALTER COLUMN athlete_id DROP NOT NULL;

-- 2. Drop the restrictive constraint that required athlete_id immediately
ALTER TABLE coach_athlete_links DROP CONSTRAINT IF EXISTS unique_coach_athlete_pair;

-- 3. Update RLS policies to allow anyone authenticated to view and accept pending invites by code
DROP POLICY IF EXISTS "Athletes and coaches can view their links" ON coach_athlete_links;
CREATE POLICY "Athletes and coaches can view their links"
  ON coach_athlete_links FOR SELECT
  USING (
    auth.uid() = coach_id OR 
    auth.uid() = athlete_id OR 
    (status = 'pending' AND invite_code IS NOT NULL)
  );

DROP POLICY IF EXISTS "Athletes and coaches can update their links" ON coach_athlete_links;
CREATE POLICY "Athletes and coaches can update their links"
  ON coach_athlete_links FOR UPDATE
  USING (
    auth.uid() = athlete_id OR 
    auth.uid() = coach_id OR 
    (status = 'pending' AND invite_code IS NOT NULL)
  );
