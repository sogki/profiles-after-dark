-- Update welcome notification to mention the member badge
-- This migration updates the create_welcome_notification function to include a welcoming message about the member badge

-- Update the create_welcome_notification function
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Get username from user_profiles (it should exist since create_user_profile runs first)
  SELECT username INTO v_username
  FROM public.user_profiles
  WHERE user_id = NEW.id
  LIMIT 1;
  
  -- Check which notification schema is being used (title/message vs content)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'title'
  ) THEN
    -- Use title/message schema
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      read,
      action_url,
      metadata
    ) VALUES (
      NEW.id,
      '🎉 Welcome to Profiles After Dark!',
      'Here''s a gift from us to you: Your own Official Member badge! Start exploring and uploading content to unlock more achievements.',
      'system',
      false,
      COALESCE('/user/' || v_username, '/profile'),
      jsonb_build_object(
        'type', 'welcome',
        'badge_type', 'member',
        'created_at', now()
      )
    );
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'content'
  ) THEN
    -- Use content schema
    INSERT INTO public.notifications (
      user_id,
      content,
      type,
      priority,
      read,
      action_url,
      metadata
    ) VALUES (
      NEW.id,
      '🎉 Welcome to Profiles After Dark! Here''s a gift from us to you: Your own Official Member badge! Start exploring and uploading content to unlock more achievements.',
      'system',
      'high',
      false,
      COALESCE('/user/' || v_username, '/profile'),
      jsonb_build_object(
        'type', 'welcome',
        'badge_type', 'member',
        'created_at', now()
      )
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't break user creation
    RAISE WARNING 'Failed to create welcome notification for new user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the welcome notification
COMMENT ON FUNCTION create_welcome_notification IS 'Creates a welcoming notification for new users when they sign up, mentioning their Official Member badge.';

