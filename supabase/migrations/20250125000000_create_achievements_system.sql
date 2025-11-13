/*
  # Create comprehensive achievements/badges system
  
  1. New Tables
    - `badges`
      - `id` (uuid, primary key)
      - `code` (text, unique) - unique identifier for the badge (e.g., 'first_upload', 'first_follow')
      - `name` (text) - display name
      - `description` (text) - what the badge is for
      - `image_url` (text) - badge icon/image
      - `category` (text) - category of achievement (content, social, milestone, special)
      - `rarity` (text) - common, uncommon, rare, epic, legendary
      - `is_active` (boolean) - whether badge can be earned
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_badges`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `badge_id` (uuid, references badges)
      - `unlocked_at` (timestamp)
      - `metadata` (jsonb) - optional metadata about how it was unlocked
      - UNIQUE(user_id, badge_id)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for users to view badges and their own achievements
    - Add policies for system to award badges (via triggers/functions)
  
  3. Functions & Triggers
    - Function to check and award achievements
    - Triggers to automatically check achievements on key actions
    - Function to notify users when they unlock badges
  
  4. Notifications
    - Updates notifications table to support 'achievement' type
    - Creates notifications when users unlock badges
*/

-- Update notifications table to support 'achievement' notification type
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Check if notifications table exists and has a type column with CHECK constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications' 
    AND column_name = 'type'
  ) THEN
    -- Find and drop existing CHECK constraint on type column
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%type%'
    LIMIT 1;
    
    IF constraint_name IS NOT NULL THEN
      EXECUTE 'ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name);
    END IF;
    
    -- Add new CHECK constraint with 'achievement' type included
    BEGIN
      ALTER TABLE public.notifications 
      ADD CONSTRAINT notifications_type_check 
      CHECK (type IN ('info', 'success', 'warning', 'error', 'follow', 'like', 'comment', 'system', 'achievement'));
    EXCEPTION
      WHEN duplicate_object THEN
        -- Constraint might already exist with achievement type, that's fine
        NULL;
    END;
  END IF;
END $$;

-- Badges table already exists with: id, name, icon, description, created_at, image_url
-- Add missing columns to existing badges table
DO $$ 
BEGIN
  -- Add code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'code'
  ) THEN
    ALTER TABLE public.badges ADD COLUMN code text UNIQUE;
  END IF;

  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.badges ADD COLUMN category text CHECK (category IN ('content', 'social', 'milestone', 'special'));
  END IF;

  -- Add rarity column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'rarity'
  ) THEN
    ALTER TABLE public.badges ADD COLUMN rarity text DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'));
  END IF;

  -- Add is_active column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.badges ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.badges ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Ensure icon column exists (use image_url if icon doesn't exist, or vice versa)
  -- If icon exists but image_url doesn't, we'll use icon as the primary image
  -- If both exist, we'll prefer image_url but keep icon for compatibility
END $$;

-- Create user_badges table (junction table) or add missing columns if it exists
-- Existing table has: user_id, badge_id
CREATE TABLE IF NOT EXISTS user_badges (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(user_id, badge_id)
);

-- Ensure the foreign key constraint is correct (drop and recreate to point to auth.users)
DO $$
BEGIN
  -- Drop existing foreign key constraint if it exists (regardless of what it points to)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = 'user_badges'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND tc.constraint_name = 'user_badges_user_id_fkey'
  ) THEN
    ALTER TABLE user_badges DROP CONSTRAINT user_badges_user_id_fkey;
  END IF;
  
  -- Clean up orphaned rows: delete any user_badges where user_id doesn't exist in auth.users
  DELETE FROM user_badges
  WHERE user_id NOT IN (SELECT id FROM auth.users);
  
  -- Add the correct foreign key constraint pointing to auth.users
  ALTER TABLE user_badges 
  ADD CONSTRAINT user_badges_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN
    -- Constraint already exists, do nothing
    NULL;
END $$;

-- Add missing columns to existing user_badges table
DO $$ 
BEGIN
  -- Add id column if it doesn't exist (for primary key)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_badges' 
    AND column_name = 'id'
  ) THEN
    -- Add as regular column first
    ALTER TABLE public.user_badges ADD COLUMN id uuid DEFAULT gen_random_uuid();
    -- Update existing rows to have IDs
    UPDATE public.user_badges SET id = gen_random_uuid() WHERE id IS NULL;
    -- Make it NOT NULL
    ALTER TABLE public.user_badges ALTER COLUMN id SET NOT NULL;
    -- Add primary key constraint if one doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'user_badges_pkey'
    ) THEN
      ALTER TABLE public.user_badges ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);
    END IF;
  END IF;

  -- Add unlocked_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_badges' 
    AND column_name = 'unlocked_at'
  ) THEN
    ALTER TABLE public.user_badges ADD COLUMN unlocked_at timestamptz DEFAULT now();
    -- Set default value for existing rows
    UPDATE public.user_badges SET unlocked_at = now() WHERE unlocked_at IS NULL;
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_badges' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.user_badges ADD COLUMN metadata jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create badge_progress table for tracking progress towards badges
CREATE TABLE IF NOT EXISTS badge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id uuid REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  target_progress INTEGER NOT NULL,
  progress_data jsonb DEFAULT '{}',
  last_updated timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS badges_code_idx ON badges(code);
CREATE INDEX IF NOT EXISTS badges_category_idx ON badges(category);
CREATE INDEX IF NOT EXISTS badges_rarity_idx ON badges(rarity);
CREATE INDEX IF NOT EXISTS badges_is_active_idx ON badges(is_active);
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS user_badges_badge_id_idx ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS user_badges_unlocked_at_idx ON user_badges(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS badge_progress_user_id_idx ON badge_progress(user_id);
CREATE INDEX IF NOT EXISTS badge_progress_badge_id_idx ON badge_progress(badge_id);

-- Enable Row Level Security
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for badges (public read access)
DROP POLICY IF EXISTS "Anyone can view active badges" ON badges;
CREATE POLICY "Anyone can view active badges"
  ON badges
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_badges (users can view all, but only system can insert)
DROP POLICY IF EXISTS "Anyone can view user badges" ON user_badges;
CREATE POLICY "Anyone can view user badges"
  ON user_badges
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own badges (for manual awards by staff)
DROP POLICY IF EXISTS "Staff can award badges" ON user_badges;
CREATE POLICY "Staff can award badges"
  ON user_badges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator', 'staff')
    )
  );

