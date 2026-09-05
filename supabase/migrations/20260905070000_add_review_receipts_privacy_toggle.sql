-- Migration: Add share_review_receipts toggle to user_privacy_settings
ALTER TABLE user_privacy_settings
ADD COLUMN IF NOT EXISTS share_review_receipts BOOLEAN NOT NULL DEFAULT TRUE;
