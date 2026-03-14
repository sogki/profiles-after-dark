-- Enforce collection limits for free users.
-- Free users: max 3 collections
-- Premium users: unlimited collections

CREATE OR REPLACE FUNCTION public.enforce_flair_collection_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium boolean := false;
  v_collection_count integer := 0;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT (subscription_tier = 'premium' AND status IN ('active', 'trialing'))
  INTO v_is_premium
  FROM public.flair_subscriptions
  WHERE user_id = NEW.user_id;

  IF COALESCE(v_is_premium, false) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO v_collection_count
  FROM public.flair_emote_collections
  WHERE user_id = NEW.user_id;

  IF v_collection_count >= 3 THEN
    RAISE EXCEPTION 'Free users can create up to 3 collections. Upgrade to Premium for unlimited collections.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_flair_collection_limit_trigger ON public.flair_emote_collections;
CREATE TRIGGER enforce_flair_collection_limit_trigger
  BEFORE INSERT ON public.flair_emote_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_flair_collection_limit();

GRANT EXECUTE ON FUNCTION public.enforce_flair_collection_limit TO authenticated;
