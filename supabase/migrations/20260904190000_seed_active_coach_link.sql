-- ============================================================================
-- DIRECT CONNECTION ESTABLISHMENT BETWEEN COACH AND ATHLETE
-- ============================================================================

-- Ensure coach role for Alpha Extreme (078b01df-a405-4ab0-99c1-7a315c76f935)
INSERT INTO user_roles (user_id, role, specialty, is_approved)
VALUES ('078b01df-a405-4ab0-99c1-7a315c76f935', 'coach', 'strength', true)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'coach',
  specialty = 'strength',
  is_approved = true;

-- Ensure athlete role for Angelo Ghafoerkhan (2b4bd23c-ceff-460d-a73b-2c531686e3b2)
INSERT INTO user_roles (user_id, role, specialty, is_approved)
VALUES ('2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'athlete', null, true)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'athlete',
  is_approved = true;

-- Create an active connection between Coach Alpha Extreme and Athlete Angelo Ghafoerkhan
INSERT INTO coach_athlete_links (
  coach_id,
  athlete_id,
  specialty,
  status,
  invite_code,
  coach_name,
  coach_email,
  athlete_name,
  athlete_email
)
VALUES (
  '078b01df-a405-4ab0-99c1-7a315c76f935',
  '2b4bd23c-ceff-460d-a73b-2c531686e3b2',
  'strength',
  'accepted',
  'invite_ESTABLISHED',
  'Alpha Extreme',
  'extremealpha16@gmail.com',
  'angelo ghafoerkhan',
  'angeloleeuw@gmail.com'
)
ON CONFLICT DO NOTHING;

-- Also allow public/anon read policy on coach_athlete_links and user_roles for seamless frontend hydration
CREATE POLICY "Allow anon read user roles"
  ON user_roles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon read coach links"
  ON coach_athlete_links FOR SELECT
  TO anon
  USING (true);
