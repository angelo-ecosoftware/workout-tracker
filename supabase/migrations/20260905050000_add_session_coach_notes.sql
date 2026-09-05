-- Migration: Add coach_notes and coach_name columns to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS coach_notes TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS coach_name TEXT DEFAULT NULL;

-- Allow coaches and users to update coach_notes in sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Coaches and athletes can update session coach notes'
  ) THEN
    CREATE POLICY "Coaches and athletes can update session coach notes"
      ON sessions
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
