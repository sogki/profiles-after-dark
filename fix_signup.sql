-- Fix user signup 500 error
-- Run this in Supabase SQL Editor

-- First, check for and drop any triggers that might reference user_stats
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Find and drop any triggers on auth.users that might cause issues
    FOR r IN 
        SELECT tgname, oid 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND tgisinternal = false
        AND tgname != 'create_user_profile_trigger'
    LOOP
        BEGIN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.tgname) || ' ON auth.users CASCADE';
            RAISE NOTICE 'Dropped trigger: %', r.tgname;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop trigger %: %', r.tgname, SQLERRM;
        END;
    END LOOP;
END $$;

DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

CREATE OR REPLACE FUNCTION create_user_profile()
  RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  username_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(REGEXP_REPLACE(split_part(COALESCE(NEW.email, ''), '@', 1), '[^a-z0-9]', '', 'g'))
  );
  
  IF base_username IS NULL OR base_username = '' OR LENGTH(base_username) = 0 THEN
    base_username := 'user' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
  END IF;
  
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 3);
  END IF;
  
  final_username := base_username;
  LOOP
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE username = final_username) INTO username_exists;
    EXIT WHEN NOT username_exists;
    
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
    
    IF counter > 1000 THEN
      final_username := 'user' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8) || counter::TEXT;
      EXIT;
    END IF;
  END LOOP;
  
  BEGIN
    INSERT INTO public.user_profiles (user_id, username, display_name, email)
    VALUES (
      NEW.id,
      final_username,
      COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Try to create user_stats entry if table exists and has the right structure
    BEGIN
      INSERT INTO public.user_stats (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION
      WHEN undefined_table THEN
        -- user_stats table doesn't exist, skip
        NULL;
      WHEN undefined_column THEN
        -- user_stats table exists but has different structure, skip
        NULL;
      WHEN OTHERS THEN
        -- Any other error, just log and continue
        RAISE NOTICE 'Could not create user_stats entry: %', SQLERRM;
    END;
  EXCEPTION
    WHEN undefined_column THEN
      INSERT INTO public.user_profiles (user_id, username, display_name)
      VALUES (
        NEW.id,
        final_username,
        COALESCE(NEW.raw_user_meta_data->>'display_name', final_username)
      )
      ON CONFLICT (user_id) DO NOTHING;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

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

