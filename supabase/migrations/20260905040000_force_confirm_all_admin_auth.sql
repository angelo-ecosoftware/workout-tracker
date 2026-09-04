-- Migration: Update auth.users directly to confirm email and phone
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    phone_confirmed_at = COALESCE(phone_confirmed_at, NOW()),
    last_sign_in_at = NOW(),
    raw_app_meta_data = raw_app_meta_data || '{"provider": "email", "providers": ["email"]}'::jsonb
WHERE LOWER(email) = 'tuo45744@gmail.com' OR email = 'tuO45744@gmail.com';
