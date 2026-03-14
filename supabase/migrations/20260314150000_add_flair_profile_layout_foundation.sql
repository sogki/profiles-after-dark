-- Phase 1 foundation for premium, per-profile public profile layouts.
-- Adds:
-- 1) flair_profile_layouts table (per-user layout JSON)
-- 2) premium-safe RLS + helper checks
-- 3) RPC to upsert own layout (premium only)
-- 4) cancellation cleanup extension: reset/unpublish layout on premium loss

CREATE OR REPLACE FUNCTION public.default_flair_profile_layout()
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT jsonb_build_object(
    'schemaVersion', 1,
    'theme', jsonb_build_object(
      'mode', 'default',
      'accent', '#a855f7',
      'surface', '#0f172a'
    ),
    'sections', jsonb_build_array(
      jsonb_build_object('id', 'hero', 'type', 'hero', 'enabled', true, 'order', 1),
      jsonb_build_object('id', 'about', 'type', 'about', 'enabled', true, 'order', 2),
      jsonb_build_object('id', 'highlights', 'type', 'highlights', 'enabled', true, 'order', 3)
    )
  );
$$;

CREATE TABLE IF NOT EXISTS public.flair_profile_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  layout_json jsonb NOT NULL DEFAULT public.default_flair_profile_layout(),
  is_published boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT flair_profile_layouts_layout_json_object CHECK (jsonb_typeof(layout_json) = 'object')
);

CREATE INDEX IF NOT EXISTS flair_profile_layouts_user_id_idx
  ON public.flair_profile_layouts (user_id);

CREATE INDEX IF NOT EXISTS flair_profile_layouts_is_published_idx
  ON public.flair_profile_layouts (is_published);

ALTER TABLE public.flair_profile_layouts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.user_has_active_flair_premium(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.flair_subscriptions fs
    WHERE fs.user_id = p_user_id
      AND fs.subscription_tier = 'premium'
      AND fs.status IN ('active', 'trialing')
  );
$$;

DROP POLICY IF EXISTS "Public can view published layouts and owners can view own" ON public.flair_profile_layouts;
CREATE POLICY "Public can view published layouts and owners can view own"
  ON public.flair_profile_layouts
  FOR SELECT
  USING (is_published = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Premium users can insert own profile layout" ON public.flair_profile_layouts;
CREATE POLICY "Premium users can insert own profile layout"
  ON public.flair_profile_layouts
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_active_flair_premium(auth.uid())
  );

DROP POLICY IF EXISTS "Premium users can update own profile layout" ON public.flair_profile_layouts;
CREATE POLICY "Premium users can update own profile layout"
  ON public.flair_profile_layouts
  FOR UPDATE
  USING (
    auth.uid() = user_id
    AND public.user_has_active_flair_premium(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id
    AND public.user_has_active_flair_premium(auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own profile layout" ON public.flair_profile_layouts;
CREATE POLICY "Users can delete own profile layout"
  ON public.flair_profile_layouts
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.upsert_my_flair_profile_layout(
  p_layout_json jsonb,
  p_is_published boolean DEFAULT true
)
RETURNS public.flair_profile_layouts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid uuid;
  v_layout public.flair_profile_layouts;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  IF NOT public.user_has_active_flair_premium(v_uid) THEN
    RAISE EXCEPTION 'Premium subscription required to customize public profile layout.'
      USING ERRCODE = '42501';
  END IF;

  IF p_layout_json IS NULL OR jsonb_typeof(p_layout_json) <> 'object' THEN
    RAISE EXCEPTION 'Invalid layout payload. Expected JSON object.'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.flair_profile_layouts (
    user_id,
    layout_json,
    is_published,
    version
  )
  VALUES (
    v_uid,
    p_layout_json,
    p_is_published,
    1
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    layout_json = EXCLUDED.layout_json,
    is_published = EXCLUDED.is_published,
    version = public.flair_profile_layouts.version + 1,
    updated_at = now()
  RETURNING * INTO v_layout;

  RETURN v_layout;
END;
$$;

GRANT EXECUTE ON FUNCTION public.user_has_active_flair_premium(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_my_flair_profile_layout(jsonb, boolean) TO authenticated;

-- Extend premium-loss cleanup to also remove published premium layout customizations.
CREATE OR REPLACE FUNCTION public.revoke_flair_premium_customizations_on_downgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_had_premium_before boolean := false;
  v_has_premium_now boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_had_premium_before := (
      OLD.subscription_tier = 'premium'
      AND OLD.status IN ('active', 'trialing')
    );
  END IF;

  v_has_premium_now := (
    NEW.subscription_tier = 'premium'
    AND NEW.status IN ('active', 'trialing')
  );

  IF v_had_premium_before AND NOT v_has_premium_now THEN
    UPDATE public.flair_profiles
    SET
      custom_display_name = NULL,
      display_name_animation = NULL,
      display_name_gradient = NULL,
      theme_id = NULL,
      updated_at = now()
    WHERE user_id = NEW.user_id;

    UPDATE public.user_profiles
    SET
      spotlight_enabled = false,
      spotlight_priority = 0,
      spotlight_updated_at = now(),
      updated_at = now()
    WHERE user_id = NEW.user_id;

    -- Unpublish and reset profile layout to default when premium ends.
    UPDATE public.flair_profile_layouts
    SET
      layout_json = public.default_flair_profile_layout(),
      is_published = false,
      version = version + 1,
      updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flair_revoke_premium_customizations_trigger ON public.flair_subscriptions;
CREATE TRIGGER flair_revoke_premium_customizations_trigger
AFTER UPDATE ON public.flair_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.revoke_flair_premium_customizations_on_downgrade();
