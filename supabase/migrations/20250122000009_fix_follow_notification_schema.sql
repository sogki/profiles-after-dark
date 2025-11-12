-- Fix all notification functions to use the correct notifications schema (content instead of title/message)

-- Fix notify_new_follower function
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_username text;
  follower_avatar_url text;
BEGIN
  -- Get follower's username and avatar
  SELECT username, avatar_url INTO follower_username, follower_avatar_url
  FROM public.user_profiles
  WHERE user_id = NEW.follower_id;

  -- Create notification for the followed user (using following_id)
  -- Use content instead of title and message
  INSERT INTO public.notifications (user_id, content, type, priority, action_url)
  VALUES (
    NEW.following_id,
    '👤 New Follower: ' || COALESCE(follower_username, 'Someone') || ' started following you!',
    'follow',
    'medium',
    '/user/' || COALESCE(follower_username, '')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Fix create_welcome_notification function
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, content, type, priority)
  VALUES (
    NEW.id,
    'Welcome to Profiles After Dark! 🌙 Thanks for joining our community! Start by uploading your first profile or exploring our gallery.',
    'info',
    'low'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Fix notify_profile_like function to use content instead of title/message
CREATE OR REPLACE FUNCTION notify_profile_like()
RETURNS TRIGGER AS $$
DECLARE
  content_owner_id uuid;
  content_title text;
  liker_username text;
  content_type text;
BEGIN
  -- Determine content type and get owner/title
  IF NEW.profile_id IS NOT NULL THEN
    SELECT user_id, title INTO content_owner_id, content_title
    FROM public.profiles
    WHERE id = NEW.profile_id;
    content_type := 'profile';
  ELSIF NEW.emote_id IS NOT NULL THEN
    SELECT user_id, title INTO content_owner_id, content_title
    FROM public.emotes
    WHERE id = NEW.emote_id;
    content_type := 'emote';
  ELSIF NEW.wallpaper_id IS NOT NULL THEN
    SELECT user_id, title INTO content_owner_id, content_title
    FROM public.wallpapers
    WHERE id = NEW.wallpaper_id;
    content_type := 'wallpaper';
  ELSIF NEW.emoji_combo_id IS NOT NULL THEN
    SELECT user_id, combo_text INTO content_owner_id, content_title
    FROM public.emoji_combos
    WHERE id = NEW.emoji_combo_id;
    content_type := 'emoji_combo';
  ELSE
    RETURN NEW;
  END IF;

  -- Don't notify if user likes their own content
  IF content_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Get liker's username
  SELECT username INTO liker_username
  FROM public.user_profiles
  WHERE user_id = NEW.user_id;

  -- Create notification for the content owner using content instead of title/message
  INSERT INTO public.notifications (user_id, content, type, priority, action_url)
  VALUES (
    content_owner_id,
    CASE content_type
      WHEN 'profile' THEN '❤️ Profile Liked: ' || COALESCE(liker_username, 'Someone') || ' liked your profile' || 
           CASE WHEN content_title IS NOT NULL THEN ' "' || content_title || '"' ELSE '' END
      WHEN 'emote' THEN '❤️ Emote Liked: ' || COALESCE(liker_username, 'Someone') || ' liked your emote' || 
           CASE WHEN content_title IS NOT NULL THEN ' "' || content_title || '"' ELSE '' END
      WHEN 'wallpaper' THEN '❤️ Wallpaper Liked: ' || COALESCE(liker_username, 'Someone') || ' liked your wallpaper' || 
           CASE WHEN content_title IS NOT NULL THEN ' "' || content_title || '"' ELSE '' END
      WHEN 'emoji_combo' THEN '❤️ Emoji Combo Liked: ' || COALESCE(liker_username, 'Someone') || ' liked your emoji combo'
      ELSE '❤️ Content Liked: ' || COALESCE(liker_username, 'Someone') || ' liked your content'
    END,
    'like',
    'medium',
    CASE content_type
      WHEN 'profile' THEN '/gallery/profiles'
      WHEN 'emote' THEN '/gallery/emotes'
      WHEN 'wallpaper' THEN '/gallery/wallpapers'
      WHEN 'emoji_combo' THEN '/gallery/emoji-combos'
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

