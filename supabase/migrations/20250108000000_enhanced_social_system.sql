/*
  # Enhanced Social System

  1. New Tables
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references auth.users)
      - `following_id` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `followers_count` (integer, default 0)
      - `following_count` (integer, default 0)
      - `posts_count` (integer, default 0)
      - `likes_received` (integer, default 0)
      - `updated_at` (timestamp)

  2. Enhanced Features
    - Follow/unfollow functionality
    - User statistics tracking
    - Social notifications
    - Privacy settings
*/

-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  followers_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  posts_count integer DEFAULT 0,
  likes_received integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS follows_created_at_idx ON follows(created_at DESC);
CREATE INDEX IF NOT EXISTS user_stats_user_id_idx ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS user_stats_followers_count_idx ON user_stats(followers_count DESC);

-- Enable Row Level Security
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Follows policies
CREATE POLICY "Users can view all follows"
  ON follows
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own follows"
  ON follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- User stats policies
CREATE POLICY "Users can view all user stats"
  ON user_stats
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own stats"
  ON user_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update user stats when follow is created
CREATE OR REPLACE FUNCTION update_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update follower's following count
  INSERT INTO user_stats (user_id, following_count)
  VALUES (NEW.follower_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    following_count = user_stats.following_count + 1,
    updated_at = now();

  -- Update following user's followers count
  INSERT INTO user_stats (user_id, followers_count)
  VALUES (NEW.following_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    followers_count = user_stats.followers_count + 1,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Function to update user stats when follow is deleted
CREATE OR REPLACE FUNCTION update_unfollow_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update follower's following count
  UPDATE user_stats 
  SET following_count = GREATEST(following_count - 1, 0),
      updated_at = now()
  WHERE user_id = OLD.follower_id;

  -- Update following user's followers count
  UPDATE user_stats 
  SET followers_count = GREATEST(followers_count - 1, 0),
      updated_at = now()
  WHERE user_id = OLD.following_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql security definer;

-- Triggers for follow/unfollow
CREATE TRIGGER update_follow_stats_trigger
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_stats();

CREATE TRIGGER update_unfollow_stats_trigger
  AFTER DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_unfollow_stats();

-- Function to create initial user stats
CREATE OR REPLACE FUNCTION create_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id, followers_count, following_count, posts_count, likes_received)
  VALUES (NEW.id, 0, 0, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Trigger to create user stats for new users
CREATE TRIGGER create_user_stats_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_stats();

-- Function to notify users of new followers
CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_username text;
BEGIN
  -- Get follower's username
  SELECT username INTO follower_username
  FROM user_profiles
  WHERE user_id = NEW.follower_id;

  -- Don't notify if user follows themselves (shouldn't happen due to CHECK constraint)
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for the followed user
  INSERT INTO notifications (user_id, title, message, type, metadata)
  VALUES (
    NEW.following_id,
    'New Follower! 👤',
    COALESCE(follower_username, 'Someone') || ' started following you!',
    'follow',
    jsonb_build_object('follower_id', NEW.follower_id, 'follower_username', follower_username)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql security definer;

-- Trigger for new follower notifications
CREATE TRIGGER notify_new_follower_trigger
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

