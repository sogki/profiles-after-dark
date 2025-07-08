/*
  # Create comprehensive notifications system

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `message` (text)
      - `type` (text) - info, success, warning, error, follow, like, comment, system
      - `read` (boolean, default false)
      - `action_url` (text, nullable)
      - `metadata` (jsonb, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `settings` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own notifications and settings
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'follow', 'like', 'comment', 'system')),
  read boolean DEFAULT false,
  action_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(read);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON user_settings(user_id);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to create welcome notification for new users
CREATE OR REPLACE FUNCTION create_welcome_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.id,
    'Welcome to Profiles After Dark! 🌙',
    'Thanks for joining our community! Start by uploading your first profile or exploring our gallery.',
    'info'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Trigger to create welcome notification
CREATE TRIGGER create_welcome_notification_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();

-- Function to notify users of new followers (example)
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_username text;
BEGIN
  -- Get follower's username
  SELECT username INTO follower_username
  FROM user_profiles
  WHERE user_id = NEW.follower_id;

  -- Create notification for the followed user
  INSERT INTO public.notifications (user_id, title, message, type, metadata)
  VALUES (
    NEW.followed_id,
    'New Follower! 👤',
    COALESCE(follower_username, 'Someone') || ' started following you!',
    'follow',
    jsonb_build_object('follower_id', NEW.follower_id, 'follower_username', follower_username)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Function to notify users of profile likes (example)
CREATE OR REPLACE FUNCTION notify_profile_like()
RETURNS TRIGGER AS $$
DECLARE
  profile_owner_id uuid;
  profile_title text;
  liker_username text;
BEGIN
  -- Get profile owner and title
  SELECT user_id, title INTO profile_owner_id, profile_title
  FROM profiles
  WHERE id = NEW.profile_id;

  -- Get liker's username
  SELECT username INTO liker_username
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- Don't notify if user likes their own profile
  IF profile_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for the profile owner
  INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
  VALUES (
    profile_owner_id,
    'Profile Liked! ❤️',
    COALESCE(liker_username, 'Someone') || ' liked your profile "' || COALESCE(profile_title, 'Untitled') || '"',
    'like',
    '/profile/' || NEW.profile_id,
    jsonb_build_object('profile_id', NEW.profile_id, 'liker_id', NEW.user_id, 'liker_username', liker_username)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Create trigger for profile likes (if favorites table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'favorites') THEN
    CREATE TRIGGER notify_profile_like_trigger
      AFTER INSERT ON favorites
      FOR EACH ROW
      EXECUTE FUNCTION notify_profile_like();
  END IF;
END $$;

-- Function to clean up old notifications (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < now() - interval '30 days'
  AND read = true;
END;
$$ LANGUAGE plpgsql security definer;

-- Create a scheduled job to clean up old notifications (if pg_cron is available)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');