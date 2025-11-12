-- Create account_backups table
CREATE TABLE IF NOT EXISTS public.account_backups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    backup_data JSONB NOT NULL,
    version TEXT DEFAULT '1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    restored_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('general', 'bug', 'feature', 'improvement')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    response TEXT,
    user_agent TEXT,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_account_backups_user_id ON public.account_backups(user_id);
CREATE INDEX IF NOT EXISTS idx_account_backups_created_at ON public.account_backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON public.feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_reviewed_by ON public.feedback(reviewed_by);

-- Enable RLS
ALTER TABLE public.account_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for account_backups
-- Users can only see their own backups
CREATE POLICY "Users can view their own backups"
    ON public.account_backups
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own backups
CREATE POLICY "Users can create their own backups"
    ON public.account_backups
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own backups
CREATE POLICY "Users can update their own backups"
    ON public.account_backups
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own backups
CREATE POLICY "Users can delete their own backups"
    ON public.account_backups
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for feedback
-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
    ON public.feedback
    FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('admin', 'moderator', 'staff')
    ));

-- Anyone authenticated can create feedback
CREATE POLICY "Authenticated users can create feedback"
    ON public.feedback
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Only staff can update feedback
CREATE POLICY "Staff can update feedback"
    ON public.feedback
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('admin', 'moderator', 'staff')
    ));

-- Only staff can delete feedback
CREATE POLICY "Staff can delete feedback"
    ON public.feedback
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.role IN ('admin', 'moderator', 'staff')
    ));

-- Create function to update updated_at timestamp for feedback
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback updated_at
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

