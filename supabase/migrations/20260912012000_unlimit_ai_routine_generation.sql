ALTER TABLE public.ai_routine_generation_quotas
  DROP CONSTRAINT IF EXISTS ai_routine_generation_quotas_used_count_check;

ALTER TABLE public.ai_routine_generation_quotas
  ALTER COLUMN used_count TYPE integer;

DROP FUNCTION IF EXISTS public.reserve_ai_routine_generation(uuid, date);

CREATE OR REPLACE FUNCTION public.reserve_ai_routine_generation(
  p_user_id uuid,
  p_quota_date date
)
RETURNS TABLE (allowed boolean, used_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_used_count integer;
BEGIN
  INSERT INTO public.ai_routine_generation_quotas (user_id, quota_date, used_count)
  VALUES (p_user_id, p_quota_date, 1)
  ON CONFLICT (user_id, quota_date)
  DO UPDATE SET
    used_count = public.ai_routine_generation_quotas.used_count + 1,
    updated_at = now()
  RETURNING ai_routine_generation_quotas.used_count INTO v_used_count;

  RETURN QUERY SELECT true, v_used_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) TO service_role;
