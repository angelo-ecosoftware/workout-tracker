-- ============================================================================
-- 1. USER ROLES & ENUMS
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('athlete', 'coach', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE coach_specialty AS ENUM ('strength', 'nutrition', 'head_coach');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE link_status AS ENUM ('pending', 'accepted', 'declined', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE proposal_status AS ENUM ('proposed', 'applied', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'athlete',
  specialty coach_specialty DEFAULT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. COACH-ATHLETE MUTUAL RELATIONSHIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_athlete_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty coach_specialty NOT NULL DEFAULT 'strength',
  status link_status NOT NULL DEFAULT 'pending',
  invite_code TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_coach_athlete_pair UNIQUE (coach_id, athlete_id, specialty)
);

-- ============================================================================
-- 3. ATHLETE PRIVACY & SELECTIVE PEER SHARING
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public_profile BOOLEAN NOT NULL DEFAULT FALSE,
  share_workouts BOOLEAN NOT NULL DEFAULT TRUE,
  share_biometrics BOOLEAN NOT NULL DEFAULT FALSE,
  share_dietary BOOLEAN NOT NULL DEFAULT FALSE,
  share_photos BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_peer_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grantee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_workouts BOOLEAN NOT NULL DEFAULT TRUE,
  share_biometrics BOOLEAN NOT NULL DEFAULT FALSE,
  share_dietary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_peer_share UNIQUE (owner_id, grantee_id)
);

-- ============================================================================
-- 4. SAVED ROUTINES LIBRARY
-- ============================================================================
CREATE TABLE IF NOT EXISTS saved_routine_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  source_coach_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  program_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. ROUTINE PROPOSALS (COACH -> ATHLETE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS routine_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  program_payload JSONB NOT NULL,
  status proposal_status NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. COACH NUTRITION & MACRO TARGET PRESCRIPTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS coach_macro_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_kcal INTEGER NOT NULL,
  target_protein_g NUMERIC NOT NULL,
  target_carbs_g NUMERIC NOT NULL,
  target_fat_g NUMERIC NOT NULL,
  target_fiber_g NUMERIC DEFAULT NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. SET ANNOTATIONS & FORM CHECK VIDEOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS workout_set_coach_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL,
  session_id UUID NOT NULL,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_url TEXT,
  timestamp_marker TEXT,
  cue_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athlete_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_peer_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routine_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_macro_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_set_coach_feedback ENABLE ROW LEVEL SECURITY;

-- user_roles policies
CREATE POLICY "Users can read their own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- coach_athlete_links policies
CREATE POLICY "Athletes and coaches can view their links"
  ON coach_athlete_links FOR SELECT
  USING (auth.uid() = coach_id OR auth.uid() = athlete_id);

CREATE POLICY "Coaches can insert invitations"
  ON coach_athlete_links FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Athletes and coaches can update their links"
  ON coach_athlete_links FOR UPDATE
  USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

-- user_privacy_settings policies
CREATE POLICY "Users can manage their own privacy settings"
  ON user_privacy_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read public privacy settings"
  ON user_privacy_settings FOR SELECT
  USING (is_public_profile = TRUE);

-- user_peer_shares policies
CREATE POLICY "Users can manage their peer shares"
  ON user_peer_shares FOR ALL
  USING (auth.uid() = owner_id OR auth.uid() = grantee_id);

-- saved_routine_programs policies
CREATE POLICY "Users manage their own saved programs"
  ON saved_routine_programs FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Connected coaches can view athlete saved programs"
  ON saved_routine_programs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_athlete_links
      WHERE coach_id = auth.uid() AND athlete_id = saved_routine_programs.user_id AND status = 'accepted'
    )
  );

-- routine_proposals policies
CREATE POLICY "Coaches and athletes can view proposals"
  ON routine_proposals FOR SELECT
  USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Coaches can propose to accepted athletes"
  ON routine_proposals FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id AND
    EXISTS (
      SELECT 1 FROM coach_athlete_links
      WHERE coach_id = auth.uid() AND athlete_id = routine_proposals.athlete_id AND status = 'accepted'
    )
  );

CREATE POLICY "Athletes can update proposal status"
  ON routine_proposals FOR UPDATE
  USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

-- coach_macro_prescriptions policies
CREATE POLICY "Athletes and coaches view macro prescriptions"
  ON coach_macro_prescriptions FOR SELECT
  USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Nutrition coaches can prescribe macros to accepted athletes"
  ON coach_macro_prescriptions FOR ALL
  USING (
    auth.uid() = coach_id AND
    EXISTS (
      SELECT 1 FROM coach_athlete_links
      WHERE coach_id = auth.uid() AND athlete_id = coach_macro_prescriptions.athlete_id AND status = 'accepted'
    )
  );

-- workout_set_coach_feedback policies
CREATE POLICY "Athletes and coaches view feedback"
  ON workout_set_coach_feedback FOR SELECT
  USING (auth.uid() = athlete_id OR auth.uid() = coach_id);

CREATE POLICY "Coaches insert feedback for accepted athletes"
  ON workout_set_coach_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = coach_id AND
    EXISTS (
      SELECT 1 FROM coach_athlete_links
      WHERE coach_id = auth.uid() AND athlete_id = workout_set_coach_feedback.athlete_id AND status = 'accepted'
    )
  );
