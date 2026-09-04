-- Migration: Seed Platform Admin Role and Grant RLS Permissions
-- Ensure Admin Role for tuO45744@gmail.com (UUID: a9b8fc3c-552e-49e8-812e-4bc523511762)

-- 1. Insert admin role directly via migration (bypasses RLS)
INSERT INTO user_roles (user_id, role, specialty, is_approved)
VALUES ('a9b8fc3c-552e-49e8-812e-4bc523511762', 'admin', null, true)
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin',
  specialty = null,
  is_approved = true,
  updated_at = NOW();

-- 2. Allow Admins to modify user_roles table
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = user_uuid AND role = 'admin' AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin update policy for user_roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can update all user roles'
  ) THEN
    CREATE POLICY "Admins can update all user roles"
      ON user_roles
      FOR ALL
      TO authenticated
      USING (
        auth.uid() = user_id OR is_admin(auth.uid())
      )
      WITH CHECK (
        auth.uid() = user_id OR is_admin(auth.uid())
      );
  END IF;
END $$;

-- Add admin update policy for missing_product_reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'missing_product_reports' AND policyname = 'Admins can update missing product reports'
  ) THEN
    CREATE POLICY "Admins can update missing product reports"
      ON missing_product_reports
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
