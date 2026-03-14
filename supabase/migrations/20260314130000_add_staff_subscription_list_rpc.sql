-- Staff-safe listing helper for moderation subscriptions view.
-- RLS on flair_subscriptions only exposes own rows, so moderation needs an RPC.

CREATE OR REPLACE FUNCTION public.staff_list_flair_subscriptions()
RETURNS TABLE (
  user_id uuid,
  subscription_tier text,
  status text,
  current_period_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_role text;
  v_is_staff boolean := false;
BEGIN
  SELECT role
    INTO v_actor_role
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  SELECT EXISTS (
    SELECT 1
    FROM unnest(regexp_split_to_array(lower(COALESCE(v_actor_role, '')), '\s*,\s*')) AS role_token
    WHERE role_token IN ('admin', 'staff', 'moderator')
  )
  INTO v_is_staff;

  IF NOT v_is_staff THEN
    RAISE EXCEPTION 'Insufficient permissions to view subscription list.'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    fs.user_id,
    fs.subscription_tier,
    fs.status,
    fs.current_period_end
  FROM public.flair_subscriptions fs;
END;
$$;

COMMENT ON FUNCTION public.staff_list_flair_subscriptions IS
  'Returns all flair subscription rows for staff/admin moderation tooling.';

GRANT EXECUTE ON FUNCTION public.staff_list_flair_subscriptions TO authenticated;
