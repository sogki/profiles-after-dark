-- Fix user profile creation trigger to handle duplicate usernames
-- This migration updates the create_user_profile function to generate unique usernames
-- when there's a conflict with existing usernames

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Create improved function that handles duplicate usernames
-- Uses SECURITY DEFINER to bypass RLS policies during signup
CREATE OR REPLACE FUNCTION create_user_profile()
  RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  username_exists BOOLEAN;
  counter INTEGER := 0;
  email_value TEXT;
BEGIN
  -- Get email value
  email_value := NEW.email;
  
  -- Generate base username from email or metadata
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(REGEXP_REPLACE(split_part(COALESCE(email_value, ''), '@', 1), '[^a-z0-9]', '', 'g'))
  );
  
  -- Ensure username is not empty
  IF base_username IS NULL OR base_username = '' OR LENGTH(base_username) = 0 THEN
    base_username := 'user' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
  END IF;
  
  -- Ensure username meets minimum length requirement (if any)
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 3);
  END IF;
  
  -- Check if username exists and generate unique one if needed
  final_username := base_username;
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE username = final_username) INTO username_exists;
    EXIT WHEN NOT username_exists;
    
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
    
    -- Safety check to prevent infinite loop
    IF counter > 1000 THEN
      final_username := 'user' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8) || counter::TEXT;
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert user profile with error handling
  -- Try with email first, fallback to without email if column doesn't exist
  BEGIN
    -- Check if email column exists by attempting to insert with it
    INSERT INTO public.user_profiles (user_id, username, display_name, email)
    VALUES (
      NEW.id,
      final_username,
      COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
      email_value
    )
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN undefined_column THEN
      -- Email column doesn't exist, insert without it
      BEGIN
        INSERT INTO public.user_profiles (user_id, username, display_name)
        VALUES (
          NEW.id,
          final_username,
          COALESCE(NEW.raw_user_meta_data->>'display_name', final_username)
        )
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION
        WHEN OTHERS THEN
          -- If this also fails, just log and continue
          RAISE NOTICE 'Failed to create user profile: %', SQLERRM;
      END;
    WHEN unique_violation THEN
      -- Username conflict - try with a different username
      BEGIN
        final_username := final_username || '_' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 4);
        INSERT INTO public.user_profiles (user_id, username, display_name)
        VALUES (
          NEW.id,
          final_username,
          COALESCE(NEW.raw_user_meta_data->>'display_name', final_username)
        )
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Failed to create user profile with fallback username: %', SQLERRM;
      END;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    -- Use RAISE NOTICE instead of WARNING to avoid breaking the transaction
    RAISE NOTICE 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate the trigger
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Add policies to allow the trigger function to insert user profiles
-- SECURITY DEFINER functions in Supabase run as authenticator role
-- We need to allow both authenticator and service_role to insert
DROP POLICY IF EXISTS "Allow trigger to create user profiles" ON public.user_profiles;
CREATE POLICY "Allow trigger to create user profiles" ON public.user_profiles
  FOR INSERT
  TO authenticator
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role to create user profiles" ON public.user_profiles;
CREATE POLICY "Allow service role to create user profiles" ON public.user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also ensure authenticated users can still create their own profiles
-- (This should already exist, but we'll make sure it's there)
DROP POLICY IF EXISTS "Users can create their own profile" ON public.user_profiles;
CREATE POLICY "Users can create their own profile" ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

