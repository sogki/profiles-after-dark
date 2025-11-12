-- Add profile visibility column to user_profiles table
-- This migration adds profile_visibility column for controlling who can view user profiles

-- Add profile_visibility column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'profile_visibility'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends', 'private'));
  END IF;
END $$;

-- Create index on profile_visibility for efficient queries
CREATE INDEX IF NOT EXISTS user_profiles_profile_visibility_idx 
ON public.user_profiles(profile_visibility) 
WHERE profile_visibility IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_profiles.profile_visibility IS 'Profile visibility setting: public (anyone can view), friends (only mutual follows can view), or private (only owner can view).';

