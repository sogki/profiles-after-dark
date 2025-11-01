-- Discord Bot Integration Tables Migration
-- This migration creates tables for Discord bot functionality and integration with the web app

-- Create discord_users table to link Discord users with web app users
CREATE TABLE IF NOT EXISTS public.discord_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discord_id TEXT NOT NULL UNIQUE,
    web_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    discriminator TEXT,
    avatar_url TEXT,
    guild_id TEXT NOT NULL,
    is_bot BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(discord_id, guild_id)
);

-- Create mod_cases table for Discord moderation cases
CREATE TABLE IF NOT EXISTS public.mod_cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id INTEGER NOT NULL,
    guild_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_tag TEXT NOT NULL,
    moderator_id TEXT NOT NULL,
    moderator_tag TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('ban', 'kick', 'warn', 'mute', 'timeout', 'unban', 'unmute')),
    reason TEXT,
    duration INTEGER, -- Duration in minutes for temporary actions
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary actions
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(case_id, guild_id)
);

-- Create mod_logs table for Discord moderation logs
CREATE TABLE IF NOT EXISTS public.mod_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    user_id TEXT,
    moderator_id TEXT,
    action TEXT NOT NULL,
    reason TEXT,
    channel_id TEXT,
    message_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Create modlogs_channels table to store per-guild modlog channel settings
CREATE TABLE IF NOT EXISTS public.modlogs_channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    channel_id TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deleted_messages table for message deletion logging
CREATE TABLE IF NOT EXISTS public.deleted_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    author_id TEXT,
    author_tag TEXT,
    content TEXT,
    attachments JSONB DEFAULT '[]',
    stickers JSONB DEFAULT '[]',
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_by TEXT, -- User who deleted (bot or moderator)
    cached BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'
);

-- Create discord_webhooks table for webhook configurations
CREATE TABLE IF NOT EXISTS public.discord_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('modlog', 'staff_action', 'notification', 'user_activity')),
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guild_settings table for per-guild bot settings
CREATE TABLE IF NOT EXISTS public.guild_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guild_id TEXT NOT NULL UNIQUE,
    prefix TEXT DEFAULT '!',
    modlog_channel_id TEXT,
    welcome_channel_id TEXT,
    auto_mod_enabled BOOLEAN DEFAULT FALSE,
    auto_mod_config JSONB DEFAULT '{}',
    command_permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discord_users_discord_id ON public.discord_users(discord_id);
CREATE INDEX IF NOT EXISTS idx_discord_users_web_user_id ON public.discord_users(web_user_id);
CREATE INDEX IF NOT EXISTS idx_discord_users_guild_id ON public.discord_users(guild_id);

CREATE INDEX IF NOT EXISTS idx_mod_cases_guild_id ON public.mod_cases(guild_id);
CREATE INDEX IF NOT EXISTS idx_mod_cases_case_id ON public.mod_cases(case_id);
CREATE INDEX IF NOT EXISTS idx_mod_cases_user_id ON public.mod_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_cases_moderator_id ON public.mod_cases(moderator_id);
CREATE INDEX IF NOT EXISTS idx_mod_cases_timestamp ON public.mod_cases(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mod_cases_action ON public.mod_cases(action);

CREATE INDEX IF NOT EXISTS idx_mod_logs_guild_id ON public.mod_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_user_id ON public.mod_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_moderator_id ON public.mod_logs(moderator_id);
CREATE INDEX IF NOT EXISTS idx_mod_logs_timestamp ON public.mod_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mod_logs_action ON public.mod_logs(action);

CREATE INDEX IF NOT EXISTS idx_modlogs_channels_guild_id ON public.modlogs_channels(guild_id);

CREATE INDEX IF NOT EXISTS idx_deleted_messages_guild_id ON public.deleted_messages(guild_id);
CREATE INDEX IF NOT EXISTS idx_deleted_messages_channel_id ON public.deleted_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_deleted_messages_author_id ON public.deleted_messages(author_id);
CREATE INDEX IF NOT EXISTS idx_deleted_messages_deleted_at ON public.deleted_messages(deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_deleted_messages_message_id ON public.deleted_messages(message_id);

CREATE INDEX IF NOT EXISTS idx_discord_webhooks_guild_id ON public.discord_webhooks(guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_webhooks_event_type ON public.discord_webhooks(event_type);

CREATE INDEX IF NOT EXISTS idx_guild_settings_guild_id ON public.guild_settings(guild_id);

-- Enable Row Level Security
ALTER TABLE public.discord_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mod_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mod_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modlogs_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discord_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discord_users
CREATE POLICY "Users can view their own Discord link" ON public.discord_users
    FOR SELECT USING (web_user_id = auth.uid());

CREATE POLICY "Service role can manage Discord users" ON public.discord_users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for mod_cases
CREATE POLICY "Service role can manage mod cases" ON public.mod_cases
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for mod_logs
CREATE POLICY "Service role can manage mod logs" ON public.mod_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for modlogs_channels
CREATE POLICY "Service role can manage modlog channels" ON public.modlogs_channels
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for deleted_messages
CREATE POLICY "Service role can manage deleted messages" ON public.deleted_messages
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for discord_webhooks
CREATE POLICY "Service role can manage webhooks" ON public.discord_webhooks
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for guild_settings
CREATE POLICY "Service role can manage guild settings" ON public.guild_settings
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_discord_users_updated_at BEFORE UPDATE ON public.discord_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modlogs_channels_updated_at BEFORE UPDATE ON public.modlogs_channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discord_webhooks_updated_at BEFORE UPDATE ON public.discord_webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guild_settings_updated_at BEFORE UPDATE ON public.guild_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