-- RLS Policies for badge_progress
DROP POLICY IF EXISTS "Users can view all badge progress" ON badge_progress;
CREATE POLICY "Users can view all badge progress"
  ON badge_progress
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "System can update badge progress" ON badge_progress;
CREATE POLICY "System can update badge progress"
  ON badge_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to award a badge to a user (with duplicate check)
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_badge_code TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge_id UUID;
  v_user_badge_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    -- User doesn't exist, return NULL instead of raising exception
    -- This prevents content uploads from failing due to badge system issues
    RETURN NULL;
  END IF;
  
  -- Get badge ID by code
  SELECT id INTO v_badge_id
  FROM badges
  WHERE code = p_badge_code AND is_active = true;
  
  IF v_badge_id IS NULL THEN
    -- Badge not found, return NULL instead of raising exception
    RETURN NULL;
  END IF;
  
  -- Check if user already has this badge
  SELECT id INTO v_user_badge_id
  FROM user_badges
  WHERE user_id = p_user_id AND badge_id = v_badge_id;
  
  IF v_user_badge_id IS NOT NULL THEN
    -- User already has this badge, return existing ID
    RETURN v_user_badge_id;
  END IF;
  
  -- Award the badge (with error handling)
  BEGIN
    INSERT INTO user_badges (user_id, badge_id, metadata)
    VALUES (p_user_id, v_badge_id, p_metadata)
    RETURNING id INTO v_user_badge_id;
  EXCEPTION
    WHEN foreign_key_violation THEN
      -- Foreign key constraint violation, return NULL instead of failing
      RETURN NULL;
    WHEN OTHERS THEN
      -- Any other error, return NULL instead of failing
      RETURN NULL;
  END;
  
  -- Create notification for the user when they unlock a badge
  -- This uses SECURITY DEFINER so it can bypass RLS policies
  DECLARE
    v_badge_name TEXT;
    v_username TEXT;
    v_notification_type TEXT := 'system';
  BEGIN
    -- Get badge name
    SELECT name INTO v_badge_name
    FROM badges
    WHERE id = v_badge_id;
    
    -- Get username for action URL
    SELECT username INTO v_username
    FROM user_profiles
    WHERE user_id = p_user_id
    LIMIT 1;
    
    -- Try to insert notification with title/message schema (standard schema)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'title'
    ) THEN
      -- Check if 'achievement' type is allowed, otherwise use 'system'
      BEGIN
        INSERT INTO public.notifications (
          user_id,
          title,
          message,
          type,
          read,
          action_url,
          metadata
        ) VALUES (
          p_user_id,
          '🏆 Achievement Unlocked!',
          COALESCE('You unlocked the "' || v_badge_name || '" badge!', 'You unlocked a new achievement!'),
          'achievement',
          false,
          COALESCE('/user/' || v_username, '/profile'),
          jsonb_build_object(
            'badge_id', v_badge_id, 
            'badge_code', p_badge_code,
            'badge_name', v_badge_name,
            'type', 'badge_unlock',
            'unlocked_at', now()
          )
        );
      EXCEPTION
        WHEN check_violation THEN
          -- If 'achievement' type doesn't exist, use 'system' instead
          INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            read,
            action_url,
            metadata
          ) VALUES (
            p_user_id,
            '🏆 Achievement Unlocked!',
            COALESCE('You unlocked the "' || v_badge_name || '" badge!', 'You unlocked a new achievement!'),
            'system',
            false,
            COALESCE('/user/' || v_username, '/profile'),
            jsonb_build_object(
              'badge_id', v_badge_id, 
              'badge_code', p_badge_code,
              'badge_name', v_badge_name,
              'type', 'badge_unlock',
              'unlocked_at', now()
            )
          );
      END;
    -- Try with content schema (alternative schema)
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications' 
      AND column_name = 'content'
    ) THEN
      BEGIN
        INSERT INTO public.notifications (
          user_id,
          content,
          type,
          read,
          action_url,
          metadata
        ) VALUES (
          p_user_id,
          COALESCE('🏆 Achievement Unlocked! You unlocked the "' || v_badge_name || '" badge!', '🏆 Achievement Unlocked!'),
          'achievement',
          false,
          COALESCE('/user/' || v_username, '/profile'),
          jsonb_build_object(
            'badge_id', v_badge_id, 
            'badge_code', p_badge_code,
            'badge_name', v_badge_name,
            'type', 'badge_unlock',
            'unlocked_at', now()
          )
        );
      EXCEPTION
        WHEN check_violation THEN
          -- If 'achievement' type doesn't exist, use 'system' instead
          INSERT INTO public.notifications (
            user_id,
            content,
            type,
            read,
            action_url,
            metadata
          ) VALUES (
            p_user_id,
            COALESCE('🏆 Achievement Unlocked! You unlocked the "' || v_badge_name || '" badge!', '🏆 Achievement Unlocked!'),
            'system',
            false,
            COALESCE('/user/' || v_username, '/profile'),
            jsonb_build_object(
              'badge_id', v_badge_id, 
              'badge_code', p_badge_code,
              'badge_name', v_badge_name,
              'type', 'badge_unlock',
              'unlocked_at', now()
            )
          );
      END;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't break badge awarding
      -- The notification is nice-to-have, but badge awarding is critical
      RAISE WARNING 'Failed to create notification for badge unlock: %', SQLERRM;
  END;
  
  RETURN v_user_badge_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION award_badge TO authenticated;

-- Function to check and award content-related achievements
CREATE OR REPLACE FUNCTION check_content_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_count INTEGER;
  v_approved_content_count INTEGER;
BEGIN
  -- Count total content uploads
  SELECT COUNT(*) INTO v_content_count
  FROM (
    SELECT id FROM profiles WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM profile_pairs WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM emotes WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM wallpapers WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM emoji_combos WHERE user_id = p_user_id
  ) AS all_content;
  
  -- Count approved content
  SELECT COUNT(*) INTO v_approved_content_count
  FROM (
    SELECT id FROM profiles WHERE user_id = p_user_id AND status = 'approved'
    UNION ALL
    SELECT id FROM profile_pairs WHERE user_id = p_user_id AND status = 'approved'
    UNION ALL
    SELECT id FROM emotes WHERE user_id = p_user_id AND status = 'approved'
    UNION ALL
    SELECT id FROM wallpapers WHERE user_id = p_user_id AND status = 'approved'
    UNION ALL
    SELECT id FROM emoji_combos WHERE user_id = p_user_id AND status = 'approved'
  ) AS approved_content;
  
  -- Award "First Upload" badge
  IF v_content_count >= 1 THEN
    PERFORM award_badge(p_user_id, 'first_upload', jsonb_build_object('content_count', v_content_count));
  END IF;
  
  -- Award "First Approved Content" badge
  IF v_approved_content_count >= 1 THEN
    PERFORM award_badge(p_user_id, 'first_approved', jsonb_build_object('approved_count', v_approved_content_count));
  END IF;
  
  -- Award milestone badges
  IF v_approved_content_count >= 10 THEN
    PERFORM award_badge(p_user_id, 'content_creator_10', jsonb_build_object('approved_count', v_approved_content_count));
  END IF;
  
  IF v_approved_content_count >= 50 THEN
    PERFORM award_badge(p_user_id, 'content_creator_50', jsonb_build_object('approved_count', v_approved_content_count));
  END IF;
  
  IF v_approved_content_count >= 100 THEN
    PERFORM award_badge(p_user_id, 'content_creator_100', jsonb_build_object('approved_count', v_approved_content_count));
  END IF;
