-- Migration: Create missing product reports table for developer / catalog indexing
CREATE TABLE IF NOT EXISTS missing_product_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode TEXT,
  name TEXT,
  brand TEXT,
  store TEXT,
  notes TEXT,
  user_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row-Level Security
ALTER TABLE missing_product_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or anon) to submit missing product reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'missing_product_reports' AND policyname = 'Allow public inserts for missing product reports'
  ) THEN
    CREATE POLICY "Allow public inserts for missing product reports"
      ON missing_product_reports
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated users to view missing product reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'missing_product_reports' AND policyname = 'Allow authenticated read for missing product reports'
  ) THEN
    CREATE POLICY "Allow authenticated read for missing product reports"
      ON missing_product_reports
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
