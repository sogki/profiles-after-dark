-- Improve creator analytics accuracy and public collection browsing.

ALTER TABLE public.flair_emote_collections
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS download_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS flair_emote_collections_public_idx
  ON public.flair_emote_collections (is_public, is_active, download_count DESC);

DROP POLICY IF EXISTS "Anyone can view public flair emote collections" ON public.flair_emote_collections;
CREATE POLICY "Anyone can view public flair emote collections"
  ON public.flair_emote_collections
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

GRANT SELECT ON public.flair_emote_collections TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_flair_collection_download(p_collection_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.flair_emote_collections
  SET
    download_count = COALESCE(download_count, 0) + 1,
    updated_at = now()
  WHERE id = p_collection_id
    AND is_public = true
    AND is_active = true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_flair_collection_download TO anon, authenticated;

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
  v_profile_downloads integer := 0;
  v_emote_downloads integer := 0;
  v_wallpaper_downloads integer := 0;
  v_pair_downloads integer := 0;
  v_followers integer := 0;
  v_flair_emote_usage integer := 0;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(download_count), 0)
  INTO v_profiles, v_profile_downloads
  FROM public.profiles
  WHERE user_id = p_user_id;

  SELECT COUNT(*), COALESCE(SUM(download_count), 0)
  INTO v_emotes, v_emote_downloads
  FROM public.emotes
  WHERE user_id = p_user_id;

  SELECT COUNT(*), COALESCE(SUM(download_count), 0)
  INTO v_wallpapers, v_wallpaper_downloads
  FROM public.wallpapers
  WHERE user_id = p_user_id;

  IF to_regclass('public.profile_pairs') IS NOT NULL THEN
    EXECUTE 'SELECT COUNT(*), COALESCE(SUM(download_count), 0) FROM public.profile_pairs WHERE user_id = $1'
      INTO v_pairs, v_pair_downloads
      USING p_user_id;
  END IF;

  SELECT COUNT(*)
  INTO v_followers
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
  total_downloads := v_profile_downloads + v_emote_downloads + v_wallpaper_downloads + v_pair_downloads;
  follower_count := v_followers;
  public_emote_uses := v_flair_emote_usage;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_creator_analytics_summary TO authenticated;
