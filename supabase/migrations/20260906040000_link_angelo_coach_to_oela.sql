-- Migration: Link Angelo Ghafoerkhan as Coach of Oela Dexter
-- Angelo Ghafoerkhan UUID: 2b4bd23c-ceff-460d-a73b-2c531686e3b2
-- Oela Dexter UUID:        e38a245e-008c-4ea1-ac90-52b337000eb2

-- 1. Ensure Angelo is an approved Coach with 'head_coach' specialty
INSERT INTO public.user_roles (user_id, role, specialty, is_approved, created_at, updated_at)
VALUES ('2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'coach', 'head_coach', true, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  role = 'coach',
  specialty = 'head_coach',
  is_approved = true,
  updated_at = NOW();

-- 2. Ensure Oela is an approved Athlete
INSERT INTO public.user_roles (user_id, role, specialty, is_approved, created_at, updated_at)
VALUES ('e38a245e-008c-4ea1-ac90-52b337000eb2', 'athlete', null, true, NOW(), NOW())
ON CONFLICT (user_id) DO UPDATE SET
  role = 'athlete',
  is_approved = true,
  updated_at = NOW();

-- 3. Upsert user names and emails in users table
INSERT INTO public.users (user_id, email, name, updated_at)
VALUES ('2b4bd23c-ceff-460d-a73b-2c531686e3b2', 'angeloleeuw@gmail.com', 'Angelo Ghafoerkhan', NOW())
ON CONFLICT (user_id) DO UPDATE SET
  name = 'Angelo Ghafoerkhan',
  updated_at = NOW();

INSERT INTO public.users (user_id, email, name, updated_at)
VALUES ('e38a245e-008c-4ea1-ac90-52b337000eb2', 'dexteroela@gmail.com', 'Oela Dexter', NOW())
ON CONFLICT (user_id) DO UPDATE SET
  name = 'Oela Dexter',
  updated_at = NOW();

-- 4. Establish accepted coach-athlete link between Angelo (coach) and Oela (athlete)
INSERT INTO public.coach_athlete_links (
  id,
  coach_id,
  athlete_id,
  specialty,
  invite_code,
  status,
  coach_name,
  athlete_name,
  athlete_email,
  created_at,
  updated_at
)
VALUES (
  'e1a2b3c4-d5e6-47f8-9a0b-1c2d3e4f5a6b',
  '2b4bd23c-ceff-460d-a73b-2c531686e3b2',
  'e38a245e-008c-4ea1-ac90-52b337000eb2',
  'strength',
  'invite_ANGELO_OELA',
  'accepted',
  'Angelo Ghafoerkhan',
  'Oela Dexter',
  'dexteroela@gmail.com',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  coach_id = '2b4bd23c-ceff-460d-a73b-2c531686e3b2',
  athlete_id = 'e38a245e-008c-4ea1-ac90-52b337000eb2',
  status = 'accepted',
  coach_name = 'Angelo Ghafoerkhan',
  athlete_name = 'Oela Dexter',
  athlete_email = 'dexteroela@gmail.com',
  updated_at = NOW();