END;
$$;

-- Function to check and award social achievements
CREATE OR REPLACE FUNCTION check_social_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_following_count INTEGER;
  v_followers_count INTEGER;
  v_mutual_follows_count INTEGER;
BEGIN
  -- Count following
  SELECT COUNT(*) INTO v_following_count
  FROM follows
  WHERE follower_id = p_user_id;
  
  -- Count followers
  SELECT COUNT(*) INTO v_followers_count
  FROM follows
  WHERE following_id = p_user_id;
  
  -- Count mutual follows (users who follow each other)
  SELECT COUNT(*) INTO v_mutual_follows_count
  FROM follows f1
  INNER JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
  WHERE f1.follower_id = p_user_id;
  
  -- Award "First Follow" badge
  IF v_following_count >= 1 THEN
    PERFORM award_badge(p_user_id, 'first_follow', jsonb_build_object('following_count', v_following_count));
  END IF;
  
  -- Award "First Follower" badge
  IF v_followers_count >= 1 THEN
    PERFORM award_badge(p_user_id, 'first_follower', jsonb_build_object('followers_count', v_followers_count));
  END IF;
  
  -- Award "First Mutual Friend" badge
  IF v_mutual_follows_count >= 1 THEN
    PERFORM award_badge(p_user_id, 'first_mutual', jsonb_build_object('mutual_count', v_mutual_follows_count));
  END IF;
  
  -- Award milestone badges
  IF v_followers_count >= 10 THEN
    PERFORM award_badge(p_user_id, 'popular_10', jsonb_build_object('followers_count', v_followers_count));
  END IF;
  
  IF v_followers_count >= 50 THEN
    PERFORM award_badge(p_user_id, 'popular_50', jsonb_build_object('followers_count', v_followers_count));
  END IF;
  
  IF v_followers_count >= 100 THEN
    PERFORM award_badge(p_user_id, 'popular_100', jsonb_build_object('followers_count', v_followers_count));
  END IF;
END;
$$;

-- Function to check and award engagement achievements (downloads, favorites)
CREATE OR REPLACE FUNCTION check_engagement_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_downloads INTEGER;
  v_total_favorites INTEGER;
  v_user_downloads INTEGER;
  v_user_favorites INTEGER;
BEGIN
  -- Count total downloads of user's content
  SELECT COALESCE(SUM(download_count), 0) INTO v_total_downloads
  FROM (
    SELECT download_count FROM profiles WHERE user_id = p_user_id AND status = 'approved'
    UNION ALL
    SELECT download_count FROM profile_pairs WHERE user_id = p_user_id AND status = 'approved'
    UNION ALL
    SELECT download_count FROM emotes WHERE user_id = p_user_id AND status = 'approved'
    UNION ALL
    SELECT download_count FROM wallpapers WHERE user_id = p_user_id AND status = 'approved'
    UNION ALL
    SELECT download_count FROM emoji_combos WHERE user_id = p_user_id AND status = 'approved'
  ) AS all_downloads;
  
  -- Count total favorites of user's content
  SELECT COUNT(*) INTO v_total_favorites
  FROM favorites f
  INNER JOIN (
    SELECT id FROM profiles WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM profile_pairs WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM emotes WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM wallpapers WHERE user_id = p_user_id
    UNION ALL
    SELECT id FROM emoji_combos WHERE user_id = p_user_id
  ) AS user_content ON f.profile_id = user_content.id;
  
  -- Count downloads by user
  SELECT COUNT(*) INTO v_user_downloads
  FROM downloads
  WHERE user_id = p_user_id;
  
  -- Count favorites by user
  SELECT COUNT(*) INTO v_user_favorites
  FROM favorites
  WHERE user_id = p_user_id;
  
  -- Award download milestones
  IF v_total_downloads >= 1 THEN
    PERFORM award_badge(p_user_id, 'first_download', jsonb_build_object('total_downloads', v_total_downloads));
  END IF;
  
  IF v_total_downloads >= 100 THEN
    PERFORM award_badge(p_user_id, 'popular_content_100', jsonb_build_object('total_downloads', v_total_downloads));
  END IF;
  
  IF v_total_downloads >= 500 THEN
    PERFORM award_badge(p_user_id, 'popular_content_500', jsonb_build_object('total_downloads', v_total_downloads));
  END IF;
  
  IF v_total_downloads >= 1000 THEN
    PERFORM award_badge(p_user_id, 'viral_content', jsonb_build_object('total_downloads', v_total_downloads));
  END IF;
  
  -- Award favorite milestones
  IF v_total_favorites >= 1 THEN
    PERFORM award_badge(p_user_id, 'first_favorite', jsonb_build_object('total_favorites', v_total_favorites));
  END IF;
  
  IF v_total_favorites >= 50 THEN
    PERFORM award_badge(p_user_id, 'beloved_creator_50', jsonb_build_object('total_favorites', v_total_favorites));
  END IF;
  
  IF v_total_favorites >= 200 THEN
    PERFORM award_badge(p_user_id, 'beloved_creator_200', jsonb_build_object('total_favorites', v_total_favorites));
  END IF;
  
  -- Award user engagement badges
  IF v_user_downloads >= 10 THEN
    PERFORM award_badge(p_user_id, 'active_downloader_10', jsonb_build_object('downloads', v_user_downloads));
  END IF;
  
  IF v_user_favorites >= 10 THEN
    PERFORM award_badge(p_user_id, 'curator_10', jsonb_build_object('favorites', v_user_favorites));
  END IF;
END;
$$;

-- Function to check and award milestone achievements (account age, etc.)
CREATE OR REPLACE FUNCTION check_milestone_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_account_age_days INTEGER;
  v_user_created_at TIMESTAMPTZ;
BEGIN
  -- Get account creation date - try auth.users first (most accurate), fallback to user_profiles
  SELECT created_at INTO v_user_created_at
  FROM auth.users
  WHERE id = p_user_id;
  
  -- If not found in auth.users, try user_profiles
  IF v_user_created_at IS NULL THEN
    SELECT created_at INTO v_user_created_at
    FROM user_profiles
    WHERE user_id = p_user_id;
  END IF;
  
  IF v_user_created_at IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate account age in days (using FLOOR to get whole days)
  v_account_age_days := FLOOR(EXTRACT(EPOCH FROM (NOW() - v_user_created_at)) / 86400);
  
  -- Award account age milestones (check all milestones up to current age)
  -- This ensures users get all badges they qualify for, not just the highest one
  IF v_account_age_days >= 7 THEN
    PERFORM award_badge(p_user_id, 'week_old', jsonb_build_object('days', v_account_age_days));
  END IF;
  
  IF v_account_age_days >= 30 THEN
    PERFORM award_badge(p_user_id, 'month_old', jsonb_build_object('days', v_account_age_days));
  END IF;
  
  IF v_account_age_days >= 90 THEN
    PERFORM award_badge(p_user_id, 'seasoned_member', jsonb_build_object('days', v_account_age_days));
  END IF;
  
  IF v_account_age_days >= 180 THEN
    PERFORM award_badge(p_user_id, 'veteran', jsonb_build_object('days', v_account_age_days));
  END IF;
  
  IF v_account_age_days >= 365 THEN
    PERFORM award_badge(p_user_id, 'one_year_club', jsonb_build_object('days', v_account_age_days));
  END IF;
