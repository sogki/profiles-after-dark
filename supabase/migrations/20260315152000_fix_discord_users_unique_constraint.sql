-- Normalize discord_users uniqueness to support per-guild linking.
-- Some environments still have a legacy UNIQUE(discord_id) constraint:
--   discord_users_discord_id_key
-- This migration removes that legacy constraint/index and enforces
-- UNIQUE(discord_id, guild_id).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discord_users_discord_id_key'
      AND conrelid = 'public.discord_users'::regclass
  ) THEN
    ALTER TABLE public.discord_users
      DROP CONSTRAINT discord_users_discord_id_key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'discord_users'
      AND indexname = 'discord_users_discord_id_key'
  ) THEN
    DROP INDEX public.discord_users_discord_id_key;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'discord_users_discord_guild_unique'
      AND conrelid = 'public.discord_users'::regclass
  ) THEN
    ALTER TABLE public.discord_users
      ADD CONSTRAINT discord_users_discord_guild_unique
      UNIQUE (discord_id, guild_id);
  END IF;
END $$;
