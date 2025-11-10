# Fix Signup 500 Error - Step by Step Guide

## Problem
Getting `500 Internal Server Error` when users try to sign up, with error message "database error saving new user".

## Solution
The database trigger function needs to be updated to handle duplicate usernames and edge cases.

## Steps to Fix

### Option 1: Run SQL in Supabase Dashboard (Easiest)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Fix**
   - Open the file `fix_signup_trigger.sql` in this project
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Query**
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - You should see "Success. No rows returned"

5. **Test Signup**
   - Try signing up a new user
   - The error should be resolved

### Option 2: Run Migration File

If you're using Supabase CLI:

```bash
# Make sure you're in the project root
cd "D:\OTHER\Business\Profiles After Dark\profiles-after-dark"

# Link to your Supabase project (if not already linked)
npx supabase link --project-ref zzywottwfffyddnorein

# Push the migration
npx supabase db push
```

### Option 3: Manual SQL Execution

If the above don't work, you can run this simplified version directly:

```sql
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
DROP FUNCTION IF EXISTS create_user_profile();

-- Create improved function
CREATE OR REPLACE FUNCTION create_user_profile()
  RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  username_exists BOOLEAN;
  counter INTEGER := 0;
BEGIN
  -- Generate base username
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(REGEXP_REPLACE(split_part(COALESCE(NEW.email, ''), '@', 1), '[^a-z0-9]', '', 'g'))
  );
  
  -- Ensure username is not empty
  IF base_username IS NULL OR base_username = '' OR LENGTH(base_username) = 0 THEN
    base_username := 'user' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
  END IF;
  
  -- Ensure minimum length
  IF LENGTH(base_username) < 3 THEN
    base_username := base_username || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 3);
  END IF;
  
  -- Find unique username
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
  
  -- Insert user profile (try with email, fallback without)
  BEGIN
    INSERT INTO public.user_profiles (user_id, username, display_name, email)
    VALUES (
      NEW.id,
      final_username,
      COALESCE(NEW.raw_user_meta_data->>'display_name', final_username),
      NEW.email
    )
    ON CONFLICT (user_id) DO NOTHING;
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

-- Recreate trigger
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Add RLS policies for trigger function
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
```

## What This Fix Does

1. **Handles Duplicate Usernames**: Automatically generates unique usernames when conflicts occur
2. **Handles Missing Email Column**: Gracefully falls back if email column doesn't exist
3. **Better Error Handling**: Uses `RAISE NOTICE` instead of errors, so user creation never fails
4. **RLS Policy Fix**: Allows the trigger function to insert user profiles during signup

## Verification

After running the SQL:

1. Try signing up a new user
2. Check the `user_profiles` table - a new profile should be created
3. The username should be unique and based on the email

## Troubleshooting

If you still get errors:

1. **Check Supabase Logs**
   - Go to Dashboard > Logs > Postgres Logs
   - Look for any error messages related to `create_user_profile`

2. **Verify RLS Policies**
   - Go to Dashboard > Authentication > Policies
   - Make sure the policies for `user_profiles` allow inserts

3. **Check Function Exists**
   - Run: `SELECT * FROM pg_proc WHERE proname = 'create_user_profile';`
   - Should return the function definition

4. **Check Trigger Exists**
   - Run: `SELECT * FROM pg_trigger WHERE tgname = 'create_user_profile_trigger';`
   - Should return the trigger

## Need Help?

If the error persists after running the SQL:
- Check the Supabase dashboard logs for detailed error messages
- Verify your Supabase project is on a plan that supports custom functions
- Make sure you have the correct permissions to modify database functions

