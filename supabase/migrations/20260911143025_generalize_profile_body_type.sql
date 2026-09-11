ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS body_type text;

UPDATE public.users
SET body_type = NULLIF(metrics ->> 'somatotype', '')
WHERE body_type IS NULL
  AND jsonb_typeof(metrics) = 'object'
  AND metrics ? 'somatotype';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_body_type_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_body_type_check
  CHECK (body_type IS NULL OR body_type IN ('ectomorph', 'mesomorph', 'endomorph', 'not_specified'));
