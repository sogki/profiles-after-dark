-- Fix staff-role validation for content approval notifications.
-- Some environments store user_profiles.role as comma-separated role tokens.
-- The previous check used role IN (...) and failed for values like 'admin,founder'.

CREATE OR REPLACE FUNCTION public.create_content_approval_notification(
  target_user_id uuid,
  notification_content text,
  notification_type text,
  notification_action_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
  v_actor_role text;
  v_is_staff boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT role
    INTO v_actor_role
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  SELECT EXISTS (
    SELECT 1
    FROM unnest(regexp_split_to_array(lower(COALESCE(v_actor_role, '')), '\s*,\s*')) AS role_token
    WHERE role_token IN ('admin', 'moderator', 'staff')
  )
  INTO v_is_staff;

  IF NOT v_is_staff THEN
    RAISE EXCEPTION 'Only staff members can create notifications for other users' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.notifications (
    user_id,
    content,
    type,
    priority,
    action_url,
    read
  )
  VALUES (
    target_user_id,
    notification_content,
    notification_type,
    'medium',
    notification_action_url,
    false
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_content_approval_notification(uuid, text, text, text) TO authenticated;

COMMENT ON FUNCTION public.create_content_approval_notification(uuid, text, text, text)
IS 'Allows staff members to create notifications for content approvals/rejections using robust comma-separated role parsing.';
