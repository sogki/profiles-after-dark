-- Fix favorites table constraint to support emotes and wallpapers
-- This migration updates the favorites table to allow multiple content types

-- First, make profile_id nullable (it was originally NOT NULL)
ALTER TABLE public.favorites 
  ALTER COLUMN profile_id DROP NOT NULL;

-- Drop the old unique constraint if it exists (it was on profile_id, user_id)
ALTER TABLE public.favorites 
  DROP CONSTRAINT IF EXISTS favorites_profile_id_user_id_key;

-- Add emoji_combo_id column if it doesn't exist
ALTER TABLE public.favorites 
  ADD COLUMN IF NOT EXISTS emoji_combo_id UUID REFERENCES public.emoji_combos(id) ON DELETE CASCADE;

-- Add content_type column if it doesn't exist (for easier querying)
ALTER TABLE public.favorites 
  ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Drop existing check constraint if it exists
ALTER TABLE public.favorites 
  DROP CONSTRAINT IF EXISTS favorites_content_check;

-- Create a new check constraint that ensures exactly one content type is set
ALTER TABLE public.favorites 
  ADD CONSTRAINT favorites_content_check CHECK (
    (
      (profile_id IS NOT NULL)::int +
      (emote_id IS NOT NULL)::int +
      (wallpaper_id IS NOT NULL)::int +
      (emoji_combo_id IS NOT NULL)::int
    ) = 1
  );

-- Create unique constraints for each content type to prevent duplicates
-- Profile favorites
CREATE UNIQUE INDEX IF NOT EXISTS favorites_profile_user_unique 
  ON public.favorites(user_id, profile_id) 
  WHERE profile_id IS NOT NULL;

-- Emote favorites
CREATE UNIQUE INDEX IF NOT EXISTS favorites_emote_user_unique 
  ON public.favorites(user_id, emote_id) 
  WHERE emote_id IS NOT NULL;

-- Wallpaper favorites
CREATE UNIQUE INDEX IF NOT EXISTS favorites_wallpaper_user_unique 
  ON public.favorites(user_id, wallpaper_id) 
  WHERE wallpaper_id IS NOT NULL;

-- Emoji combo favorites
CREATE UNIQUE INDEX IF NOT EXISTS favorites_emoji_combo_user_unique 
  ON public.favorites(user_id, emoji_combo_id) 
  WHERE emoji_combo_id IS NOT NULL;

-- Update content_type based on which ID is set (for easier querying)
CREATE OR REPLACE FUNCTION update_favorites_content_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_id IS NOT NULL THEN
    NEW.content_type := 'profile';
  ELSIF NEW.emote_id IS NOT NULL THEN
    NEW.content_type := 'emote';
  ELSIF NEW.wallpaper_id IS NOT NULL THEN
    NEW.content_type := 'wallpaper';
  ELSIF NEW.emoji_combo_id IS NOT NULL THEN
    NEW.content_type := 'emoji_combo';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_favorites_content_type_trigger ON public.favorites;

-- Create trigger to auto-update content_type
CREATE TRIGGER update_favorites_content_type_trigger
  BEFORE INSERT OR UPDATE ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_favorites_content_type();

-- Update existing rows to set content_type
UPDATE public.favorites 
SET content_type = 'profile' 
WHERE profile_id IS NOT NULL AND content_type IS NULL;

UPDATE public.favorites 
SET content_type = 'emote' 
WHERE emote_id IS NOT NULL AND content_type IS NULL;

UPDATE public.favorites 
SET content_type = 'wallpaper' 
WHERE wallpaper_id IS NOT NULL AND content_type IS NULL;

UPDATE public.favorites 
SET content_type = 'emoji_combo' 
WHERE emoji_combo_id IS NOT NULL AND content_type IS NULL;

-- Update the notify_profile_like function to handle all content types
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
    -- Get profile owner and title
    SELECT user_id, title INTO content_owner_id, content_title
    FROM profiles
    WHERE id = NEW.profile_id;
    content_type := 'profile';
  ELSIF NEW.emote_id IS NOT NULL THEN
    -- Get emote owner and title
    SELECT user_id, title INTO content_owner_id, content_title
    FROM emotes
    WHERE id = NEW.emote_id;
    content_type := 'emote';
  ELSIF NEW.wallpaper_id IS NOT NULL THEN
    -- Get wallpaper owner and title
    SELECT user_id, title INTO content_owner_id, content_title
    FROM wallpapers
    WHERE id = NEW.wallpaper_id;
    content_type := 'wallpaper';
  ELSIF NEW.emoji_combo_id IS NOT NULL THEN
    -- Get emoji combo owner and name
    SELECT user_id, name INTO content_owner_id, content_title
    FROM emoji_combos
    WHERE id = NEW.emoji_combo_id;
    content_type := 'emoji_combo';
  ELSE
    -- No content type set, skip notification
    RETURN NEW;
  END IF;

  -- Get liker's username
  SELECT username INTO liker_username
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- Don't notify if user favorites their own content
  IF content_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Only create notification if notifications table has title column
  -- Check if title column exists before inserting
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'title'
  ) THEN
    -- Create notification for the content owner
    INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
    VALUES (
      content_owner_id,
      CASE content_type
        WHEN 'profile' THEN 'Profile Liked! ❤️'
        WHEN 'emote' THEN 'Emote Liked! ❤️'
        WHEN 'wallpaper' THEN 'Wallpaper Liked! ❤️'
        WHEN 'emoji_combo' THEN 'Emoji Combo Liked! ❤️'
        ELSE 'Content Liked! ❤️'
      END,
      COALESCE(liker_username, 'Someone') || ' liked your ' || content_type || 
      CASE WHEN content_title IS NOT NULL THEN ' "' || content_title || '"' ELSE '' END,
      'like',
      CASE content_type
        WHEN 'profile' THEN '/gallery/profiles'
        WHEN 'emote' THEN '/gallery/emotes'
        WHEN 'wallpaper' THEN '/gallery/wallpapers'
        WHEN 'emoji_combo' THEN '/gallery/emoji-combos'
        ELSE NULL
      END,
      jsonb_build_object(
        'content_type', content_type,
        'content_id', COALESCE(NEW.profile_id, NEW.emote_id, NEW.wallpaper_id, NEW.emoji_combo_id),
        'liker_id', NEW.user_id,
        'liker_username', liker_username
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

