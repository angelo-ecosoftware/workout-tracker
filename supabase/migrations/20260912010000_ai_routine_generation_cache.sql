CREATE TABLE IF NOT EXISTS public.ai_routine_generation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_hash text NOT NULL,
  profile_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  program_data jsonb NOT NULL,
  model text NOT NULL,
  prompt_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, request_hash)
);

CREATE INDEX IF NOT EXISTS idx_ai_routine_generation_cache_user
  ON public.ai_routine_generation_cache (user_id, created_at DESC);

ALTER TABLE public.ai_routine_generation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_routine_generation_cache FORCE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their AI routine cache"
  ON public.ai_routine_generation_cache
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.ai_routine_generation_quotas (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quota_date date NOT NULL,
  used_count smallint NOT NULL DEFAULT 0 CHECK (used_count BETWEEN 0 AND 3),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quota_date)
);

ALTER TABLE public.ai_routine_generation_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_routine_generation_quotas FORCE ROW LEVEL SECURITY;

CREATE POLICY "Owners can read their AI routine quota"
  ON public.ai_routine_generation_quotas
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.reserve_ai_routine_generation(
  p_user_id uuid,
  p_quota_date date
)
RETURNS TABLE (allowed boolean, used_count smallint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_used_count smallint;
BEGIN
  INSERT INTO public.ai_routine_generation_quotas (user_id, quota_date, used_count)
  VALUES (p_user_id, p_quota_date, 1)
  ON CONFLICT (user_id, quota_date)
  DO UPDATE SET
    used_count = public.ai_routine_generation_quotas.used_count + 1,
    updated_at = now()
  WHERE public.ai_routine_generation_quotas.used_count < 3
  RETURNING ai_routine_generation_quotas.used_count INTO v_used_count;

  IF v_used_count IS NULL THEN
    SELECT q.used_count
    INTO v_used_count
    FROM public.ai_routine_generation_quotas q
    WHERE q.user_id = p_user_id
      AND q.quota_date = p_quota_date;
    RETURN QUERY SELECT false, COALESCE(v_used_count, 0::smallint);
  ELSE
    RETURN QUERY SELECT true, v_used_count;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_ai_routine_generation(uuid, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) TO service_role;
