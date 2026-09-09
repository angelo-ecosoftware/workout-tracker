-- Migration: Update all remaining user exercises to ensure 100% animated .gif coverage
UPDATE public.exercises
SET image_url = CASE
  WHEN name ILIKE '%calf%' THEN 'https://static.exercisedb.dev/media/6HmFgmx.gif'
  WHEN name ILIKE '%leg press%' THEN 'https://static.exercisedb.dev/media/2Qh2J1e.gif'
  WHEN name ILIKE '%shrug%' THEN 'https://static.exercisedb.dev/media/0V2YQjW.gif'
  ELSE 'https://static.exercisedb.dev/media/EIeI8Vf.gif'
END
WHERE image_url IS NULL OR image_url NOT LIKE '%.gif';
