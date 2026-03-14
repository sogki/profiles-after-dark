-- Warm welcome notification when users newly enter Flair Premium.
-- Covers manual/staff upgrades and direct DB edits as a safety net.

CREATE OR REPLACE FUNCTION public.notify_flair_premium_welcome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_should_notify boolean := false;
BEGIN
  IF NEW.subscription_tier = 'premium' AND NEW.status IN ('active', 'trialing') THEN
    IF TG_OP = 'INSERT' THEN
      v_should_notify := true;
    ELSIF TG_OP = 'UPDATE' THEN
      v_should_notify :=
        (COALESCE(OLD.subscription_tier, 'free') <> 'premium')
        OR (COALESCE(OLD.status, 'canceled') NOT IN ('active', 'trialing'));
    END IF;
  END IF;

  IF v_should_notify THEN
    -- De-dupe to avoid duplicate "welcome" notices from rapid multi-step updates.
    IF NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = NEW.user_id
        AND n.metadata->>'event' = 'subscription_welcome'
        AND n.created_at > now() - interval '24 hours'
    ) THEN
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        content,
        type,
        priority,
        read,
        action_url,
        metadata,
        created_at
      )
      VALUES (
        NEW.user_id,
        'Welcome to Flair Premium!',
        'You are officially Premium. Your custom display name effects, advanced flair controls, and exclusive personalization options are now unlocked. We are glad to have you here.',
        'You are officially Premium. Your custom display name effects, advanced flair controls, and exclusive personalization options are now unlocked. We are glad to have you here.',
        'success',
        'medium',
        false,
        '/profile-settings?tab=flair',
        jsonb_build_object(
          'event', 'subscription_welcome',
          'source', 'flair_subscription_trigger'
        ),
        now()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS flair_subscription_welcome_trigger ON public.flair_subscriptions;
CREATE TRIGGER flair_subscription_welcome_trigger
AFTER INSERT OR UPDATE ON public.flair_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_flair_premium_welcome();
