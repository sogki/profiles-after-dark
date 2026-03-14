/*
  # Create Flair System - Customizable Platform for Profile Enhancement
  
  This migration creates the Flair system tables for:
  - User profile customization (animated names, gradients, themes)
  - Custom emotes management
  - Emote sets for channels
  - Profile themes
  - Subscription management
  
  1. New Tables
    - `flair_profiles` - User profile customization data
    - `flair_emotes` - Custom emotes (static and animated)
    - `flair_emote_sets` - Emote sets assigned to channels
    - `flair_profile_themes` - Profile themes
    - `flair_subscriptions` - Subscription tracking
*/

-- Create flair_profile_themes table
CREATE TABLE IF NOT EXISTS flair_profile_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  preview_image_url text,
  theme_data jsonb NOT NULL, -- JSON object with theme configuration
  is_premium boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flair_profiles table
CREATE TABLE IF NOT EXISTS flair_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  custom_display_name text,
  display_name_animation text CHECK (display_name_animation IN ('none', 'glow', 'pulse', 'scroll', 'gradient', 'rainbow')),
  display_name_gradient text, -- JSON string for gradient colors
  pfp_url text,
  banner_url text,
  theme_id uuid REFERENCES flair_profile_themes(id) ON DELETE SET NULL,
  twitch_channel_name text,
  youtube_channel_id text,
  discord_user_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flair_emotes table
CREATE TABLE IF NOT EXISTS flair_emotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  emote_type text NOT NULL CHECK (emote_type IN ('static', 'animated')),
  is_public boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flair_emote_sets table
CREATE TABLE IF NOT EXISTS flair_emote_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  channel_name text NOT NULL, -- Twitch channel name
  channel_type text NOT NULL CHECK (channel_type IN ('twitch', 'youtube', 'discord')),
  emote_ids uuid[] DEFAULT '{}', -- Array of flair_emotes.id
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create flair_subscriptions table
CREATE TABLE IF NOT EXISTS flair_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription_tier text NOT NULL CHECK (subscription_tier IN ('free', 'premium')),
  stripe_subscription_id text,
  stripe_customer_id text,
  status text NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS flair_profiles_user_id_idx ON flair_profiles(user_id);
CREATE INDEX IF NOT EXISTS flair_profiles_theme_id_idx ON flair_profiles(theme_id);
CREATE INDEX IF NOT EXISTS flair_emotes_user_id_idx ON flair_emotes(user_id);
CREATE INDEX IF NOT EXISTS flair_emotes_is_public_idx ON flair_emotes(is_public);
CREATE INDEX IF NOT EXISTS flair_emotes_is_premium_idx ON flair_emotes(is_premium);
CREATE INDEX IF NOT EXISTS flair_emotes_emote_type_idx ON flair_emotes(emote_type);
CREATE INDEX IF NOT EXISTS flair_emotes_tags_idx ON flair_emotes USING GIN(tags);
CREATE INDEX IF NOT EXISTS flair_emote_sets_user_id_idx ON flair_emote_sets(user_id);
CREATE INDEX IF NOT EXISTS flair_emote_sets_channel_name_idx ON flair_emote_sets(channel_name);
CREATE INDEX IF NOT EXISTS flair_emote_sets_is_active_idx ON flair_emote_sets(is_active);
CREATE INDEX IF NOT EXISTS flair_profile_themes_is_premium_idx ON flair_profile_themes(is_premium);
CREATE INDEX IF NOT EXISTS flair_profile_themes_is_active_idx ON flair_profile_themes(is_active);
CREATE INDEX IF NOT EXISTS flair_subscriptions_user_id_idx ON flair_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS flair_subscriptions_status_idx ON flair_subscriptions(status);
CREATE INDEX IF NOT EXISTS flair_subscriptions_subscription_tier_idx ON flair_subscriptions(subscription_tier);

-- Enable Row Level Security
ALTER TABLE flair_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flair_emotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flair_emote_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE flair_profile_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE flair_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flair_profiles
-- Users can view all profiles
DROP POLICY IF EXISTS "Anyone can view flair profiles" ON flair_profiles;
CREATE POLICY "Anyone can view flair profiles"
  ON flair_profiles
  FOR SELECT
  USING (true);

-- Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own flair profile" ON flair_profiles;
CREATE POLICY "Users can insert their own flair profile"
  ON flair_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
DROP POLICY IF EXISTS "Users can update their own flair profile" ON flair_profiles;
CREATE POLICY "Users can update their own flair profile"
  ON flair_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
DROP POLICY IF EXISTS "Users can delete their own flair profile" ON flair_profiles;
CREATE POLICY "Users can delete their own flair profile"
  ON flair_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for flair_emotes
-- Anyone can view public emotes
DROP POLICY IF EXISTS "Anyone can view public flair emotes" ON flair_emotes;
CREATE POLICY "Anyone can view public flair emotes"
  ON flair_emotes
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Users can insert their own emotes
DROP POLICY IF EXISTS "Users can insert their own flair emotes" ON flair_emotes;
CREATE POLICY "Users can insert their own flair emotes"
  ON flair_emotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own emotes
