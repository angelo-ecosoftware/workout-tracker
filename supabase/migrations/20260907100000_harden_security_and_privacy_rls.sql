-- ==============================================================================
-- MIGRATION: Harden Security (ASVS V4 Access Control) and Privacy (GDPR Art. 9/25)
-- Fixes:
-- 1. [SEC-01] Prevents vertical privilege escalation on user_roles.
--    Regular users can view/manage basic non-privileged fields, but cannot elevate
--    themselves to 'admin' or set 'is_approved = true'. Only admins can perform approvals.
-- 2. [PRV-01] Eliminates unauthenticated public exposure of special category health
--    data on body_logs (bodyweight, BMI, body fat %). Restricts read access to
--    owning athletes and their authorized coaches.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HARDEN user_roles (Access Control & Privilege Escalation Defense)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated to read user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.user_roles;

-- Ensure is_admin helper function exists with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uuid AND role = 'admin' AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SELECT: Authenticated users can read their own role or admins can read any role
CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR public.is_admin(auth.uid())
  );

-- INSERT: Self-service registration/requests allowed ONLY as athlete or unapproved coach
CREATE POLICY "Users can insert own profile without elevation"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    AND (role IN ('athlete', 'coach'))
    AND (is_approved = false OR is_approved IS NULL)
  );

-- UPDATE: Self-service update allowed ONLY for role request (cannot self-promote to admin or approve self)
CREATE POLICY "Users can update own profile without elevation"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id 
    AND (role IN ('athlete', 'coach'))
    AND (is_approved = false OR is_approved IS NULL)
  );

-- ADMIN: Platform administrators can manage any role without restrictions
CREATE POLICY "Admins can manage all user roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    public.is_admin(auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 2. HARDEN body_logs (Special Category Health Data Protection)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.body_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.body_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can manage their own body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can view own body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can insert own body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can update own body logs" ON public.body_logs;
DROP POLICY IF EXISTS "Users can delete own body logs" ON public.body_logs;

-- SELECT: Only the owner or active linked coaches with biometric sharing consent
CREATE POLICY "Users and authorized coaches can view body logs"
  ON public.body_logs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid()::text = user_id::text
    OR EXISTS (
      SELECT 1 FROM public.coach_athlete_links cal
      JOIN public.user_privacy_settings ups ON ups.user_id::text = body_logs.user_id::text
      WHERE cal.athlete_id::text = body_logs.user_id::text
        AND cal.coach_id = auth.uid()
        AND cal.status = 'accepted'
        AND ups.share_biometrics = true
    )
  );

-- INSERT: Only owner can insert their body logs
CREATE POLICY "Users can insert own body logs"
  ON public.body_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id::text);

-- UPDATE: Only owner can update their body logs
CREATE POLICY "Users can update own body logs"
  ON public.body_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- DELETE: Only owner can delete their body logs
CREATE POLICY "Users can delete own body logs"
  ON public.body_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id::text);
