-- Account Linking Codes Migration
-- This migration creates a table for one-time use codes to link Discord accounts with website accounts

-- ==========================================
-- TABLE: account_linking_codes
-- Purpose: Store one-time use codes for linking Discord accounts
-- ==========================================
CREATE TABLE IF NOT EXISTS public.account_linking_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    discord_id TEXT, -- Set when code is used
    used BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_account_linking_codes_code ON public.account_linking_codes(code);
CREATE INDEX IF NOT EXISTS idx_account_linking_codes_user_id ON public.account_linking_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_account_linking_codes_discord_id ON public.account_linking_codes(discord_id);
CREATE INDEX IF NOT EXISTS idx_account_linking_codes_expires_at ON public.account_linking_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_account_linking_codes_used ON public.account_linking_codes(used);

-- RLS Policies
ALTER TABLE public.account_linking_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own codes
CREATE POLICY "Users can view their own linking codes" ON public.account_linking_codes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own codes
CREATE POLICY "Users can create their own linking codes" ON public.account_linking_codes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role can manage all codes
CREATE POLICY "Service role can manage linking codes" ON public.account_linking_codes
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to clean up expired codes (runs automatically)
CREATE OR REPLACE FUNCTION cleanup_expired_linking_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.account_linking_codes
    WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically clean up expired codes on insert/update
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_codes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM cleanup_expired_linking_codes();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_expired_codes_trigger
    AFTER INSERT OR UPDATE ON public.account_linking_codes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_expired_codes();

-- Comments
COMMENT ON TABLE public.account_linking_codes IS 'One-time use codes for linking Discord accounts with website accounts';
COMMENT ON COLUMN public.account_linking_codes.code IS 'Unique code that users enter in Discord to link accounts';
COMMENT ON COLUMN public.account_linking_codes.user_id IS 'Website user ID that the code belongs to';
COMMENT ON COLUMN public.account_linking_codes.discord_id IS 'Discord user ID (set when code is used)';
COMMENT ON COLUMN public.account_linking_codes.used IS 'Whether the code has been used';
COMMENT ON COLUMN public.account_linking_codes.expires_at IS 'When the code expires (default 15 minutes)';

