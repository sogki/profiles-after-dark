-- Premium feature foundation:
-- 1) Creator analytics (RPC summary)
-- 2) Advanced emote collections (new table)
-- 3) Profile spotlight placement (user_profiles fields + RPC toggle)

-- Spotlight columns on user profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS spotlight_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS spotlight_priority integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spotlight_updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS user_profiles_spotlight_enabled_idx
  ON public.user_profiles (spotlight_enabled);

CREATE INDEX IF NOT EXISTS user_profiles_spotlight_priority_idx
  ON public.user_profiles (spotlight_priority DESC);

-- Advanced emote collections
CREATE TABLE IF NOT EXISTS public.flair_emote_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  emote_ids uuid[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS flair_emote_collections_user_id_idx
  ON public.flair_emote_collections (user_id);

CREATE INDEX IF NOT EXISTS flair_emote_collections_is_active_idx
  ON public.flair_emote_collections (is_active);

ALTER TABLE public.flair_emote_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own flair emote collections" ON public.flair_emote_collections;
CREATE POLICY "Users can view own flair emote collections"
  ON public.flair_emote_collections
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own flair emote collections" ON public.flair_emote_collections;
CREATE POLICY "Users can insert own flair emote collections"
  ON public.flair_emote_collections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own flair emote collections" ON public.flair_emote_collections;
CREATE POLICY "Users can update own flair emote collections"
  ON public.flair_emote_collections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own flair emote collections" ON public.flair_emote_collections;
CREATE POLICY "Users can delete own flair emote collections"
  ON public.flair_emote_collections
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_flair_emote_collections_updated_at ON public.flair_emote_collections;
CREATE TRIGGER update_flair_emote_collections_updated_at
  BEFORE UPDATE ON public.flair_emote_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RPC: toggle spotlight status (premium only)
CREATE OR REPLACE FUNCTION public.set_profile_spotlight_status(p_enabled boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid;
  v_is_premium boolean := false;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required.'
      USING ERRCODE = '42501';
  END IF;

  SELECT (subscription_tier = 'premium' AND status IN ('active', 'trialing'))
  INTO v_is_premium
  FROM public.flair_subscriptions
  WHERE user_id = v_uid;

  IF p_enabled = true AND COALESCE(v_is_premium, false) = false THEN
    RAISE EXCEPTION 'Premium subscription required to enable spotlight.'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.user_profiles
  SET
    spotlight_enabled = p_enabled,
    spotlight_priority = CASE WHEN p_enabled THEN 100 ELSE 0 END,
    spotlight_updated_at = now(),
    updated_at = now()
  WHERE user_id = v_uid;

  RETURN p_enabled;
END;
$$;

-- RPC: creator analytics summary
CREATE OR REPLACE FUNCTION public.get_creator_analytics_summary(p_user_id uuid)
RETURNS TABLE (
  total_uploads integer,
  profile_uploads integer,
  emote_uploads integer,
  wallpaper_uploads integer,
  pair_uploads integer,
  total_downloads integer,
  follower_count integer,
  public_emote_uses integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profiles integer := 0;
  v_emotes integer := 0;
  v_wallpapers integer := 0;
  v_pairs integer := 0;
  v_downloads integer := 0;
  v_followers integer := 0;
  v_flair_emote_usage integer := 0;
BEGIN
  SELECT COUNT(*) INTO v_profiles
  FROM public.profiles
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_emotes
  FROM public.emotes
  WHERE user_id = p_user_id;

  SELECT COUNT(*) INTO v_wallpapers
  FROM public.wallpapers
  WHERE user_id = p_user_id;

  IF to_regclass('public.profile_pairs') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*) FROM public.profile_pairs WHERE user_id = $1'
      INTO v_pairs
      USING p_user_id;
  END IF;

  SELECT
    COALESCE(SUM(p.download_count), 0) +
    COALESCE(SUM(e.download_count), 0) +
    COALESCE(SUM(w.download_count), 0)
  INTO v_downloads
  FROM (SELECT download_count FROM public.profiles WHERE user_id = p_user_id) p
  FULL OUTER JOIN (SELECT download_count FROM public.emotes WHERE user_id = p_user_id) e ON false
  FULL OUTER JOIN (SELECT download_count FROM public.wallpapers WHERE user_id = p_user_id) w ON false;

  SELECT COUNT(*) INTO v_followers
  FROM public.follows
  WHERE following_id = p_user_id;

  IF to_regclass('public.flair_emotes') IS NOT NULL THEN
    EXECUTE 'SELECT COALESCE(SUM(usage_count), 0) FROM public.flair_emotes WHERE user_id = $1'
      INTO v_flair_emote_usage
      USING p_user_id;
  END IF;

  total_uploads := v_profiles + v_emotes + v_wallpapers + v_pairs;
  profile_uploads := v_profiles;
  emote_uploads := v_emotes;
  wallpaper_uploads := v_wallpapers;
  pair_uploads := v_pairs;
  total_downloads := COALESCE(v_downloads, 0);
  follower_count := v_followers;
  public_emote_uses := v_flair_emote_usage;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_profile_spotlight_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_creator_analytics_summary TO authenticated;

COMMENT ON TABLE public.flair_emote_collections IS 'Advanced user-defined collections for organizing emotes.';
COMMENT ON FUNCTION public.set_profile_spotlight_status IS 'Enable/disable profile spotlight placement for premium users.';
COMMENT ON FUNCTION public.get_creator_analytics_summary IS 'Returns creator analytics KPI summary for a user.';
