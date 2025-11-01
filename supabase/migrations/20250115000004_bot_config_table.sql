-- Bot Configuration Table Migration
-- This migration creates a secure table for storing bot configuration keys

-- Create bot_config table for storing configuration values
CREATE TABLE IF NOT EXISTS public.bot_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK (category IN ('discord', 'supabase', 'api', 'general', 'external')),
    encrypted BOOLEAN DEFAULT FALSE,
    is_secret BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bot_config_key ON public.bot_config(key);
CREATE INDEX IF NOT EXISTS idx_bot_config_category ON public.bot_config(category);
CREATE INDEX IF NOT EXISTS idx_bot_config_updated_at ON public.bot_config(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Service role can manage all config" ON public.bot_config;
DROP POLICY IF EXISTS "Users can view non-secret config" ON public.bot_config;

-- RLS Policies for bot_config
-- Only service role can access all config values
CREATE POLICY "Service role can manage all config" ON public.bot_config
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Regular authenticated users cannot access secret config
CREATE POLICY "Users can view non-secret config" ON public.bot_config
    FOR SELECT USING (
        is_secret = FALSE AND
        auth.uid() IS NOT NULL
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bot_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_bot_config_updated_at ON public.bot_config;

-- Create trigger for updated_at
CREATE TRIGGER update_bot_config_updated_at 
    BEFORE UPDATE ON public.bot_config
    FOR EACH ROW 
    EXECUTE FUNCTION update_bot_config_updated_at();

-- Create function to get config value by key
CREATE OR REPLACE FUNCTION get_bot_config(p_key TEXT)
RETURNS TEXT AS $$
DECLARE
    v_value TEXT;
BEGIN
    SELECT value INTO v_value
    FROM public.bot_config
    WHERE key = p_key;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set config value
CREATE OR REPLACE FUNCTION set_bot_config(
    p_key TEXT,
    p_value TEXT,
    p_description TEXT DEFAULT NULL,
    p_category TEXT DEFAULT 'general',
    p_is_secret BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.bot_config (key, value, description, category, is_secret)
    VALUES (p_key, p_value, p_description, p_category, p_is_secret)
    ON CONFLICT (key) 
    DO UPDATE SET
        value = EXCLUDED.value,
        description = COALESCE(EXCLUDED.description, bot_config.description),
        category = EXCLUDED.category,
        is_secret = EXCLUDED.is_secret,
        updated_at = NOW()
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comment
COMMENT ON TABLE public.bot_config IS 'Stores bot configuration keys and values securely';
COMMENT ON COLUMN public.bot_config.key IS 'Configuration key name (e.g., DISCORD_TOKEN, SUPABASE_URL)';
COMMENT ON COLUMN public.bot_config.value IS 'Configuration value (should be encrypted for secrets)';
COMMENT ON COLUMN public.bot_config.is_secret IS 'Whether this value is secret and should not be logged';
COMMENT ON COLUMN public.bot_config.category IS 'Category of the configuration (discord, supabase, api, etc.)';

