-- Find all triggers and functions that might reference user_stats
-- Run this to see what's trying to access user_stats

-- Check all triggers on auth.users
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
AND tgisinternal = false;

-- Check all functions that might reference user_stats
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc 
WHERE prosrc LIKE '%user_stats%'
OR prosrc LIKE '%user_stats%';

-- Check triggers on user_profiles
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgrelid = 'public.user_profiles'::regclass
AND tgisinternal = false;

-- List all tables to see if user_stats exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

