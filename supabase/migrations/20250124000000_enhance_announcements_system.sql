-- Enhanced Announcements System Migration
-- This migration enhances the announcements table to support:
-- - Multiple announcements
-- - Types (info, warning, success, error)
-- - Scheduling (start/end dates)
-- - Priority/ordering
-- - Action URLs
-- - Per-user dismissals
-- - Analytics tracking

-- First, migrate existing data if needed
DO $$
BEGIN
  -- If there's existing data with id=1, we'll preserve it
  IF EXISTS (SELECT 1 FROM public.announcements WHERE id = 1) THEN
    -- Ensure the table has the new structure before migrating
    NULL; -- Will be handled by column additions below
  END IF;
END $$;

-- Change id from integer to UUID for better scalability (if needed)
DO $$
BEGIN
  -- Check if id is integer (needs migration)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'id'
    AND data_type = 'integer'
  ) THEN
    -- Create new table with UUID id
    CREATE TABLE IF NOT EXISTS public.announcements_new (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      message TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Migrate existing data
    INSERT INTO public.announcements_new (id, message, is_active, created_at)
    SELECT 
      gen_random_uuid(),
      message,
      is_active,
      COALESCE(created_at, NOW())
    FROM public.announcements;

    -- Drop old table
    DROP TABLE IF EXISTS public.announcements CASCADE;

    -- Rename new table
    ALTER TABLE public.announcements_new RENAME TO announcements;
  END IF;
  
  -- If table doesn't exist, create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements'
  ) THEN
    CREATE TABLE public.announcements (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      message TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

-- Add new columns to announcements table
DO $$
BEGIN
  -- Add type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'system'));
  END IF;

  -- Add priority column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;

  -- Add start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add end_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add action_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'action_url'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN action_url TEXT;
  END IF;

  -- Add action_text column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'action_text'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN action_text TEXT DEFAULT 'Learn More';
  END IF;

  -- Add is_dismissible column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'is_dismissible'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN is_dismissible BOOLEAN DEFAULT TRUE;
  END IF;

  -- Add target_roles column (for role-based announcements)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'target_roles'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN target_roles TEXT[] DEFAULT NULL;
  END IF;

  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN title TEXT;
  END IF;

  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.announcements 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create announcement_dismissals table for per-user dismissals
CREATE TABLE IF NOT EXISTS public.announcement_dismissals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Create announcement_views table for analytics
CREATE TABLE IF NOT EXISTS public.announcement_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_type ON public.announcements(type);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_start_date ON public.announcements(start_date);
CREATE INDEX IF NOT EXISTS idx_announcements_end_date ON public.announcements(end_date);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_dismissals_announcement_id ON public.announcement_dismissals(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_dismissals_user_id ON public.announcement_dismissals(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_announcement_id ON public.announcement_views(announcement_id);
CREATE INDEX IF NOT EXISTS idx_announcement_views_user_id ON public.announcement_views(user_id);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
-- Everyone can view active announcements
DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.announcements;
CREATE POLICY "Anyone can view active announcements" ON public.announcements
  FOR SELECT
  USING (
    is_active = TRUE
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Staff can view all announcements
DROP POLICY IF EXISTS "Staff can view all announcements" ON public.announcements;
CREATE POLICY "Staff can view all announcements" ON public.announcements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator', 'staff')
    )
  );

-- Staff can insert announcements
DROP POLICY IF EXISTS "Staff can insert announcements" ON public.announcements;
CREATE POLICY "Staff can insert announcements" ON public.announcements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator', 'staff')
    )
  );

-- Staff can update announcements
DROP POLICY IF EXISTS "Staff can update announcements" ON public.announcements;
CREATE POLICY "Staff can update announcements" ON public.announcements
  FOR UPDATE
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

-- Staff can delete announcements
DROP POLICY IF EXISTS "Staff can delete announcements" ON public.announcements;
CREATE POLICY "Staff can delete announcements" ON public.announcements
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator', 'staff')
    )
  );

-- RLS Policies for announcement_dismissals
-- Users can view their own dismissals
DROP POLICY IF EXISTS "Users can view their own dismissals" ON public.announcement_dismissals;
CREATE POLICY "Users can view their own dismissals" ON public.announcement_dismissals
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own dismissals
DROP POLICY IF EXISTS "Users can insert their own dismissals" ON public.announcement_dismissals;
CREATE POLICY "Users can insert their own dismissals" ON public.announcement_dismissals
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Staff can view all dismissals
DROP POLICY IF EXISTS "Staff can view all dismissals" ON public.announcement_dismissals;
CREATE POLICY "Staff can view all dismissals" ON public.announcement_dismissals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator', 'staff')
    )
  );

-- RLS Policies for announcement_views
-- Users can insert their own views
DROP POLICY IF EXISTS "Users can insert their own views" ON public.announcement_views;
CREATE POLICY "Users can insert their own views" ON public.announcement_views
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Staff can view all views
DROP POLICY IF EXISTS "Staff can view all views" ON public.announcement_views;
CREATE POLICY "Staff can view all views" ON public.announcement_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator', 'staff')
    )
  );

-- Create function to get active announcements for a user
CREATE OR REPLACE FUNCTION get_active_announcements(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  type TEXT,
  priority INTEGER,
  action_url TEXT,
  action_text TEXT,
  is_dismissible BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.message,
    a.type,
    a.priority,
    a.action_url,
    a.action_text,
    a.is_dismissible,
    a.created_at
  FROM public.announcements a
  WHERE a.is_active = TRUE
    AND (a.start_date IS NULL OR a.start_date <= NOW())
    AND (a.end_date IS NULL OR a.end_date >= NOW())
    AND (
      -- Check if user has dismissed this announcement
      p_user_id IS NULL 
      OR NOT EXISTS (
        SELECT 1 FROM public.announcement_dismissals ad
        WHERE ad.announcement_id = a.id
        AND ad.user_id = p_user_id
      )
    )
    AND (
      -- Check role targeting
      a.target_roles IS NULL
      OR p_user_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.user_profiles up
        WHERE up.user_id = p_user_id
        AND up.role = ANY(a.target_roles)
      )
    )
  ORDER BY a.priority DESC, a.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_active_announcements TO authenticated, anon;

-- Create function to track announcement view
CREATE OR REPLACE FUNCTION track_announcement_view(
  p_announcement_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  view_id UUID;
BEGIN
  INSERT INTO public.announcement_views (
    announcement_id,
    user_id,
    ip_address,
    user_agent
  ) VALUES (
    p_announcement_id,
    p_user_id,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO view_id;

  RETURN view_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION track_announcement_view TO authenticated, anon;

-- Add comments
COMMENT ON TABLE public.announcements IS 'System announcements displayed to users';
COMMENT ON COLUMN public.announcements.type IS 'Type of announcement: info, warning, success, error, system';
COMMENT ON COLUMN public.announcements.priority IS 'Priority for ordering (higher = shown first)';
COMMENT ON COLUMN public.announcements.start_date IS 'When the announcement should start showing';
COMMENT ON COLUMN public.announcements.end_date IS 'When the announcement should stop showing';
COMMENT ON COLUMN public.announcements.is_dismissible IS 'Whether users can dismiss this announcement';
COMMENT ON COLUMN public.announcements.target_roles IS 'Array of roles this announcement targets (NULL = all users)';
COMMENT ON TABLE public.announcement_dismissals IS 'Tracks which users have dismissed which announcements';
COMMENT ON TABLE public.announcement_views IS 'Tracks announcement views for analytics';

