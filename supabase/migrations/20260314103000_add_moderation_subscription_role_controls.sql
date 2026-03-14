-- Admin/staff moderation controls for roles + Flair subscriptions.
-- Includes user notifications and moderation log entries.

CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  p_target_user_id uuid,
  p_new_role text,
  p_reason text DEFAULT NULL,
  p_custom_message text DEFAULT NULL
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_role text;
  v_actor_id uuid;
  v_old_role text;
  v_target_profile public.user_profiles;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT role
    INTO v_actor_role
  FROM public.user_profiles
  WHERE user_id = v_actor_id;

  IF v_actor_role IS NULL OR v_actor_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can update user roles.' USING ERRCODE = '42501';
  END IF;

  IF p_new_role NOT IN ('user', 'staff', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role USING ERRCODE = '22023';
  END IF;

  SELECT role INTO v_old_role
  FROM public.user_profiles
  WHERE user_id = p_target_user_id;

  UPDATE public.user_profiles
  SET
    role = p_new_role,
    updated_at = now()
  WHERE user_id = p_target_user_id
  RETURNING * INTO v_target_profile;

  IF v_target_profile.user_id IS NULL THEN
    RAISE EXCEPTION 'Target user profile not found.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.moderation_logs (
    action,
    moderator_id,
    target_user_id,
    description,
    created_at
  )
  VALUES (
    'role_change',
    v_actor_id,
    p_target_user_id,
    COALESCE(
      p_reason,
      format('Role updated from %s to %s', COALESCE(v_old_role, 'unknown'), p_new_role)
    ),
    now()
  );

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    read,
    metadata,
    created_at
  )
  VALUES (
    p_target_user_id,
    'Account role updated',
    COALESCE(
      NULLIF(trim(p_custom_message), ''),
      format(
        'A staff administrator updated your account role from %s to %s.',
        COALESCE(v_old_role, 'unknown'),
        p_new_role
      )
    ),
    'system',
    false,
    jsonb_build_object(
      'event', 'role_change',
      'old_role', v_old_role,
      'new_role', p_new_role
    ),
    now()
  );

  RETURN v_target_profile;
END;
$$;

COMMENT ON FUNCTION public.admin_update_user_role IS
  'Admin-only role update helper. Creates moderation logs + user notifications.';

GRANT EXECUTE ON FUNCTION public.admin_update_user_role TO authenticated;

CREATE OR REPLACE FUNCTION public.staff_manage_flair_subscription(
  p_target_user_id uuid,
  p_subscription_tier text,
  p_status text,
  p_current_period_end timestamptz DEFAULT NULL,
  p_custom_message text DEFAULT NULL,
  p_force_reset boolean DEFAULT false,
  p_reason text DEFAULT NULL
)
RETURNS public.flair_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_role text;
  v_actor_id uuid;
  v_row public.flair_subscriptions;
  v_default_message text;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT role
    INTO v_actor_role
  FROM public.user_profiles
  WHERE user_id = v_actor_id;

  IF v_actor_role IS NULL OR v_actor_role NOT IN ('admin', 'staff', 'moderator') THEN
    RAISE EXCEPTION 'Insufficient permissions to manage subscriptions.' USING ERRCODE = '42501';
  END IF;

  IF p_subscription_tier NOT IN ('free', 'premium') THEN
    RAISE EXCEPTION 'Invalid subscription tier: %', p_subscription_tier USING ERRCODE = '22023';
  END IF;

  IF p_status NOT IN ('active', 'canceled', 'past_due', 'trialing') THEN
    RAISE EXCEPTION 'Invalid subscription status: %', p_status USING ERRCODE = '22023';
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
    p_target_user_id,
    p_subscription_tier,
    p_status,
    p_current_period_end,
    NULL,
    NULL
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    subscription_tier = EXCLUDED.subscription_tier,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    stripe_customer_id = CASE
      WHEN p_force_reset THEN NULL
      ELSE public.flair_subscriptions.stripe_customer_id
    END,
    stripe_subscription_id = CASE
      WHEN p_force_reset THEN NULL
      ELSE public.flair_subscriptions.stripe_subscription_id
    END,
    updated_at = now()
  RETURNING * INTO v_row;

  INSERT INTO public.moderation_logs (
    action,
    moderator_id,
    target_user_id,
    description,
    created_at
  )
  VALUES (
    CASE WHEN p_force_reset THEN 'subscription_reset' ELSE 'subscription_update' END,
    v_actor_id,
    p_target_user_id,
    COALESCE(
      p_reason,
      format(
        'Subscription set to tier=%s, status=%s%s',
        p_subscription_tier,
        p_status,
        CASE WHEN p_force_reset THEN ' (force reset)' ELSE '' END
      )
    ),
    now()
  );

  v_default_message := format(
    'Your Flair subscription was updated to %s (%s)%s by staff.',
    p_subscription_tier,
    p_status,
    CASE WHEN p_force_reset THEN ' and reset for troubleshooting' ELSE '' END
  );

  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    read,
    metadata,
    created_at
  )
  VALUES (
    p_target_user_id,
    CASE
      WHEN p_force_reset THEN 'Subscription reset by staff'
      WHEN p_status = 'past_due' THEN 'Subscription payment issue'
      WHEN p_status = 'canceled' THEN 'Subscription canceled'
      ELSE 'Subscription updated'
    END,
    COALESCE(NULLIF(trim(p_custom_message), ''), v_default_message),
    CASE WHEN p_status = 'past_due' THEN 'warning' ELSE 'system' END,
    false,
    jsonb_build_object(
      'event', CASE WHEN p_force_reset THEN 'subscription_reset' ELSE 'subscription_update' END,
      'tier', p_subscription_tier,
      'status', p_status,
      'force_reset', p_force_reset,
      'current_period_end', p_current_period_end
    ),
    now()
  );

  RETURN v_row;
END;
$$;

COMMENT ON FUNCTION public.staff_manage_flair_subscription IS
  'Staff/admin helper for subscription edits, cancellation states, and force resets with user notifications.';

GRANT EXECUTE ON FUNCTION public.staff_manage_flair_subscription TO authenticated;

CREATE OR REPLACE FUNCTION public.send_flair_renewal_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted integer := 0;
BEGIN
  WITH due_users AS (
    SELECT fs.user_id, fs.current_period_end
    FROM public.flair_subscriptions fs
    WHERE fs.subscription_tier = 'premium'
      AND fs.status IN ('active', 'trialing')
      AND fs.current_period_end IS NOT NULL
      AND fs.current_period_end >= now()
      AND fs.current_period_end < now() + interval '7 days'
  ),
  inserted AS (
    INSERT INTO public.notifications (user_id, title, message, type, read, metadata, created_at)
    SELECT
      du.user_id,
      'Flair Premium renews soon',
      'Your Flair Premium subscription renews in less than 7 days. Open billing to review your payment method.',
      'info',
      false,
      jsonb_build_object(
        'event', 'subscription_renewal_7d',
        'current_period_end', du.current_period_end
      ),
      now()
    FROM due_users du
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.notifications n
      WHERE n.user_id = du.user_id
        AND n.metadata->>'event' = 'subscription_renewal_7d'
        AND n.metadata->>'current_period_end' = du.current_period_end::text
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO v_inserted FROM inserted;

  RETURN v_inserted;
END;
$$;

COMMENT ON FUNCTION public.send_flair_renewal_reminders IS
  'Queues 7-day renewal reminder notifications for active premium subscriptions.';

GRANT EXECUTE ON FUNCTION public.send_flair_renewal_reminders TO authenticated;
