-- Enhanced Moderation System Migration
-- This migration adds missing tables and updates existing ones for the enhanced moderation system

-- Create moderation_threads table for staff messaging
CREATE TABLE IF NOT EXISTS public.moderation_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    participants TEXT[] NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    thread_type TEXT DEFAULT 'general' CHECK (thread_type IN ('general', 'incident', 'appeal', 'investigation')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Create moderation_messages table for staff messaging
CREATE TABLE IF NOT EXISTS public.moderation_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.moderation_threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'action')),
    attachments JSONB DEFAULT '[]',
    reply_to UUID REFERENCES public.moderation_messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);

-- Create appeals_responses table for appeal management
CREATE TABLE IF NOT EXISTS public.appeals_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appeal_id INTEGER REFERENCES public.appeals(id) ON DELETE CASCADE,
    moderator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    response_text TEXT NOT NULL,
    action_taken TEXT CHECK (action_taken IN ('approved', 'denied', 'pending', 'escalated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_internal BOOLEAN DEFAULT FALSE
);

-- Add missing columns to existing tables if they don't exist
-- Update moderation_logs table
DO $$ 
BEGIN
    -- Add moderator info if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'moderator_id') THEN
        ALTER TABLE public.moderation_logs ADD COLUMN moderator_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add target user info if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'target_user_id') THEN
        ALTER TABLE public.moderation_logs ADD COLUMN target_user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add target profile info if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'target_profile_id') THEN
        ALTER TABLE public.moderation_logs ADD COLUMN target_profile_id UUID REFERENCES public.profiles(id);
    END IF;
    
    -- Add description if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'moderation_logs' AND column_name = 'description') THEN
        ALTER TABLE public.moderation_logs ADD COLUMN description TEXT;
    END IF;
END $$;

-- Update notifications table
DO $$ 
BEGIN
    -- Add notification type if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE public.notifications ADD COLUMN type TEXT DEFAULT 'system' CHECK (type IN ('system', 'report', 'appeal', 'account_action', 'profile_update'));
    END IF;
    
    -- Add priority if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'priority') THEN
        ALTER TABLE public.notifications ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
    END IF;
    
    -- Add read status if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
        ALTER TABLE public.notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update user_profiles table
DO $$ 
BEGIN
    -- Add is_active if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add last_login if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'last_login') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add email if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
        ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_moderation_threads_participants ON public.moderation_threads USING GIN (participants);
CREATE INDEX IF NOT EXISTS idx_moderation_threads_created_at ON public.moderation_threads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_threads_updated_at ON public.moderation_threads (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_messages_thread_id ON public.moderation_messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_moderation_messages_user_id ON public.moderation_messages (user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_messages_created_at ON public.moderation_messages (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_appeals_responses_appeal_id ON public.appeals_responses (appeal_id);
CREATE INDEX IF NOT EXISTS idx_appeals_responses_moderator_id ON public.appeals_responses (moderator_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications (read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderator_id ON public.moderation_logs (moderator_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target_user_id ON public.moderation_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created_at ON public.moderation_logs (created_at DESC);

-- Create RLS policies for moderation_threads
ALTER TABLE public.moderation_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view threads they participate in" ON public.moderation_threads;
CREATE POLICY "Staff can view threads they participate in" ON public.moderation_threads
    FOR SELECT USING (
        auth.uid()::text = ANY(participants) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

DROP POLICY IF EXISTS "Staff can create threads" ON public.moderation_threads;
CREATE POLICY "Staff can create threads" ON public.moderation_threads
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

DROP POLICY IF EXISTS "Staff can update threads they participate in" ON public.moderation_threads;
CREATE POLICY "Staff can update threads they participate in" ON public.moderation_threads
    FOR UPDATE USING (
        auth.uid()::text = ANY(participants) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Create RLS policies for moderation_messages
ALTER TABLE public.moderation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view messages in threads they participate in" ON public.moderation_messages;
CREATE POLICY "Staff can view messages in threads they participate in" ON public.moderation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.moderation_threads 
            WHERE id = thread_id 
            AND (auth.uid()::text = ANY(participants) OR 
                 EXISTS (
                     SELECT 1 FROM public.user_profiles 
                     WHERE user_id = auth.uid() 
                     AND role IN ('admin', 'moderator', 'staff')
                 ))
        )
    );

DROP POLICY IF EXISTS "Staff can create messages in threads they participate in" ON public.moderation_messages;
CREATE POLICY "Staff can create messages in threads they participate in" ON public.moderation_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.moderation_threads 
            WHERE id = thread_id 
            AND (auth.uid()::text = ANY(participants) OR 
                 EXISTS (
                     SELECT 1 FROM public.user_profiles 
                     WHERE user_id = auth.uid() 
                     AND role IN ('admin', 'moderator', 'staff')
                 ))
        )
    );

DROP POLICY IF EXISTS "Staff can update their own messages" ON public.moderation_messages;
CREATE POLICY "Staff can update their own messages" ON public.moderation_messages
    FOR UPDATE USING (user_id = auth.uid());

-- Create RLS policies for appeals_responses
ALTER TABLE public.appeals_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view appeal responses" ON public.appeals_responses;
CREATE POLICY "Staff can view appeal responses" ON public.appeals_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

DROP POLICY IF EXISTS "Staff can create appeal responses" ON public.appeals_responses;
CREATE POLICY "Staff can create appeal responses" ON public.appeals_responses
    FOR INSERT WITH CHECK (
        moderator_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Enable RLS for reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reports
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports" ON public.reports
    FOR SELECT USING (reporter_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (reporter_user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can view all reports" ON public.reports;
CREATE POLICY "Staff can view all reports" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

DROP POLICY IF EXISTS "Staff can update reports" ON public.reports;
CREATE POLICY "Staff can update reports" ON public.reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'moderator', 'staff')
        )
    );

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_moderation_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_moderation_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.moderation_threads 
    SET 
        last_message = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO public.moderation_threads (title, description, participants, created_by, thread_type, priority)
VALUES 
    ('General Staff Chat', 'Main communication channel for all staff members', ARRAY[(SELECT id::text FROM auth.users LIMIT 1)], (SELECT id FROM auth.users LIMIT 1), 'general', 'medium'),
    ('Incident Reports', 'Channel for discussing ongoing incidents and investigations', ARRAY[(SELECT id::text FROM auth.users LIMIT 1)], (SELECT id FROM auth.users LIMIT 1), 'incident', 'high')
ON CONFLICT DO NOTHING;

-- Note: Sample moderation rules insertion skipped due to unknown check constraint values
-- The moderation_rules table has a type_check constraint that limits allowed values
-- You can manually insert sample data after checking the constraint: 
-- SELECT constraint_name, check_clause FROM information_schema.check_constraints WHERE table_name = 'moderation_rules';

-- Insert sample spam patterns
INSERT INTO public.spam_patterns (pattern, type, severity, enabled)
VALUES 
    ('\\b(click here|free money|win now)\\b', 'regex', '8', true),
    ('\\b(viagra|cialis|pharmacy)\\b', 'regex', '9', true),
    ('\\b(bitcoin|crypto|investment)\\b', 'regex', '10', true)
ON CONFLICT DO NOTHING;