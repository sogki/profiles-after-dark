-- Add status column to content tables for approval workflow
-- This migration adds a status column to all content tables to enable staff approval

-- Add status to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add status to profile_pairs table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profile_pairs' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profile_pairs 
    ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add status to emotes table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emotes' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.emotes 
    ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add status to wallpapers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wallpapers' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.wallpapers 
    ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add status to emoji_combos table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emoji_combos' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.emoji_combos 
    ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add status to single_uploads table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'single_uploads') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'single_uploads' 
      AND column_name = 'status'
    ) THEN
      ALTER TABLE public.single_uploads 
      ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
    END IF;
  END IF;
END $$;

-- Add reviewed_by and reviewed_at columns for tracking who approved/rejected
-- Profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Profile pairs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profile_pairs' 
    AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.profile_pairs 
    ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profile_pairs' 
    AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.profile_pairs 
    ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Emotes
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emotes' 
    AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.emotes 
    ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emotes' 
    AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.emotes 
    ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Wallpapers
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wallpapers' 
    AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.wallpapers 
    ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wallpapers' 
    AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.wallpapers 
    ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Emoji combos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emoji_combos' 
    AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE public.emoji_combos 
    ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'emoji_combos' 
    AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE public.emoji_combos 
    ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Single uploads (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'single_uploads') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'single_uploads' 
      AND column_name = 'reviewed_by'
    ) THEN
      ALTER TABLE public.single_uploads 
      ADD COLUMN reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'single_uploads' 
      AND column_name = 'reviewed_at'
    ) THEN
      ALTER TABLE public.single_uploads 
      ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
  END IF;
END $$;

-- Create indexes for status columns
CREATE INDEX IF NOT EXISTS profiles_status_idx ON public.profiles(status);
CREATE INDEX IF NOT EXISTS profile_pairs_status_idx ON public.profile_pairs(status);
CREATE INDEX IF NOT EXISTS emotes_status_idx ON public.emotes(status);
CREATE INDEX IF NOT EXISTS wallpapers_status_idx ON public.wallpapers(status);
CREATE INDEX IF NOT EXISTS emoji_combos_status_idx ON public.emoji_combos(status);

-- Create index for single_uploads if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'single_uploads') THEN
    CREATE INDEX IF NOT EXISTS single_uploads_status_idx ON public.single_uploads(status);
  END IF;
END $$;

-- Set existing content to approved (backward compatibility)
UPDATE public.profiles SET status = 'approved' WHERE status IS NULL;
UPDATE public.profile_pairs SET status = 'approved' WHERE status IS NULL;
UPDATE public.emotes SET status = 'approved' WHERE status IS NULL;
UPDATE public.wallpapers SET status = 'approved' WHERE status IS NULL;
UPDATE public.emoji_combos SET status = 'approved' WHERE status IS NULL;

-- Update single_uploads if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'single_uploads') THEN
    UPDATE public.single_uploads SET status = 'approved' WHERE status IS NULL;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.status IS 'Content approval status: pending (awaiting review), approved (visible to public), rejected (not visible)';
COMMENT ON COLUMN public.profile_pairs.status IS 'Content approval status: pending (awaiting review), approved (visible to public), rejected (not visible)';
COMMENT ON COLUMN public.emotes.status IS 'Content approval status: pending (awaiting review), approved (visible to public), rejected (not visible)';
COMMENT ON COLUMN public.wallpapers.status IS 'Content approval status: pending (awaiting review), approved (visible to public), rejected (not visible)';
COMMENT ON COLUMN public.emoji_combos.status IS 'Content approval status: pending (awaiting review), approved (visible to public), rejected (not visible)';

-- Add comment for single_uploads if table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'single_uploads') THEN
    COMMENT ON COLUMN public.single_uploads.status IS 'Content approval status: pending (awaiting review), approved (visible to public), rejected (not visible)';
  END IF;
END $$;

