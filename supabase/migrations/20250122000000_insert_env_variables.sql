-- Insert Environment Variables into bot_config
-- This migration inserts environment variables from .env into bot_config
-- If a key already exists, it will be skipped (ON CONFLICT DO NOTHING)
-- 
-- NOTE: All keys from the current bot_config table are already in use by:
--   - Bot: DISCORD_TOKEN, CLIENT_ID, GUILD_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, 
--          API_URL, BACKEND_URL, WEB_URL, STAFF_LOG_CHANNEL_ID, PORT, NODE_ENV
--   - Frontend: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL, VITE_BACKEND_URL,
--               VITE_WEB_URL, SUPABASE_URL, API_URL, BACKEND_URL, WEB_URL, CLIENT_ID, GUILD_ID
--   - API Route: Returns public keys to frontend and creates VITE_ prefixed versions
--
-- This migration will only insert keys that don't already exist.
-- All existing keys are actively used and should NOT be removed.

-- All keys currently in the database are already being used, so this migration
-- will effectively do nothing if all keys exist. However, if you add new keys
-- to your .env file, you can add them here.

-- Example: If you add a new key like 'NEW_API_KEY', uncomment and add it below:
-- INSERT INTO public.bot_config (key, value, description, category, is_secret, encrypted)
-- VALUES 
--     ('NEW_API_KEY', '', 'Description of new key', 'api', true, true)
-- ON CONFLICT (key) DO NOTHING;

-- Instructions:
-- 1. To add new keys, add them to the INSERT statements above
-- 2. To update existing values, use UPDATE statements or the set_bot_config function
-- 3. Example UPDATE (requires service_role):
--    UPDATE public.bot_config SET value = 'your-value' WHERE key = 'KEY_NAME';
-- 4. Example using function:
--    SELECT set_bot_config('KEY_NAME', 'your-value', 'Description', 'category', true);

