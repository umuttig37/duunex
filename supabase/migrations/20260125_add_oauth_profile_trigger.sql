-- ============================================================================
-- Add Trigger for Auto-Creating Profile on OAuth Sign Up
-- ============================================================================
-- Created: 2026-01-21
-- Purpose: Automatically create a profile when a user signs up via OAuth (Google, etc.)

-- ============================================================================
-- FUNCTION: Handle new user from OAuth
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't exist yet
  -- This handles OAuth signups where profile isn't created by the signup form
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    avatar_url,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'given_name',
      SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'family_name',
      NULLIF(SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 2), ''),
      ''
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Update fields that might be missing from manual signup
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    first_name = COALESCE(NULLIF(profiles.first_name, ''), EXCLUDED.first_name),
    last_name = COALESCE(NULLIF(profiles.last_name, ''), EXCLUDED.last_name),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: On auth.users insert
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger that fires after a new user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_oauth_user();

