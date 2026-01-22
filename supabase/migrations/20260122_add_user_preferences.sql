-- ============================================================================
-- Add User Preferences to Profiles Table
-- ============================================================================
-- This migration adds notification and privacy preference fields to the
-- profiles table to store user settings persistently.
--
-- Migration Date: 2026-01-22
-- ============================================================================

-- Add notification preference columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_messages BOOLEAN DEFAULT FALSE;

-- Add privacy preference columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_contact_info BOOLEAN DEFAULT TRUE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'User preferences columns added to profiles table successfully';
END $$;
