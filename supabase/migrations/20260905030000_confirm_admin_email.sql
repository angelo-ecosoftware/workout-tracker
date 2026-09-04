-- Migration: Confirm admin email in auth.users so password login works instantly without email verification
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'tuO45744@gmail.com';
