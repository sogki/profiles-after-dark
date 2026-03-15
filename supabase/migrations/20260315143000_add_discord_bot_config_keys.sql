-- Add Discord bot configuration keys introduced by bot/admin enhancements.
-- Values default to placeholders and should be set in Supabase after migration.

INSERT INTO public.bot_config (key, value, description, category, is_secret, encrypted)
VALUES
  (
    'PREMIUM_ROLE_ID',
    '',
    'Discord role ID granted to active Flair Premium subscribers',
    'discord',
    false,
    false
  ),
  (
    'FLAIR_PREMIUM_ROLE_ID',
    '',
    'Legacy alias for PREMIUM_ROLE_ID',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_LOG_CHANNEL_SUBMISSIONS',
    '',
    'Discord channel ID for new content submission logs',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_LOG_CHANNEL_CONTENT_REVIEW',
    '',
    'Discord channel ID for approve/reject moderation logs',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_LOG_CHANNEL_FLAIR',
    '',
    'Discord channel ID for Flair subscription events',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_LOG_CHANNEL_ACCOUNT_LINKING',
    '',
    'Discord channel ID for account-linking events',
    'discord',
    false,
    false
  ),
  (
    'DISCORD_LOG_CHANNEL_ADMIN',
    '',
    'Discord channel ID for admin-only bot events',
    'discord',
    false,
    false
  ),
  (
    'AUTO_DEPLOY_COMMANDS',
    'true',
    'Automatically deploy slash commands when the bot service starts',
    'discord',
    false,
    false
  ),
  (
    'EXPORT_LINK_SECRET',
    '',
    'Secret used to sign temporary account-export download links',
    'external',
    true,
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
