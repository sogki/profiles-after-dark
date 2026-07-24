-- Add bot_config keys used by the Discord /setup command.
-- These keys persist category/channel IDs aligned with Profiles After Dark content structure.

INSERT INTO public.bot_config (key, value, description, category, is_secret, encrypted)
VALUES
  (
    'DISCORD_SETUP_CATEGORY_MAP',
    '{}',
    'JSON map of setup category keys to Discord category IDs',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_SETUP_CHANNEL_MAP',
    '{}',
    'JSON map of setup channel keys to Discord channel IDs',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_CHANNEL_WELCOME_ID',
    '',
    'Discord channel ID for welcome/onboarding messages',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_CHANNEL_RULES_ID',
    '',
    'Discord channel ID for server rules',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_CHANNEL_REACTION_ROLES_ID',
    '',
    'Discord channel ID for reaction role messages',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_CHANNEL_CONTENT_SUBMISSIONS_ID',
    '',
    'Discord channel ID for content hub notifications',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_CHANNEL_GALLERY_SHOWCASE_ID',
    '',
    'Discord channel ID for gallery showcase feed',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_CHANNEL_CONTENT_REVIEW_ID',
    '',
    'Discord channel ID for staff content review workflow',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_SETUP_LINK_SECRET',
    '',
    'Secret used to sign temporary Discord setup dashboard links',
    'discord',
    true,
    false
  ),
  (
    'DEV_WEB_URL',
    'https://dev.profilesafterdark.com',
    'Development web portal URL used for Discord setup dashboard links',
    'api',
    false,
    false
  )
ON CONFLICT (key) DO UPDATE
SET
  value = CASE
    WHEN public.bot_config.value IS NULL OR public.bot_config.value = '' THEN EXCLUDED.value
    ELSE public.bot_config.value
  END,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_secret = EXCLUDED.is_secret,
  encrypted = EXCLUDED.encrypted;
