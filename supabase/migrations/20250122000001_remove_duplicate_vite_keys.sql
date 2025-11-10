-- Remove duplicate VITE_ prefixed keys from bot_config
-- We now use base keys (SUPABASE_URL, API_URL, etc.) and derive VITE_ versions in code
-- This migration removes the duplicate VITE_ keys from the database

-- Delete VITE_ prefixed keys that have base key equivalents
DELETE FROM public.bot_config
WHERE key IN (
    'VITE_SUPABASE_URL',      -- Use SUPABASE_URL instead
    'VITE_SUPABASE_ANON_KEY', -- Use SUPABASE_ANON_KEY instead
    'VITE_SUPABASE_CUSTOM_DOMAIN', -- Use SUPABASE_CUSTOM_DOMAIN instead
    'VITE_API_URL',           -- Use API_URL instead
    'VITE_BACKEND_URL',       -- Use BACKEND_URL instead
    'VITE_WEB_URL'            -- Use WEB_URL instead
);

-- Note: The API route will automatically create VITE_ prefixed versions
-- from the base keys for frontend compatibility, so we don't need to store them separately.

