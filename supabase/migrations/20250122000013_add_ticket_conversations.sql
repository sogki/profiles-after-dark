-- Add conversation system for support tickets
-- This migration adds a ticket_conversations table for chat-like interactions

-- Create ticket_conversations table for chat messages
CREATE TABLE IF NOT EXISTS public.ticket_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.feedback(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_staff BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ticket_conversations_ticket_id ON public.ticket_conversations(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_conversations_user_id ON public.ticket_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_conversations_created_at ON public.ticket_conversations(created_at DESC);

-- Add owner_id column to feedback table (replaces assigned_to for ownership)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback' 
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.feedback 
    ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add is_locked column to prevent multiple staff from accessing the same ticket
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback' 
    AND column_name = 'is_locked'
  ) THEN
    ALTER TABLE public.feedback 
    ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add locked_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback' 
    AND column_name = 'locked_at'
  ) THEN
    ALTER TABLE public.feedback 
    ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create index on owner_id
CREATE INDEX IF NOT EXISTS idx_feedback_owner_id ON public.feedback(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_is_locked ON public.feedback(is_locked) WHERE is_locked = TRUE;

-- Create function to auto-lock ticket when first staff response is added
CREATE OR REPLACE FUNCTION lock_ticket_on_first_staff_response()
RETURNS TRIGGER AS $$
DECLARE
  ticket_owner UUID;
  ticket_locked BOOLEAN;
BEGIN
  -- Only process if this is a staff message
  IF NEW.is_staff = TRUE THEN
    -- Get current ticket state
    SELECT owner_id, is_locked INTO ticket_owner, ticket_locked
    FROM public.feedback
    WHERE id = NEW.ticket_id;
    
    -- If ticket is not locked, lock it and assign to the staff member
    IF ticket_locked = FALSE OR ticket_owner IS NULL THEN
      UPDATE public.feedback
      SET 
        owner_id = NEW.user_id,
        is_locked = TRUE,
        locked_at = NOW(),
        assigned_to = NEW.user_id
      WHERE id = NEW.ticket_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-lock tickets
DROP TRIGGER IF EXISTS trigger_lock_ticket_on_staff_response ON public.ticket_conversations;
CREATE TRIGGER trigger_lock_ticket_on_staff_response
  AFTER INSERT ON public.ticket_conversations
  FOR EACH ROW
  EXECUTE FUNCTION lock_ticket_on_first_staff_response();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_ticket_conversation_updated_at
    BEFORE UPDATE ON public.ticket_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_conversation_updated_at();

-- Enable RLS
ALTER TABLE public.ticket_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_conversations
-- Users can view conversations for their own tickets
CREATE POLICY "Users can view their own ticket conversations"
    ON public.ticket_conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.feedback
            WHERE feedback.id = ticket_conversations.ticket_id
            AND feedback.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.feedback
            WHERE feedback.id = ticket_conversations.ticket_id
            AND (feedback.owner_id = auth.uid() OR feedback.assigned_to = auth.uid())
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_profiles
            WHERE user_profiles.user_id = auth.uid()
            AND user_profiles.role IN ('admin', 'moderator', 'staff')
        )
    );

-- Users can create messages for their own tickets
CREATE POLICY "Users can create messages for their own tickets"
    ON public.ticket_conversations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.feedback
            WHERE feedback.id = ticket_conversations.ticket_id
            AND feedback.user_id = auth.uid()
        )
        OR
        (
            ticket_conversations.is_staff = TRUE
            AND EXISTS (
                SELECT 1 FROM public.user_profiles
                WHERE user_profiles.user_id = auth.uid()
                AND user_profiles.role IN ('admin', 'moderator', 'staff')
            )
            AND EXISTS (
                SELECT 1 FROM public.feedback
                WHERE feedback.id = ticket_conversations.ticket_id
                AND (feedback.owner_id = auth.uid() OR feedback.assigned_to = auth.uid() OR feedback.owner_id IS NULL)
            )
        )
    );

-- Staff can update their own messages
CREATE POLICY "Staff can update their own messages"
    ON public.ticket_conversations
    FOR UPDATE
    USING (
        user_id = auth.uid()
        AND is_staff = TRUE
    );

-- Staff can delete their own messages
CREATE POLICY "Staff can delete their own messages"
    ON public.ticket_conversations
    FOR DELETE
    USING (
        user_id = auth.uid()
        AND is_staff = TRUE
    );

-- Add comments for documentation
COMMENT ON TABLE public.ticket_conversations IS 'Chat-like conversation messages for support tickets';
COMMENT ON COLUMN public.feedback.owner_id IS 'Staff member who owns/locked this ticket. Only they (or admins) can respond.';
COMMENT ON COLUMN public.feedback.is_locked IS 'Whether this ticket is locked to a specific staff member.';
COMMENT ON COLUMN public.feedback.locked_at IS 'Timestamp when the ticket was locked to a staff member.';

