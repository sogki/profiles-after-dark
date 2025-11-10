-- Add moderation fields to user_profiles table
-- This migration adds fields for account suspensions, read-only mode, and account deletion

-- Add suspended_until column for temporary suspensions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'suspended_until'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN suspended_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add read_only_mode column for read-only restrictions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'read_only_mode'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN read_only_mode BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add read_only_until column for temporary read-only mode
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'read_only_until'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN read_only_until TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add deleted_at column for account deletion tracking
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Create index on suspended_until for efficient queries
CREATE INDEX IF NOT EXISTS user_profiles_suspended_until_idx 
ON public.user_profiles(suspended_until) 
WHERE suspended_until IS NOT NULL;

-- Create index on read_only_mode for efficient queries
CREATE INDEX IF NOT EXISTS user_profiles_read_only_mode_idx 
ON public.user_profiles(read_only_mode) 
WHERE read_only_mode = TRUE;

-- Create index on deleted_at for efficient queries
CREATE INDEX IF NOT EXISTS user_profiles_deleted_at_idx 
ON public.user_profiles(deleted_at) 
WHERE deleted_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.suspended_until IS 'Timestamp when user suspension expires. NULL if not suspended.';
COMMENT ON COLUMN public.user_profiles.read_only_mode IS 'Whether user is in read-only mode (can only view, cannot interact or upload).';
COMMENT ON COLUMN public.user_profiles.read_only_until IS 'Timestamp when read-only mode expires. NULL if permanent.';
COMMENT ON COLUMN public.user_profiles.deleted_at IS 'Timestamp when account was deleted. NULL if not deleted.';
COMMENT ON COLUMN public.user_profiles.is_active IS 'Whether the user account is active.';

