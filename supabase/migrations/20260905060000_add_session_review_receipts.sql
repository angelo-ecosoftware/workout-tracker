-- Migration: Add reviewed_at, reviewed_by_coach_id, reviewed_by_coach_name columns to sessions
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reviewed_by_coach_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reviewed_by_coach_name TEXT DEFAULT NULL;

-- Ensure RLS allows updating review status by authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Allow coaches to update review status'
  ) THEN
    CREATE POLICY "Allow coaches to update review status"
      ON sessions
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
