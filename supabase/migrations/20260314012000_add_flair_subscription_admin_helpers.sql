-- Admin helper functions for manually setting Flair subscription tiers.
-- Useful for support actions and direct DB-admin workflows.

CREATE OR REPLACE FUNCTION public.admin_set_flair_subscription(
  p_user_id uuid,
  p_subscription_tier text,
  p_status text DEFAULT 'active',
  p_current_period_end timestamptz DEFAULT NULL,
  p_stripe_customer_id text DEFAULT NULL,
  p_stripe_subscription_id text DEFAULT NULL
)
RETURNS public.flair_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
  v_row public.flair_subscriptions;
BEGIN
  SELECT role
  INTO v_role
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  IF v_role IS NULL OR v_role NOT IN ('admin', 'staff', 'moderator') THEN
    RAISE EXCEPTION 'Insufficient permissions to update flair subscriptions.'
      USING ERRCODE = '42501';
  END IF;

  IF p_subscription_tier NOT IN ('free', 'premium') THEN
    RAISE EXCEPTION 'Invalid subscription tier: %', p_subscription_tier
      USING ERRCODE = '22023';
  END IF;

  IF p_status NOT IN ('active', 'canceled', 'past_due', 'trialing') THEN
    RAISE EXCEPTION 'Invalid subscription status: %', p_status
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.flair_subscriptions (
    user_id,
    subscription_tier,
    status,
    current_period_end,
    stripe_customer_id,
    stripe_subscription_id
  )
  VALUES (
    p_user_id,
    p_subscription_tier,
    p_status,
    p_current_period_end,
    p_stripe_customer_id,
    p_stripe_subscription_id
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    subscription_tier = EXCLUDED.subscription_tier,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, public.flair_subscriptions.stripe_customer_id),
    stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, public.flair_subscriptions.stripe_subscription_id),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.admin_set_flair_subscription IS
  'Admin/staff helper to set free/premium Flair subscription state for a user.';

GRANT EXECUTE ON FUNCTION public.admin_set_flair_subscription TO authenticated;
