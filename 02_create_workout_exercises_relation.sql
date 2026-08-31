-- ==============================================================================
-- STEP 2 MIGRATION: Many-to-Many Workout Exercises Junction Table
-- Safe & Non-Destructive: Preserves all existing data & backward compatibility
-- ==============================================================================

-- 1. Create workout_exercises junction table if it does not exist
CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    order_in_workout INTEGER NOT NULL DEFAULT 1,
    target_sets INTEGER NOT NULL DEFAULT 3,
    target_rep_min INTEGER DEFAULT 8,
    target_rep_max INTEGER DEFAULT 12,
    target_duration_seconds INTEGER DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT workout_exercises_unique_pair UNIQUE (workout_id, exercise_id)
);

-- 2. Add foreign keys safely if tables match
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workouts') THEN
        ALTER TABLE public.workout_exercises 
            ADD CONSTRAINT fk_workout_exercises_workout 
            FOREIGN KEY (workout_id) REFERENCES public.workouts(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping workout FK constraint or already exists';
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercises') THEN
        ALTER TABLE public.workout_exercises 
            ADD CONSTRAINT fk_workout_exercises_exercise 
            FOREIGN KEY (exercise_id) REFERENCES public.exercises(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Skipping exercise FK constraint or already exists';
END $$;

-- 3. Populate workout_exercises from existing workouts.exercise_ids array safely
-- Unnests exercise_ids and joins with exercises to copy target sets/reps
DO $$ 
BEGIN
    INSERT INTO public.workout_exercises (
        workout_id, 
        exercise_id, 
        order_in_workout, 
        target_sets, 
        target_rep_min, 
        target_rep_max
    )
    SELECT 
        w.id AS workout_id,
        unnested.exercise_id,
        unnested.ordinality AS order_in_workout,
        COALESCE(e.target_sets, 3) AS target_sets,
        COALESCE(e.target_rep_min, 8) AS target_rep_min,
        COALESCE(e.target_rep_max, 12) AS target_rep_max
    FROM public.workouts w
    CROSS JOIN LATERAL unnest(w.exercise_ids) WITH ORDINALITY AS unnested(exercise_id, ordinality)
    LEFT JOIN public.exercises e ON e.id = unnested.exercise_id
    ON CONFLICT (workout_id, exercise_id) 
    DO UPDATE SET 
        order_in_workout = EXCLUDED.order_in_workout,
        target_sets = EXCLUDED.target_sets,
        target_rep_min = EXCLUDED.target_rep_min,
        target_rep_max = EXCLUDED.target_rep_max;
EXCEPTION WHEN OTHERS THEN 
    RAISE NOTICE 'Auto-population encountered an issue or workouts table has no exercise_ids column';
END $$;

-- 4. Enable RLS and permissive policy for workout_exercises
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all users full access to workout_exercises" ON public.workout_exercises;
CREATE POLICY "Allow all users full access to workout_exercises"
    ON public.workout_exercises
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 5. Indexes for high performance querying
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_exercise_id ON public.workout_exercises(exercise_id);