END;
$$;

-- Function to check and award special/role-based achievements
-- Supports comma-separated roles like "admin,verified" or "staff,verified"
CREATE OR REPLACE FUNCTION check_special_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_is_active BOOLEAN;
  v_admin_badge_id UUID;
  v_staff_badge_id UUID;
  v_member_badge_id UUID;
  v_verified_badge_id UUID;
  v_bug_tester_badge_id UUID;
  v_role_array TEXT[];
  v_role TEXT;
  v_has_admin BOOLEAN := false;
  v_has_staff BOOLEAN := false;
  v_has_moderator BOOLEAN := false;
  v_has_verified BOOLEAN := false;
  v_has_bug_tester BOOLEAN := false;
BEGIN
  -- Get user role and active status from user_profiles
  SELECT role, COALESCE(is_active, true) INTO v_user_role, v_is_active
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  IF v_user_role IS NULL THEN
    RETURN;
  END IF;
  
  -- Get badge IDs for role badges
  SELECT id INTO v_admin_badge_id FROM badges WHERE code = 'admin' AND is_active = true;
  SELECT id INTO v_staff_badge_id FROM badges WHERE code = 'staff' AND is_active = true;
  SELECT id INTO v_member_badge_id FROM badges WHERE code = 'member' AND is_active = true;
  SELECT id INTO v_verified_badge_id FROM badges WHERE code = 'verified' AND is_active = true;
  SELECT id INTO v_bug_tester_badge_id FROM badges WHERE code = 'bug_tester' AND is_active = true;
  
  -- Parse comma-separated roles (trim whitespace and convert to lowercase for comparison)
  v_role_array := string_to_array(trim(v_user_role), ',');
  
  -- Check which roles are present
  FOREACH v_role IN ARRAY v_role_array
  LOOP
    v_role := trim(lower(v_role));
    IF v_role = 'admin' THEN
      v_has_admin := true;
    ELSIF v_role = 'staff' THEN
      v_has_staff := true;
    ELSIF v_role = 'moderator' THEN
      v_has_moderator := true;
    ELSIF v_role = 'verified' THEN
      v_has_verified := true;
    ELSIF v_role = 'bug_tester' OR v_role = 'bugtester' THEN
      v_has_bug_tester := true;
    END IF;
    -- Note: 'member' and 'user' roles are handled in the ELSE clause below
  END LOOP;
  
  -- Award role-based badges (only for active users)
  IF v_is_active THEN
    -- Award admin badge if admin role is present
    IF v_has_admin THEN
      PERFORM award_badge(p_user_id, 'admin', jsonb_build_object('role', v_user_role));
      -- Remove staff and member badges if admin has them
      IF v_staff_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = p_user_id AND badge_id = v_staff_badge_id;
      END IF;
      IF v_member_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = p_user_id AND badge_id = v_member_badge_id;
      END IF;
    -- Award staff badge if staff or moderator role is present (and not admin)
    ELSIF v_has_staff OR v_has_moderator THEN
      PERFORM award_badge(p_user_id, 'staff', jsonb_build_object('role', v_user_role));
      -- Remove member badge if staff has it
      IF v_member_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = p_user_id AND badge_id = v_member_badge_id;
      END IF;
    -- Regular users (member, user, or no role) get member badge
    ELSE
      PERFORM award_badge(p_user_id, 'member', jsonb_build_object('member', true));
      -- Remove admin and staff badges if regular user has them
      IF v_admin_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = p_user_id AND badge_id = v_admin_badge_id;
      END IF;
      IF v_staff_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = p_user_id AND badge_id = v_staff_badge_id;
      END IF;
    END IF;
    
    -- Award verified badge if verified role is present
    IF v_has_verified AND v_verified_badge_id IS NOT NULL THEN
      PERFORM award_badge(p_user_id, 'verified', jsonb_build_object('role', v_user_role));
    END IF;
    
    -- Award bug_tester badge if bug_tester role is present
    IF v_has_bug_tester AND v_bug_tester_badge_id IS NOT NULL THEN
      PERFORM award_badge(p_user_id, 'bug_tester', jsonb_build_object('role', v_user_role));
    END IF;
  END IF;
END;
$$;

