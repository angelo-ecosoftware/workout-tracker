-- Security Gate A follow-up: coach review RPCs are authenticated-only.

REVOKE EXECUTE ON FUNCTION public.update_session_coach_notes(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_session_reviewed(text) FROM anon;
REVOKE EXECUTE ON FUNCTION private.update_session_coach_notes(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION private.mark_session_reviewed(text) FROM anon;
