DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'discord'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN discord text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'instagram'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN instagram text;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'website'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN website text;
  END IF;
END
$$;

COMMENT ON COLUMN public.user_profiles.discord IS 'Optional Discord handle or invite link shown on public profile.';
COMMENT ON COLUMN public.user_profiles.instagram IS 'Optional Instagram username or URL shown on public profile.';
COMMENT ON COLUMN public.user_profiles.website IS 'Optional personal website URL shown on public profile.';
