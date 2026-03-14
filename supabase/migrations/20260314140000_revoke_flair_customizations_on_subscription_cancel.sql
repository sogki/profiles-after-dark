-- Revoke premium-only flair customization when premium access is lost.
-- This covers Stripe webhook updates, staff updates, and direct DB changes.

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

  -- Only run cleanup when a user transitions from premium access -> no premium access.
  IF v_had_premium_before AND NOT v_has_premium_now THEN
    -- Remove premium-only display name + theme customizations.
    UPDATE public.flair_profiles
    SET
      custom_display_name = NULL,
      display_name_animation = NULL,
      display_name_gradient = NULL,
      theme_id = NULL,
      updated_at = now()
    WHERE user_id = NEW.user_id;

    -- Disable premium spotlight placement.
    UPDATE public.user_profiles
    SET
      spotlight_enabled = false,
      spotlight_priority = 0,
      spotlight_updated_at = now(),
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
