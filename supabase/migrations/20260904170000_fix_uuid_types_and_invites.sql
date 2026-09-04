-- ============================================================================
-- FIX: SET_ID AND SESSION_ID TYPES IN FEEDBACK & CLEANUP COACH INVITE CONSTRAINTS
-- ============================================================================

-- 1. Alter workout_set_coach_feedback columns to text to support all set and session ID formats
ALTER TABLE workout_set_coach_feedback ALTER COLUMN set_id TYPE TEXT;
ALTER TABLE workout_set_coach_feedback ALTER COLUMN session_id TYPE TEXT;

-- 2. Ensure coach_athlete_links allow null athlete_id on pending invitations
ALTER TABLE coach_athlete_links ALTER COLUMN athlete_id DROP NOT NULL;

-- 3. Ensure invite_code lookup is indexed for instant sub-millisecond retrieval
CREATE INDEX IF NOT EXISTS idx_coach_athlete_links_invite_code 
  ON coach_athlete_links (invite_code) 
  WHERE status = 'pending';
