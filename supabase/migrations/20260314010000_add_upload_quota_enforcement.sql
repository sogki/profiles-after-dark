-- Enforce weighted upload quotas for non-premium users.
-- Free users: 100 total weighted uploads.
-- Premium users: unlimited uploads.
-- Weighting: profile uploads count as 2, everything else counts as 1.

CREATE OR REPLACE FUNCTION public.get_upload_limit(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier text;
  v_status text;
BEGIN
  SELECT subscription_tier, status
  INTO v_tier, v_status
  FROM public.flair_subscriptions
  WHERE user_id = p_user_id;

  IF v_tier = 'premium' AND v_status IN ('active', 'trialing') THEN
    RETURN 999999999;
  END IF;

  RETURN 100;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_upload_usage(p_user_id uuid)
RETURNS TABLE (
  used integer,
  quota integer,
  remaining integer,
  is_premium boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profiles integer := 0;
  v_profile_pairs integer := 0;
  v_emotes integer := 0;
  v_wallpapers integer := 0;
  v_emoji_combos integer := 0;
  v_single_uploads integer := 0;
  v_limit integer := 100;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE type = 'profile'),
    COUNT(*) FILTER (WHERE type IS DISTINCT FROM 'profile')
  INTO v_profiles, v_single_uploads
  FROM public.profiles
  WHERE user_id = p_user_id;

  IF to_regclass('public.profile_pairs') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.profile_pairs WHERE user_id = $1'
      INTO v_profile_pairs
      USING p_user_id;
  END IF;

  SELECT COUNT(*) INTO v_emotes
  FROM public.emotes
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_wallpapers
  FROM public.wallpapers
  WHERE user_id = p_user_id;

  IF to_regclass('public.emoji_combos') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.emoji_combos WHERE user_id = $1'
      INTO v_emoji_combos
      USING p_user_id;
  END IF;

  v_limit := public.get_upload_limit(p_user_id);

  used := (v_profiles * 2) + v_single_uploads + (v_profile_pairs * 2) + v_emotes + v_wallpapers + v_emoji_combos;
  quota := v_limit;
  remaining := GREATEST(v_limit - used, 0);
  is_premium := (v_limit > 100);
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_upload_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used integer;
  v_quota integer;
  v_remaining integer;
  v_is_premium boolean;
  v_cost integer := 1;
BEGIN
  SELECT used, quota, remaining, is_premium
  INTO v_used, v_quota, v_remaining, v_is_premium
  FROM public.get_user_upload_usage(NEW.user_id);

  IF TG_TABLE_NAME = 'profiles' THEN
    IF NEW.type = 'profile' THEN
      v_cost := 2;
    ELSE
      v_cost := 1;
    END IF;
  ELSIF TG_TABLE_NAME = 'profile_pairs' THEN
    v_cost := 2;
  ELSE
    v_cost := 1;
  END IF;

  IF v_is_premium = false AND (v_used + v_cost) > v_quota THEN
    RAISE EXCEPTION
      'Upload limit reached. Free plan includes % weighted uploads. Remaining: %, required: %. Upgrade to Premium for unlimited uploads.',
      v_quota,
      v_remaining,
      v_cost
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_upload_quota_profiles ON public.profiles;
CREATE TRIGGER enforce_upload_quota_profiles
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_upload_quota();

DROP TRIGGER IF EXISTS enforce_upload_quota_emotes ON public.emotes;
CREATE TRIGGER enforce_upload_quota_emotes
BEFORE INSERT ON public.emotes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_upload_quota();

DROP TRIGGER IF EXISTS enforce_upload_quota_wallpapers ON public.wallpapers;
CREATE TRIGGER enforce_upload_quota_wallpapers
BEFORE INSERT ON public.wallpapers
FOR EACH ROW
EXECUTE FUNCTION public.enforce_upload_quota();

DO $$
BEGIN
  IF to_regclass('public.profile_pairs') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS enforce_upload_quota_profile_pairs ON public.profile_pairs';
    EXECUTE 'CREATE TRIGGER enforce_upload_quota_profile_pairs
      BEFORE INSERT ON public.profile_pairs
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_upload_quota()';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.emoji_combos') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS enforce_upload_quota_emoji_combos ON public.emoji_combos';
    EXECUTE 'CREATE TRIGGER enforce_upload_quota_emoji_combos
      BEFORE INSERT ON public.emoji_combos
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_upload_quota()';
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.single_uploads') IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS enforce_upload_quota_single_uploads ON public.single_uploads';
    EXECUTE 'CREATE TRIGGER enforce_upload_quota_single_uploads
      BEFORE INSERT ON public.single_uploads
      FOR EACH ROW
      EXECUTE FUNCTION public.enforce_upload_quota()';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.get_upload_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_upload_usage TO authenticated;

COMMENT ON FUNCTION public.get_upload_limit IS 'Returns upload limit by subscription. Free=100, premium=unlimited.';
COMMENT ON FUNCTION public.get_user_upload_usage IS 'Returns weighted upload usage and remaining quota for a user.';
