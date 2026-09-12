REVOKE EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_routine_generation(uuid, date) TO service_role;
