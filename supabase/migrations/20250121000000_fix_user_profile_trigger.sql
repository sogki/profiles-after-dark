-- Fix user profile creation trigger to handle duplicate usernames
-- This migration updates the create_user_profile function to generate unique usernames
-- when there's a conflict with existing usernames

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Create improved function that handles duplicate usernames
CREATE OR REPLACE FUNCTION create_user_profile()
  RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  username_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Generate base username from email or metadata
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'))
  );
  
  -- Ensure username is not empty
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user' || SUBSTRING(NEW.id::TEXT, 1, 8);
  END IF;
  
  -- Check if username exists and generate unique one if needed
  final_username := base_username;
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE username = final_username) INTO username_exists;
    EXIT WHEN NOT username_exists;
    
    counter := counter + 1;
    final_username := base_username || counter;
    
    -- Safety check to prevent infinite loop
    IF counter > 1000 THEN
      final_username := 'user' || SUBSTRING(NEW.id::TEXT, 1, 8) || counter;
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert user profile
  INSERT INTO public.user_profiles (user_id, username, display_name, email)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING; -- Handle case where profile already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Error creating user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

