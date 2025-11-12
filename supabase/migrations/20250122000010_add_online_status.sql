-- Add online status tracking to user_profiles table
-- This migration adds last_activity column for tracking user online status

-- Add last_activity column if it doesn't exist
-- Note: We don't set a default so existing users get NULL and won't appear online until they're actually active
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'last_activity'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add show_online_status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'show_online_status'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN show_online_status BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Create index on last_activity for efficient queries
CREATE INDEX IF NOT EXISTS user_profiles_last_activity_idx 
ON public.user_profiles(last_activity DESC) 
WHERE last_activity IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.last_activity IS 'Timestamp of user last activity. Used to determine online status.';
COMMENT ON COLUMN public.user_profiles.show_online_status IS 'Whether user wants to show their online status to others.';

