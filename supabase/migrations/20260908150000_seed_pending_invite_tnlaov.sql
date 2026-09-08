-- Migration: Seed pending invite_TNLAOV for coach Angelo Ghafoerkhan
-- Recovers the unpersisted invite code that was generated while the UUID type bug was present

INSERT INTO public.coach_athlete_links (
  coach_id,
  specialty,
  status,
  invite_code,
  coach_name
) VALUES (
  '2b4bd23c-ceff-460d-a73b-2c531686e3b2',
  'strength',
  'pending',
  'invite_TNLAOV',
  'Angelo Ghafoerkhan'
)
ON CONFLICT (invite_code) DO NOTHING;
