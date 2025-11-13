-- Add Railway environment variables to bot_config table
-- These are used by the bot to determine the deployment environment

-- Add RAILWAY_PUBLIC_DOMAIN
INSERT INTO public.bot_config (key, value, description, category, is_secret, encrypted)
VALUES (
    'RAILWAY_PUBLIC_DOMAIN',
    'profiles-after-dark-production.up.railway.app',
    'Railway public domain for the deployed service',
    'api',
    false,
    false
)
ON CONFLICT (key) 
DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_secret = EXCLUDED.is_secret,
    updated_at = NOW();

-- Add RAILWAY_ENVIRONMENT
INSERT INTO public.bot_config (key, value, description, category, is_secret, encrypted)
VALUES (
    'RAILWAY_ENVIRONMENT',
    'production',
    'Railway deployment environment (production, staging, etc.)',
    'api',
    false,
    false
)
ON CONFLICT (key) 
DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    is_secret = EXCLUDED.is_secret,
    updated_at = NOW();

-- Update API_URL if it's still pointing to dev domain
UPDATE public.bot_config
SET value = 'https://profiles-after-dark-production.up.railway.app',
    updated_at = NOW()
WHERE key = 'API_URL' 
  AND value LIKE '%dev.profilesafterdark.com%';

-- Update BACKEND_URL if it's still pointing to dev domain
UPDATE public.bot_config
SET value = 'https://profiles-after-dark-production.up.railway.app',
    updated_at = NOW()
WHERE key = 'BACKEND_URL' 
  AND value LIKE '%dev.profilesafterdark.com%';

