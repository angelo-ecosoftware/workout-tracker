-- Backfill explicit columns on existing users table from the JSONB 'metrics' column
UPDATE public.users
SET
  date_of_birth = CASE 
    WHEN (metrics->>'dateOfBirth') ~ '^\d{4}-\d{2}-\d{2}$' THEN (metrics->>'dateOfBirth')::DATE 
    ELSE date_of_birth 
  END,
  gender = COALESCE(metrics->>'gender', gender),
  height_cm = CASE 
    WHEN (metrics->>'height') ~ '^[0-9]+(\.[0-9]+)?$' THEN (metrics->>'height')::NUMERIC(5,2) 
    ELSE height_cm 
  END,
  weight_kg = CASE 
    WHEN (metrics->>'weight') ~ '^[0-9]+(\.[0-9]+)?$' THEN (metrics->>'weight')::NUMERIC(5,2) 
    ELSE weight_kg 
  END,
  fitness_level = COALESCE(metrics->>'fitnessLevel', fitness_level),
  training_location = COALESCE(metrics->>'trainingLocation', training_location),
  updated_at = NOW()
WHERE metrics IS NOT NULL;
