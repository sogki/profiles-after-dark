/*
  # Update follows system for social features
  
  Works with existing follows table structure:
    - id
    - follower_id
    - following_id (not followed_id)
    - created_at
    - updated_at
  
  1. Add missing columns if they don't exist
  2. Add indexes for better performance
  3. Add constraints (no self-follow, unique)
  4. Security (RLS policies)
  5. Triggers (notifications)
*/

-- Add columns if they don't exist
DO $$ 
BEGIN
  -- Add follower_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'follows' 
                 AND column_name = 'follower_id') THEN
    ALTER TABLE public.follows ADD COLUMN follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
  END IF;

  -- Add following_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'follows' 
                 AND column_name = 'following_id') THEN
    ALTER TABLE public.follows ADD COLUMN following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
  END IF;

  -- Add created_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'follows' 
                 AND column_name = 'created_at') THEN
    ALTER TABLE public.follows ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'follows' 
                 AND column_name = 'updated_at') THEN
    ALTER TABLE public.follows ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add no self-follow constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follows_no_self_follow') THEN
    ALTER TABLE public.follows ADD CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id);
  END IF;

  -- Add unique constraint if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'follows_unique') THEN
    ALTER TABLE public.follows ADD CONSTRAINT follows_unique UNIQUE (follower_id, following_id);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS follows_created_at_idx ON public.follows(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop if exists, then create)
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;
CREATE POLICY "Users can view all follows"
  ON public.follows
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create their own follows" ON public.follows;
CREATE POLICY "Users can create their own follows"
  ON public.follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;
CREATE POLICY "Users can delete their own follows"
  ON public.follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- Function to notify users of new followers
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

-- Trigger to create notification when user is followed
DROP TRIGGER IF EXISTS notify_new_follower_trigger ON public.follows;
CREATE TRIGGER notify_new_follower_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_follower();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at when follows table is updated
DROP TRIGGER IF EXISTS update_follows_updated_at ON public.follows;
CREATE TRIGGER update_follows_updated_at
  BEFORE UPDATE ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