-- Create function to allow staff to create notifications for users (bypasses RLS)
CREATE OR REPLACE FUNCTION create_content_approval_notification(
  target_user_id UUID,
  notification_content TEXT,
  notification_type TEXT,
  notification_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Verify the caller is staff
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'moderator', 'staff')
  ) THEN
    RAISE EXCEPTION 'Only staff members can create notifications for other users';
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (
    user_id,
    content,
    type,
    priority,
    action_url,
    read
  ) VALUES (
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

-- Grant execute permission to authenticated users (RLS will check staff status inside function)
GRANT EXECUTE ON FUNCTION create_content_approval_notification TO authenticated;

COMMENT ON FUNCTION create_content_approval_notification IS 'Allows staff members to create notifications for users when content is approved or rejected. Bypasses RLS to allow cross-user notifications.';

-- Create function to allow staff to create notifications for multiple users (for staff notifications)
CREATE OR REPLACE FUNCTION create_staff_notifications(
  target_user_ids UUID[],
  notification_content TEXT,
  notification_type TEXT,
  notification_priority TEXT DEFAULT 'medium',
  notification_action_url TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_count INTEGER := 0;
  target_user_id UUID;
BEGIN
  -- Verify the caller is staff or authenticated user (for reports, any authenticated user can notify staff)
  -- For staff notifications, we allow any authenticated user to create them
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Only authenticated users can create notifications';
  END IF;

  -- Insert notifications for each target user
  FOREACH target_user_id IN ARRAY target_user_ids
  LOOP
    INSERT INTO public.notifications (
      user_id,
      content,
      type,
      priority,
      action_url,
      read
    ) VALUES (
      target_user_id,
      notification_content,
      notification_type,
      notification_priority,
      notification_action_url,
      false
    );
    notification_count := notification_count + 1;
  END LOOP;

  RETURN notification_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_staff_notifications TO authenticated;

COMMENT ON FUNCTION create_staff_notifications IS 'Allows authenticated users to create notifications for multiple users (e.g., staff notifications). Bypasses RLS to allow cross-user notifications.';

-- Add RLS policies to allow staff to update and delete any content for moderation
-- This enables the content approval workflow

-- Staff can update any profile for moderation
DROP POLICY IF EXISTS "Staff can update any profile for moderation" ON public.profiles;
CREATE POLICY "Staff can update any profile for moderation" ON public.profiles
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

-- Staff can delete any profile for moderation
DROP POLICY IF EXISTS "Staff can delete any profile for moderation" ON public.profiles;
CREATE POLICY "Staff can delete any profile for moderation" ON public.profiles
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Staff can update any profile pair for moderation
DROP POLICY IF EXISTS "Staff can update any profile pair for moderation" ON public.profile_pairs;
CREATE POLICY "Staff can update any profile pair for moderation" ON public.profile_pairs
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

-- Staff can delete any profile pair for moderation
DROP POLICY IF EXISTS "Staff can delete any profile pair for moderation" ON public.profile_pairs;
CREATE POLICY "Staff can delete any profile pair for moderation" ON public.profile_pairs
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Staff can update any emote for moderation
DROP POLICY IF EXISTS "Staff can update any emote for moderation" ON public.emotes;
CREATE POLICY "Staff can update any emote for moderation" ON public.emotes
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

-- Staff can delete any emote for moderation
DROP POLICY IF EXISTS "Staff can delete any emote for moderation" ON public.emotes;
CREATE POLICY "Staff can delete any emote for moderation" ON public.emotes
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Staff can update any wallpaper for moderation
DROP POLICY IF EXISTS "Staff can update any wallpaper for moderation" ON public.wallpapers;
CREATE POLICY "Staff can update any wallpaper for moderation" ON public.wallpapers
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

-- Staff can delete any wallpaper for moderation
DROP POLICY IF EXISTS "Staff can delete any wallpaper for moderation" ON public.wallpapers;
CREATE POLICY "Staff can delete any wallpaper for moderation" ON public.wallpapers
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Staff can update any emoji combo for moderation
DROP POLICY IF EXISTS "Staff can update any emoji combo for moderation" ON public.emoji_combos;
CREATE POLICY "Staff can update any emoji combo for moderation" ON public.emoji_combos
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

-- Staff can delete any emoji combo for moderation
DROP POLICY IF EXISTS "Staff can delete any emoji combo for moderation" ON public.emoji_combos;
CREATE POLICY "Staff can delete any emoji combo for moderation" ON public.emoji_combos
    FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Staff can update any single upload for moderation (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'single_uploads') THEN
    DROP POLICY IF EXISTS "Staff can update any single upload for moderation" ON public.single_uploads;
    EXECUTE 'CREATE POLICY "Staff can update any single upload for moderation" ON public.single_uploads
        FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_id = auth.uid() 
                AND role IN (''admin'', ''moderator'', ''staff'')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_id = auth.uid() 
                AND role IN (''admin'', ''moderator'', ''staff'')
            )
        )';

    DROP POLICY IF EXISTS "Staff can delete any single upload for moderation" ON public.single_uploads;
    EXECUTE 'CREATE POLICY "Staff can delete any single upload for moderation" ON public.single_uploads
        FOR DELETE 
        USING (
            EXISTS (
                SELECT 1 FROM public.user_profiles 
                WHERE user_id = auth.uid() 
                AND role IN (''admin'', ''moderator'', ''staff'')
            )
        )';
  END IF;
END $$;