DROP POLICY IF EXISTS "Users can update their own flair emotes" ON flair_emotes;
CREATE POLICY "Users can update their own flair emotes"
  ON flair_emotes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own emotes
DROP POLICY IF EXISTS "Users can delete their own flair emotes" ON flair_emotes;
CREATE POLICY "Users can delete their own flair emotes"
  ON flair_emotes
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for flair_emote_sets
-- Users can view all emote sets
DROP POLICY IF EXISTS "Anyone can view flair emote sets" ON flair_emote_sets;
CREATE POLICY "Anyone can view flair emote sets"
  ON flair_emote_sets
  FOR SELECT
  USING (true);

-- Users can insert their own emote sets
DROP POLICY IF EXISTS "Users can insert their own flair emote sets" ON flair_emote_sets;
CREATE POLICY "Users can insert their own flair emote sets"
  ON flair_emote_sets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own emote sets
DROP POLICY IF EXISTS "Users can update their own flair emote sets" ON flair_emote_sets;
CREATE POLICY "Users can update their own flair emote sets"
  ON flair_emote_sets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own emote sets
DROP POLICY IF EXISTS "Users can delete their own flair emote sets" ON flair_emote_sets;
CREATE POLICY "Users can delete their own flair emote sets"
  ON flair_emote_sets
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for flair_profile_themes
-- Anyone can view active themes
DROP POLICY IF EXISTS "Anyone can view active flair profile themes" ON flair_profile_themes;
CREATE POLICY "Anyone can view active flair profile themes"
  ON flair_profile_themes
  FOR SELECT
  USING (is_active = true);

-- Only staff can manage themes (insert, update, delete)
DROP POLICY IF EXISTS "Staff can manage flair profile themes" ON flair_profile_themes;
CREATE POLICY "Staff can manage flair profile themes"
  ON flair_profile_themes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator', 'staff')
    )
  );

-- RLS Policies for flair_subscriptions
-- Users can view their own subscription
DROP POLICY IF EXISTS "Users can view their own flair subscription" ON flair_subscriptions;
CREATE POLICY "Users can view their own flair subscription"
  ON flair_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription (for free tier)
DROP POLICY IF EXISTS "Users can insert their own flair subscription" ON flair_subscriptions;
CREATE POLICY "Users can insert their own flair subscription"
  ON flair_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
DROP POLICY IF EXISTS "Users can update their own flair subscription" ON flair_subscriptions;
CREATE POLICY "Users can update their own flair subscription"
  ON flair_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically create a flair profile when user signs up
CREATE OR REPLACE FUNCTION create_flair_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.flair_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create free subscription
  INSERT INTO public.flair_subscriptions (user_id, subscription_tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create flair profile on user signup
DROP TRIGGER IF EXISTS create_flair_profile_trigger ON auth.users;
CREATE TRIGGER create_flair_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_flair_profile();

-- Function to check if user has premium subscription
CREATE OR REPLACE FUNCTION is_premium_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_tier TEXT;
  v_status TEXT;
BEGIN
  SELECT subscription_tier, status INTO v_subscription_tier, v_status
  FROM flair_subscriptions
  WHERE user_id = p_user_id;
  
  RETURN v_subscription_tier = 'premium' AND v_status = 'active';
END;
$$;

-- Function to get user's emote limit based on subscription
CREATE OR REPLACE FUNCTION get_emote_limit(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_tier TEXT;
  v_status TEXT;
BEGIN
  SELECT subscription_tier, status INTO v_subscription_tier, v_status
  FROM flair_subscriptions
  WHERE user_id = p_user_id;
  
  IF v_subscription_tier = 'premium' AND v_status = 'active' THEN
    RETURN 999999; -- Unlimited for premium
  ELSE
    RETURN 1; -- Free tier gets 1 emote
  END IF;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_flair_profiles_updated_at
  BEFORE UPDATE ON flair_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flair_emotes_updated_at
  BEFORE UPDATE ON flair_emotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flair_emote_sets_updated_at
  BEFORE UPDATE ON flair_emote_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flair_profile_themes_updated_at
  BEFORE UPDATE ON flair_profile_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flair_subscriptions_updated_at
  BEFORE UPDATE ON flair_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default free theme
INSERT INTO flair_profile_themes (name, description, theme_data, is_premium, is_active)
VALUES (
  'Default',
  'The default Flair theme',
  '{"colors": {"primary": "#6366f1", "secondary": "#8b5cf6", "background": "#1e1e2e"}, "effects": []}'::jsonb,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_premium_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_emote_limit TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE flair_profiles IS 'Stores user profile customization data including animated names, gradients, and themes';
COMMENT ON TABLE flair_emotes IS 'Stores custom emotes uploaded by users (static and animated)';
COMMENT ON TABLE flair_emote_sets IS 'Stores emote sets assigned to specific channels (Twitch, YouTube, Discord)';
COMMENT ON TABLE flair_profile_themes IS 'Stores profile themes available to users';
COMMENT ON TABLE flair_subscriptions IS 'Tracks user subscriptions (free or premium)';
COMMENT ON FUNCTION is_premium_user IS 'Checks if a user has an active premium subscription';
COMMENT ON FUNCTION get_emote_limit IS 'Returns the emote upload limit for a user based on their subscription tier';

