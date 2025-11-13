-- Fix role constraint to allow comma-separated values
-- This migration updates the user_profiles.role check constraint to support comma-separated roles
-- like "admin,verified" or "staff,verified"

-- First, fix any existing invalid role data before dropping the constraint
-- Convert any invalid roles to NULL or a valid default
DO $$
DECLARE
  invalid_role_count INTEGER;
BEGIN
  -- Check if there are any rows with invalid roles
  SELECT COUNT(*) INTO invalid_role_count
  FROM public.user_profiles
  WHERE role IS NOT NULL
  AND role != ''
  AND NOT (
    -- Check if role is a valid single role
    trim(lower(role)) IN ('admin', 'staff', 'moderator', 'member', 'user', 'verified', 'bug_tester', 'bugtester')
    OR
    -- Check if all parts in comma-separated role are valid
    NOT EXISTS (
      SELECT 1
      FROM unnest(string_to_array(trim(role), ',')) AS role_part
      WHERE trim(lower(role_part)) NOT IN ('admin', 'staff', 'moderator', 'member', 'user', 'verified', 'bug_tester', 'bugtester')
    )
  );
  
  -- If there are invalid roles, set them to NULL (they'll get 'member' badge via check_special_achievements)
  IF invalid_role_count > 0 THEN
    UPDATE public.user_profiles
    SET role = NULL
    WHERE role IS NOT NULL
    AND role != ''
    AND NOT (
      trim(lower(role)) IN ('admin', 'staff', 'moderator', 'member', 'user', 'verified', 'bug_tester', 'bugtester')
      OR
      NOT EXISTS (
        SELECT 1
        FROM unnest(string_to_array(trim(role), ',')) AS role_part
        WHERE trim(lower(role_part)) NOT IN ('admin', 'staff', 'moderator', 'member', 'user', 'verified', 'bug_tester', 'bugtester')
      )
    );
    
    RAISE NOTICE 'Fixed % rows with invalid role values by setting them to NULL', invalid_role_count;
  END IF;
END $$;

-- Drop the existing constraint if it exists
DO $$
BEGIN
  -- Drop the constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_role_check' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles 
    DROP CONSTRAINT user_profiles_role_check;
  END IF;
END $$;

-- Create a new constraint that allows comma-separated roles
-- The constraint validates that each role in the comma-separated list is valid
-- Valid roles: admin, staff, moderator, member, user, verified, bug_tester, bugtester
-- Note: We use a function-based check to validate comma-separated values
CREATE OR REPLACE FUNCTION validate_role_format(role_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  role_part TEXT;
  valid_roles TEXT[] := ARRAY['admin', 'staff', 'moderator', 'member', 'user', 'verified', 'bug_tester', 'bugtester'];
BEGIN
  -- NULL is valid
  IF role_text IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Empty string is valid (will be treated as NULL)
  IF trim(role_text) = '' THEN
    RETURN TRUE;
  END IF;
  
  -- Check each role in the comma-separated list
  FOREACH role_part IN ARRAY string_to_array(trim(role_text), ',')
  LOOP
    -- Trim and lowercase for comparison
    role_part := trim(lower(role_part));
    
    -- Skip empty parts
    IF role_part = '' THEN
      CONTINUE;
    END IF;
    
    -- Check if this role is valid
    IF NOT (role_part = ANY(valid_roles)) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Add the constraint using the function
ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_role_check 
CHECK (validate_role_format(role));

-- Add comment explaining the role format
COMMENT ON COLUMN public.user_profiles.role IS 
'User role(s). Can be a single role (admin, staff, moderator, member, user, verified, bug_tester) or comma-separated roles (e.g., "admin,verified"). Roles are case-insensitive. "user" and "member" both grant the member badge.';

