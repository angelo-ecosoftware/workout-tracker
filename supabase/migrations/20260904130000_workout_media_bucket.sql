-- ============================================================================
-- WORKOUT MEDIA STORAGE BUCKET & RLS POLICIES
-- ============================================================================

-- 1. Create dedicated 'workout-media' bucket with strict 5MB limit and WebP/JPEG/PNG mime validation
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workout-media',
  'workout-media',
  true,
  5242880, -- 5 MB max per file
  ARRAY['image/webp', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/webp', 'image/jpeg', 'image/png']::text[];

-- 2. Allow public read access to workout progress photos
DO $$ BEGIN
  CREATE POLICY "Allow public read access to workout-media"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'workout-media');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Allow authenticated athletes to upload photos to their own user folder
DO $$ BEGIN
  CREATE POLICY "Allow athletes to upload photos to own folder in workout-media"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'workout-media' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Allow authenticated athletes to delete their own workout photos
DO $$ BEGIN
  CREATE POLICY "Allow athletes to delete own photos in workout-media"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'workout-media' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