-- Function to check all achievements for a user
CREATE OR REPLACE FUNCTION check_all_achievements(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check all achievement types
  PERFORM check_content_achievements(p_user_id);
  PERFORM check_social_achievements(p_user_id);
  PERFORM check_engagement_achievements(p_user_id);
  PERFORM check_milestone_achievements(p_user_id);  -- Now included in all checks
  PERFORM check_special_achievements(p_user_id);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_content_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION check_social_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION check_engagement_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION check_milestone_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION check_all_achievements TO authenticated;

-- Trigger function to check achievements after content upload
CREATE OR REPLACE FUNCTION trigger_check_content_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check achievements for the user who uploaded content
  PERFORM check_content_achievements(NEW.user_id);
  RETURN NEW;
END;
$$;

-- Triggers for content uploads
DROP TRIGGER IF EXISTS check_achievements_on_profile_upload ON profiles;
CREATE TRIGGER check_achievements_on_profile_upload
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_content_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_profile_pair_upload ON profile_pairs;
CREATE TRIGGER check_achievements_on_profile_pair_upload
  AFTER INSERT ON profile_pairs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_content_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_emote_upload ON emotes;
CREATE TRIGGER check_achievements_on_emote_upload
  AFTER INSERT ON emotes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_content_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_wallpaper_upload ON wallpapers;
CREATE TRIGGER check_achievements_on_wallpaper_upload
  AFTER INSERT ON wallpapers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_content_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_emoji_combo_upload ON emoji_combos;
CREATE TRIGGER check_achievements_on_emoji_combo_upload
  AFTER INSERT ON emoji_combos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_content_achievements();

-- Trigger function to check achievements after content approval
CREATE OR REPLACE FUNCTION trigger_check_approved_content_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only check if status changed to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM check_content_achievements(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Triggers for content approval
DROP TRIGGER IF EXISTS check_achievements_on_profile_approval ON profiles;
CREATE TRIGGER check_achievements_on_profile_approval
  AFTER UPDATE OF status ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_approved_content_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_profile_pair_approval ON profile_pairs;
CREATE TRIGGER check_achievements_on_profile_pair_approval
  AFTER UPDATE OF status ON profile_pairs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_approved_content_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_emote_approval ON emotes;
CREATE TRIGGER check_achievements_on_emote_approval
  AFTER UPDATE OF status ON emotes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_approved_content_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_wallpaper_approval ON wallpapers;
CREATE TRIGGER check_achievements_on_wallpaper_approval
  AFTER UPDATE OF status ON wallpapers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_approved_content_achievements();

DROP TRIGGER IF EXISTS check_achievements_on_emoji_combo_approval ON emoji_combos;
CREATE TRIGGER check_achievements_on_emoji_combo_approval
  AFTER UPDATE OF status ON emoji_combos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_approved_content_achievements();

-- Trigger function to check achievements after follow
CREATE OR REPLACE FUNCTION trigger_check_social_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check achievements for both the follower and the person being followed
  PERFORM check_social_achievements(NEW.follower_id);
  PERFORM check_social_achievements(NEW.following_id);
  RETURN NEW;
END;
$$;

-- Trigger for follows
DROP TRIGGER IF EXISTS check_achievements_on_follow ON follows;
CREATE TRIGGER check_achievements_on_follow
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_social_achievements();

-- Trigger function to check achievements after download
CREATE OR REPLACE FUNCTION trigger_check_engagement_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_user_id UUID;
BEGIN
  -- Get the user who owns the content that was downloaded
  SELECT user_id INTO v_content_user_id
  FROM profiles
  WHERE id = NEW.profile_id
  LIMIT 1;
  
  IF v_content_user_id IS NULL THEN
    -- Try other content tables
    SELECT user_id INTO v_content_user_id
    FROM profile_pairs
    WHERE id = NEW.profile_id
    LIMIT 1;
  END IF;
  
  IF v_content_user_id IS NOT NULL THEN
    PERFORM check_engagement_achievements(v_content_user_id);
  END IF;
  
  -- Also check for user who downloaded
  IF NEW.user_id IS NOT NULL THEN
    PERFORM check_engagement_achievements(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for downloads
DROP TRIGGER IF EXISTS check_achievements_on_download ON downloads;
CREATE TRIGGER check_achievements_on_download
  AFTER INSERT ON downloads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_engagement_achievements();

-- Trigger function to check achievements after favorite
CREATE OR REPLACE FUNCTION trigger_check_favorite_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_content_user_id UUID;
BEGIN
  -- Get the user who owns the content that was favorited
  SELECT user_id INTO v_content_user_id
  FROM profiles
  WHERE id = NEW.profile_id
  LIMIT 1;
  
  IF v_content_user_id IS NULL THEN
    -- Try other content tables
    SELECT user_id INTO v_content_user_id
    FROM profile_pairs
    WHERE id = NEW.profile_id
    LIMIT 1;
  END IF;
  
  IF v_content_user_id IS NOT NULL THEN
    PERFORM check_engagement_achievements(v_content_user_id);
  END IF;
  
  -- Also check for user who favorited
  PERFORM check_engagement_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$;

-- Trigger for favorites
DROP TRIGGER IF EXISTS check_achievements_on_favorite ON favorites;
CREATE TRIGGER check_achievements_on_favorite
  AFTER INSERT ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_favorite_achievements();

-- Trigger function to check special achievements when user profile is updated (role changes)
CREATE OR REPLACE FUNCTION trigger_check_special_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check special achievements when role or is_active changes
  IF (OLD.role IS DISTINCT FROM NEW.role) OR (OLD.is_active IS DISTINCT FROM NEW.is_active) THEN
    PERFORM check_special_achievements(NEW.user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for user_profiles updates (role changes)
DROP TRIGGER IF EXISTS check_achievements_on_profile_update ON user_profiles;
CREATE TRIGGER check_achievements_on_profile_update
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_special_achievements();

-- Trigger function to check milestone and special achievements when user profile is updated (e.g., on login)
CREATE OR REPLACE FUNCTION trigger_check_milestone_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check milestone achievements whenever user profile is updated
  -- This ensures users get milestone badges when they log in or their profile is updated
  PERFORM check_milestone_achievements(NEW.user_id);
  
  -- Also check special achievements (member, admin, staff badges) to ensure they're awarded
  PERFORM check_special_achievements(NEW.user_id);
  
  RETURN NEW;
END;
$$;

-- Trigger for user_profiles updates to check milestone and special achievements
DROP TRIGGER IF EXISTS check_milestone_achievements_on_profile_update ON user_profiles;
CREATE TRIGGER check_milestone_achievements_on_profile_update
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_check_milestone_achievements();

-- Insert default badges (using image_url, and icon if column exists)
-- First, check if icon column exists and insert accordingly
DO $$
DECLARE
  v_has_icon BOOLEAN;
  v_badge_code TEXT;
  v_badge_name TEXT;
BEGIN
  -- Check if icon column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'badges' 
    AND column_name = 'icon'
  ) INTO v_has_icon;

  -- Helper function to insert badge safely (handles both code and name conflicts)
  -- Content badges
  FOR v_badge_code, v_badge_name IN 
    SELECT * FROM (VALUES
      ('first_upload', 'First Steps'),
      ('first_approved', 'Approved Creator'),
      ('content_creator_10', 'Content Creator'),
      ('content_creator_50', 'Prolific Creator'),
      ('content_creator_100', 'Master Creator'),
      ('first_follow', 'Social Butterfly'),
      ('first_follower', 'Welcome!'),
      ('first_mutual', 'Mutual Friends'),
      ('popular_10', 'Rising Star'),
      ('popular_50', 'Community Favorite'),
      ('popular_100', 'Influencer'),
      ('first_download', 'Downloaded!'),
      ('popular_content_100', 'Popular'),
      ('popular_content_500', 'Trending'),
      ('viral_content', 'Viral'),
      ('first_favorite', 'Loved'),
      ('beloved_creator_50', 'Beloved'),
      ('beloved_creator_200', 'Adored'),
      ('active_downloader_10', 'Explorer'),
      ('curator_10', 'Curator'),
      ('week_old', 'Week Warrior'),
      ('month_old', 'Monthly Member'),
      ('seasoned_member', 'Seasoned'),
      ('veteran', 'Veteran'),
      ('one_year_club', 'One Year Club'),
      ('member', 'Official Member'),
      ('bug_tester', 'Bug Tester'),
      ('verified', 'Verified'),
      ('staff', 'Staff'),
      ('admin', 'Admin')
    ) AS t(code, name)
  LOOP
    -- Only insert if badge doesn't exist by code or name
    IF NOT EXISTS (
      SELECT 1 FROM badges 
      WHERE code = v_badge_code OR name = v_badge_name
    ) THEN
      IF v_has_icon THEN
        INSERT INTO badges (code, name, description, image_url, icon, category, rarity)
        SELECT 
          v_badge_code,
          v_badge_name,
          CASE v_badge_code
            WHEN 'first_upload' THEN 'Uploaded your first piece of content'
            WHEN 'first_approved' THEN 'Had your first piece of content approved'
            WHEN 'content_creator_10' THEN 'Had 10 pieces of content approved'
            WHEN 'content_creator_50' THEN 'Had 50 pieces of content approved'
            WHEN 'content_creator_100' THEN 'Had 100 pieces of content approved'
            WHEN 'first_follow' THEN 'Followed your first user'
            WHEN 'first_follower' THEN 'Got your first follower'
            WHEN 'first_mutual' THEN 'Made your first mutual connection'
            WHEN 'popular_10' THEN 'Reached 10 followers'
            WHEN 'popular_50' THEN 'Reached 50 followers'
            WHEN 'popular_100' THEN 'Reached 100 followers'
            WHEN 'first_download' THEN 'Someone downloaded your content'
            WHEN 'popular_content_100' THEN 'Your content reached 100 downloads'
            WHEN 'popular_content_500' THEN 'Your content reached 500 downloads'
            WHEN 'viral_content' THEN 'Your content reached 1000 downloads!'
            WHEN 'first_favorite' THEN 'Someone favorited your content'
            WHEN 'beloved_creator_50' THEN 'Your content received 50 favorites'
            WHEN 'beloved_creator_200' THEN 'Your content received 200 favorites'
            WHEN 'active_downloader_10' THEN 'Downloaded 10 pieces of content'
            WHEN 'curator_10' THEN 'Favorited 10 pieces of content'
            WHEN 'week_old' THEN 'Been a member for 1 week'
            WHEN 'month_old' THEN 'Been a member for 1 month'
            WHEN 'seasoned_member' THEN 'Been a member for 3 months'
            WHEN 'veteran' THEN 'Been a member for 6 months'
            WHEN 'one_year_club' THEN 'Been a member for 1 year!'
            WHEN 'member' THEN 'Official platform member'
            WHEN 'bug_tester' THEN 'Helped test and report bugs'
            WHEN 'verified' THEN 'Verified account'
            WHEN 'staff' THEN 'Platform staff member'
            WHEN 'admin' THEN 'Platform administrator'
          END,
          NULL,
          NULL,
          CASE 
            WHEN v_badge_code IN ('first_upload', 'first_approved', 'first_download', 'first_favorite', 'active_downloader_10', 'curator_10', 'popular_content_100', 'popular_content_500', 'viral_content', 'beloved_creator_50', 'beloved_creator_200', 'content_creator_10', 'content_creator_50', 'content_creator_100') THEN 'content'
            WHEN v_badge_code IN ('first_follow', 'first_follower', 'first_mutual', 'popular_10', 'popular_50', 'popular_100') THEN 'social'
            WHEN v_badge_code IN ('week_old', 'month_old', 'seasoned_member', 'veteran', 'one_year_club') THEN 'milestone'
            WHEN v_badge_code IN ('member', 'bug_tester', 'verified', 'staff', 'admin') THEN 'special'
          END,
          CASE 
            WHEN v_badge_code IN ('first_upload', 'first_approved', 'first_follow', 'first_follower', 'first_download', 'first_favorite', 'active_downloader_10', 'curator_10', 'week_old', 'member') THEN 'common'
            WHEN v_badge_code IN ('content_creator_10', 'first_mutual', 'popular_10', 'popular_content_100', 'beloved_creator_50', 'month_old') THEN 'uncommon'
            WHEN v_badge_code IN ('content_creator_50', 'popular_50', 'popular_content_500', 'beloved_creator_200', 'seasoned_member', 'bug_tester') THEN 'rare'
            WHEN v_badge_code IN ('content_creator_100', 'popular_100', 'viral_content', 'veteran', 'verified', 'staff') THEN 'epic'
            WHEN v_badge_code IN ('one_year_club', 'admin') THEN 'legendary'
          END;
      ELSE
        INSERT INTO badges (code, name, description, image_url, category, rarity)
        SELECT 
          v_badge_code,
          v_badge_name,
          CASE v_badge_code
            WHEN 'first_upload' THEN 'Uploaded your first piece of content'
            WHEN 'first_approved' THEN 'Had your first piece of content approved'
            WHEN 'content_creator_10' THEN 'Had 10 pieces of content approved'
            WHEN 'content_creator_50' THEN 'Had 50 pieces of content approved'
            WHEN 'content_creator_100' THEN 'Had 100 pieces of content approved'
            WHEN 'first_follow' THEN 'Followed your first user'
            WHEN 'first_follower' THEN 'Got your first follower'
            WHEN 'first_mutual' THEN 'Made your first mutual connection'
            WHEN 'popular_10' THEN 'Reached 10 followers'
            WHEN 'popular_50' THEN 'Reached 50 followers'
            WHEN 'popular_100' THEN 'Reached 100 followers'
            WHEN 'first_download' THEN 'Someone downloaded your content'
            WHEN 'popular_content_100' THEN 'Your content reached 100 downloads'
            WHEN 'popular_content_500' THEN 'Your content reached 500 downloads'
            WHEN 'viral_content' THEN 'Your content reached 1000 downloads!'
            WHEN 'first_favorite' THEN 'Someone favorited your content'
            WHEN 'beloved_creator_50' THEN 'Your content received 50 favorites'
            WHEN 'beloved_creator_200' THEN 'Your content received 200 favorites'
            WHEN 'active_downloader_10' THEN 'Downloaded 10 pieces of content'
            WHEN 'curator_10' THEN 'Favorited 10 pieces of content'
            WHEN 'week_old' THEN 'Been a member for 1 week'
            WHEN 'month_old' THEN 'Been a member for 1 month'
            WHEN 'seasoned_member' THEN 'Been a member for 3 months'
            WHEN 'veteran' THEN 'Been a member for 6 months'
            WHEN 'one_year_club' THEN 'Been a member for 1 year!'
            WHEN 'member' THEN 'Official platform member'
            WHEN 'bug_tester' THEN 'Helped test and report bugs'
            WHEN 'verified' THEN 'Verified account'
            WHEN 'staff' THEN 'Platform staff member'
            WHEN 'admin' THEN 'Platform administrator'
          END,
          NULL,
          CASE 
            WHEN v_badge_code IN ('first_upload', 'first_approved', 'first_download', 'first_favorite', 'active_downloader_10', 'curator_10', 'popular_content_100', 'popular_content_500', 'viral_content', 'beloved_creator_50', 'beloved_creator_200', 'content_creator_10', 'content_creator_50', 'content_creator_100') THEN 'content'
            WHEN v_badge_code IN ('first_follow', 'first_follower', 'first_mutual', 'popular_10', 'popular_50', 'popular_100') THEN 'social'
            WHEN v_badge_code IN ('week_old', 'month_old', 'seasoned_member', 'veteran', 'one_year_club') THEN 'milestone'
            WHEN v_badge_code IN ('member', 'bug_tester', 'verified', 'staff', 'admin') THEN 'special'
          END,
          CASE 
            WHEN v_badge_code IN ('first_upload', 'first_approved', 'first_follow', 'first_follower', 'first_download', 'first_favorite', 'active_downloader_10', 'curator_10', 'week_old', 'member') THEN 'common'
            WHEN v_badge_code IN ('content_creator_10', 'first_mutual', 'popular_10', 'popular_content_100', 'beloved_creator_50', 'month_old') THEN 'uncommon'
            WHEN v_badge_code IN ('content_creator_50', 'popular_50', 'popular_content_500', 'beloved_creator_200', 'seasoned_member', 'bug_tester') THEN 'rare'
            WHEN v_badge_code IN ('content_creator_100', 'popular_100', 'viral_content', 'veteran', 'verified', 'staff') THEN 'epic'
            WHEN v_badge_code IN ('one_year_club', 'admin') THEN 'legendary'
          END;
      END IF;
    END IF;
  END LOOP;
  
  -- Update existing badges that don't have codes by matching names
  -- Only update if code doesn't already exist for another badge
  UPDATE badges b SET code = 'first_upload', category = 'content', rarity = 'common' 
    WHERE b.name = 'First Steps' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'first_upload' AND id != b.id);
  UPDATE badges b SET code = 'first_approved', category = 'content', rarity = 'common' 
    WHERE b.name = 'Approved Creator' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'first_approved' AND id != b.id);
  UPDATE badges b SET code = 'content_creator_10', category = 'content', rarity = 'uncommon' 
    WHERE b.name = 'Content Creator' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'content_creator_10' AND id != b.id);
  UPDATE badges b SET code = 'content_creator_50', category = 'content', rarity = 'rare' 
    WHERE b.name = 'Prolific Creator' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'content_creator_50' AND id != b.id);
  UPDATE badges b SET code = 'content_creator_100', category = 'content', rarity = 'epic' 
    WHERE b.name = 'Master Creator' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'content_creator_100' AND id != b.id);
  UPDATE badges b SET code = 'first_follow', category = 'social', rarity = 'common' 
    WHERE b.name = 'Social Butterfly' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'first_follow' AND id != b.id);
  UPDATE badges b SET code = 'first_follower', category = 'social', rarity = 'common' 
    WHERE b.name = 'Welcome!' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'first_follower' AND id != b.id);
  UPDATE badges b SET code = 'first_mutual', category = 'social', rarity = 'uncommon' 
    WHERE b.name = 'Mutual Friends' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'first_mutual' AND id != b.id);
  UPDATE badges b SET code = 'popular_10', category = 'social', rarity = 'uncommon' 
    WHERE b.name = 'Rising Star' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'popular_10' AND id != b.id);
  UPDATE badges b SET code = 'popular_50', category = 'social', rarity = 'rare' 
    WHERE b.name = 'Community Favorite' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'popular_50' AND id != b.id);
  UPDATE badges b SET code = 'popular_100', category = 'social', rarity = 'epic' 
    WHERE b.name = 'Influencer' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'popular_100' AND id != b.id);
  UPDATE badges b SET code = 'first_download', category = 'content', rarity = 'common' 
    WHERE b.name = 'Downloaded!' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'first_download' AND id != b.id);
  UPDATE badges b SET code = 'popular_content_100', category = 'content', rarity = 'uncommon' 
    WHERE b.name = 'Popular' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'popular_content_100' AND id != b.id);
  UPDATE badges b SET code = 'popular_content_500', category = 'content', rarity = 'rare' 
    WHERE b.name = 'Trending' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'popular_content_500' AND id != b.id);
  UPDATE badges b SET code = 'viral_content', category = 'content', rarity = 'epic' 
    WHERE b.name = 'Viral' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'viral_content' AND id != b.id);
  UPDATE badges b SET code = 'first_favorite', category = 'content', rarity = 'common' 
    WHERE b.name = 'Loved' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'first_favorite' AND id != b.id);
  UPDATE badges b SET code = 'beloved_creator_50', category = 'content', rarity = 'uncommon' 
    WHERE b.name = 'Beloved' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'beloved_creator_50' AND id != b.id);
  UPDATE badges b SET code = 'beloved_creator_200', category = 'content', rarity = 'rare' 
    WHERE b.name = 'Adored' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'beloved_creator_200' AND id != b.id);
  UPDATE badges b SET code = 'active_downloader_10', category = 'content', rarity = 'common' 
    WHERE b.name = 'Explorer' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'active_downloader_10' AND id != b.id);
  UPDATE badges b SET code = 'curator_10', category = 'content', rarity = 'common' 
    WHERE b.name = 'Curator' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'curator_10' AND id != b.id);
  UPDATE badges b SET code = 'week_old', category = 'milestone', rarity = 'common' 
    WHERE b.name = 'Week Warrior' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'week_old' AND id != b.id);
  UPDATE badges b SET code = 'month_old', category = 'milestone', rarity = 'uncommon' 
    WHERE b.name = 'Monthly Member' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'month_old' AND id != b.id);
  UPDATE badges b SET code = 'seasoned_member', category = 'milestone', rarity = 'rare' 
    WHERE b.name = 'Seasoned' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'seasoned_member' AND id != b.id);
  UPDATE badges b SET code = 'veteran', category = 'milestone', rarity = 'epic' 
    WHERE b.name = 'Veteran' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'veteran' AND id != b.id);
  UPDATE badges b SET code = 'one_year_club', category = 'milestone', rarity = 'legendary' 
    WHERE b.name = 'One Year Club' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'one_year_club' AND id != b.id);
  UPDATE badges b SET code = 'member', category = 'special', rarity = 'common' 
    WHERE (b.name = 'Member' OR b.name = 'Official Member') AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'member' AND id != b.id);
  UPDATE badges b SET code = 'bug_tester', category = 'special', rarity = 'rare' 
    WHERE b.name = 'Bug Tester' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'bug_tester' AND id != b.id);
  UPDATE badges b SET code = 'verified', category = 'special', rarity = 'epic' 
    WHERE b.name = 'Verified' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'verified' AND id != b.id);
  UPDATE badges b SET code = 'staff', category = 'special', rarity = 'epic' 
    WHERE b.name = 'Staff' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'staff' AND id != b.id);
  UPDATE badges b SET code = 'admin', category = 'special', rarity = 'legendary' 
    WHERE b.name = 'Admin' AND (b.code IS NULL OR b.code = '') 
    AND NOT EXISTS (SELECT 1 FROM badges WHERE code = 'admin' AND id != b.id);
