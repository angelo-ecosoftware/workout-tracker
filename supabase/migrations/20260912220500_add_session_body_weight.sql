ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS body_weight_kg numeric;
