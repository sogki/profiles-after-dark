-- Add support ticket functionality to feedback table
-- This migration adds support ticket type and additional fields for ticket management

-- First, drop the existing check constraint on type
ALTER TABLE public.feedback 
  DROP CONSTRAINT IF EXISTS feedback_type_check;

-- Add the new check constraint that includes 'support'
ALTER TABLE public.feedback 
  ADD CONSTRAINT feedback_type_check 
  CHECK (type IN ('general', 'bug', 'feature', 'improvement', 'support'));

-- Add priority column for support tickets (and other feedback)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback' 
    AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.feedback 
    ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
  END IF;
END $$;

-- Add assigned_to column for support tickets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback' 
    AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.feedback 
    ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add subject column for support tickets
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback' 
    AND column_name = 'subject'
  ) THEN
    ALTER TABLE public.feedback 
    ADD COLUMN subject TEXT;
  END IF;
END $$;

-- Add ticket_number column for support tickets (unique identifier)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'feedback' 
    AND column_name = 'ticket_number'
  ) THEN
    ALTER TABLE public.feedback 
    ADD COLUMN ticket_number TEXT UNIQUE;
  END IF;
END $$;

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_ticket_number TEXT;
  ticket_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate ticket number: TICKET-YYYYMMDD-XXXXX (5 random alphanumeric)
    new_ticket_number := 'TICKET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT || NOW()::TEXT) FROM 1 FOR 5));
    
    -- Check if ticket number already exists
    SELECT EXISTS(SELECT 1 FROM public.feedback WHERE ticket_number = new_ticket_number) INTO ticket_exists;
    
    -- Exit loop if ticket number is unique
    EXIT WHEN NOT ticket_exists;
  END LOOP;
  
  RETURN new_ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket numbers for support tickets
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set ticket number for support tickets that don't have one
  IF NEW.type = 'support' AND (NEW.ticket_number IS NULL OR NEW.ticket_number = '') THEN
    NEW.ticket_number := generate_ticket_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.feedback;
CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- Create indexes for support ticket queries
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON public.feedback(priority) WHERE priority IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_assigned_to ON public.feedback(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_ticket_number ON public.feedback(ticket_number) WHERE ticket_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_support_type ON public.feedback(type) WHERE type = 'support';

-- Add comments for documentation
COMMENT ON COLUMN public.feedback.priority IS 'Priority level: low, medium, high, or urgent. Used primarily for support tickets.';
COMMENT ON COLUMN public.feedback.assigned_to IS 'Staff member assigned to handle this ticket/feedback.';
COMMENT ON COLUMN public.feedback.subject IS 'Subject line for support tickets.';
COMMENT ON COLUMN public.feedback.ticket_number IS 'Unique ticket number for support tickets (format: TICKET-YYYYMMDD-XXXXX).';

