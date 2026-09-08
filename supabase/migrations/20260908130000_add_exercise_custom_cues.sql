-- Migration: Add custom_cues JSONB column to public.exercises
-- Enables athletes and coaches to define motion phases & biomechanical cues that sync across devices
-- Structure: { setup?: string, peak?: string, cues?: string[] }

ALTER TABLE IF EXISTS public.exercises
ADD COLUMN IF NOT EXISTS custom_cues JSONB DEFAULT NULL;