END $$;

-- Add comments for documentation
-- Function to get badge progress for a user
CREATE OR REPLACE FUNCTION get_badge_progress(p_user_id UUID, p_badge_code TEXT)
RETURNS TABLE (
  badge_id UUID,
  badge_code TEXT,
  badge_name TEXT,
  current_progress INTEGER,
  target_progress INTEGER,
  progress_percentage NUMERIC,
  is_unlocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge_id UUID;
  v_unlocked BOOLEAN;
BEGIN
  -- Get badge ID
  SELECT id INTO v_badge_id
  FROM badges
  WHERE code = p_badge_code AND is_active = true;
  
  IF v_badge_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Check if badge is unlocked
  SELECT EXISTS (
    SELECT 1 FROM user_badges
    WHERE user_id = p_user_id AND badge_id = v_badge_id
  ) INTO v_unlocked;
  
  -- Return progress data
  RETURN QUERY
  SELECT 
    b.id,
    b.code,
    b.name,
    COALESCE(bp.current_progress, 0)::INTEGER,
    COALESCE(bp.target_progress, 1)::INTEGER,
    CASE 
      WHEN COALESCE(bp.target_progress, 1) > 0 THEN
        LEAST(100, ROUND((COALESCE(bp.current_progress, 0)::NUMERIC / bp.target_progress::NUMERIC) * 100, 2))
      ELSE 0
    END,
    v_unlocked
  FROM badges b
  LEFT JOIN badge_progress bp ON bp.badge_id = b.id AND bp.user_id = p_user_id
  WHERE b.id = v_badge_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_badge_progress TO authenticated;

COMMENT ON TABLE badges IS 'Achievement badges that users can unlock';
COMMENT ON TABLE user_badges IS 'Junction table tracking which badges each user has unlocked';
COMMENT ON TABLE badge_progress IS 'Tracks user progress towards unlocking badges';
COMMENT ON FUNCTION award_badge IS 'Awards a badge to a user and creates a notification';
COMMENT ON FUNCTION check_content_achievements IS 'Checks and awards content-related achievements';
COMMENT ON FUNCTION check_social_achievements IS 'Checks and awards social-related achievements';
COMMENT ON FUNCTION check_engagement_achievements IS 'Checks and awards engagement-related achievements';
COMMENT ON FUNCTION check_milestone_achievements IS 'Checks and awards milestone-related achievements';
COMMENT ON FUNCTION check_special_achievements IS 'Checks and awards special/role-based achievements (admin, staff, member)';
COMMENT ON FUNCTION check_all_achievements IS 'Checks all achievement types for a user';
COMMENT ON FUNCTION get_badge_progress IS 'Gets progress information for a specific badge';

-- Add show_badges_on_profile column to user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'show_badges_on_profile'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD COLUMN show_badges_on_profile BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Function to retroactively check all users for badges they should have
-- This should be run once after the achievement system is deployed
CREATE OR REPLACE FUNCTION retroactively_check_all_users_achievements()
RETURNS TABLE(user_id UUID, badges_awarded INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_badges_count INTEGER;
BEGIN
  -- Loop through all active users
  FOR v_user_record IN 
    SELECT DISTINCT up.user_id 
    FROM user_profiles up
    WHERE up.is_active = true
    AND up.deleted_at IS NULL
  LOOP
    -- Check all achievements for this user
    BEGIN
      PERFORM check_all_achievements(v_user_record.user_id);
      
      -- Count how many badges this user has
      SELECT COUNT(*) INTO v_badges_count
      FROM user_badges
      WHERE user_id = v_user_record.user_id;
      
      -- Return the user_id and badge count
      user_id := v_user_record.user_id;
      badges_awarded := v_badges_count;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with next user
      RAISE WARNING 'Error checking achievements for user %: %', v_user_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

-- Function to clean up inappropriate role badges for all users
CREATE OR REPLACE FUNCTION cleanup_role_badges()
RETURNS TABLE(user_id UUID, badges_removed INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_removed_count INTEGER;
  v_temp_count INTEGER;
  v_admin_badge_id UUID;
  v_staff_badge_id UUID;
  v_member_badge_id UUID;
  v_user_role TEXT;
BEGIN
  -- Get badge IDs
  SELECT id INTO v_admin_badge_id FROM badges WHERE code = 'admin' AND is_active = true;
  SELECT id INTO v_staff_badge_id FROM badges WHERE code = 'staff' AND is_active = true;
  SELECT id INTO v_member_badge_id FROM badges WHERE code = 'member' AND is_active = true;
  
  -- Loop through all users
  FOR v_user_record IN
    SELECT DISTINCT up.user_id, up.role
    FROM user_profiles up
    WHERE up.is_active = true
    AND up.deleted_at IS NULL
  LOOP
    v_removed_count := 0;
    v_user_role := v_user_record.role;
    
    -- Remove inappropriate badges based on role
    IF v_user_role = 'admin' THEN
      -- Admins should only have admin badge
      IF v_staff_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = v_user_record.user_id AND badge_id = v_staff_badge_id;
        GET DIAGNOSTICS v_temp_count = ROW_COUNT;
        v_removed_count := v_removed_count + v_temp_count;
      END IF;
      IF v_member_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = v_user_record.user_id AND badge_id = v_member_badge_id;
        GET DIAGNOSTICS v_temp_count = ROW_COUNT;
        v_removed_count := v_removed_count + v_temp_count;
      END IF;
    ELSIF v_user_role = 'staff' OR v_user_role = 'moderator' THEN
      -- Staff/moderators should only have staff badge
      IF v_member_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = v_user_record.user_id AND badge_id = v_member_badge_id;
        GET DIAGNOSTICS v_removed_count = ROW_COUNT;
      END IF;
    ELSE
      -- Regular users should only have member badge
      IF v_admin_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = v_user_record.user_id AND badge_id = v_admin_badge_id;
        GET DIAGNOSTICS v_temp_count = ROW_COUNT;
        v_removed_count := v_removed_count + v_temp_count;
      END IF;
      IF v_staff_badge_id IS NOT NULL THEN
        DELETE FROM user_badges WHERE user_id = v_user_record.user_id AND badge_id = v_staff_badge_id;
        GET DIAGNOSTICS v_temp_count = ROW_COUNT;
        v_removed_count := v_removed_count + v_temp_count;
      END IF;
    END IF;
    
    -- Re-check and award correct badges
    PERFORM check_special_achievements(v_user_record.user_id);
    
    -- Return result
    user_id := v_user_record.user_id;
    badges_removed := v_removed_count;
    RETURN NEXT;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant execute permission to authenticated users (staff can run this)
GRANT EXECUTE ON FUNCTION retroactively_check_all_users_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_role_badges TO authenticated;

COMMENT ON FUNCTION retroactively_check_all_users_achievements IS 'Retroactively checks and awards badges to all existing users. Run this once after deploying the achievement system.';
COMMENT ON FUNCTION cleanup_role_badges IS 'Cleans up inappropriate role badges for all users based on their current roles. Removes badges that should not be present.';
COMMENT ON COLUMN user_profiles.show_badges_on_profile IS 'Whether to display badges on the user profile. Defaults to true.';

