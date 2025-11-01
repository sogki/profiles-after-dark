-- Add Emotes and Wallpapers tables
-- This migration adds tables for emotes and wallpapers content types

-- Create emotes table
CREATE TABLE IF NOT EXISTS public.emotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create wallpapers table
CREATE TABLE IF NOT EXISTS public.wallpapers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    resolution TEXT, -- e.g., "1920x1080", "2560x1440"
    tags TEXT[] DEFAULT '{}',
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emotes_user_id ON public.emotes (user_id);
CREATE INDEX IF NOT EXISTS idx_emotes_category ON public.emotes (category);
CREATE INDEX IF NOT EXISTS idx_emotes_created_at ON public.emotes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotes_download_count ON public.emotes (download_count DESC);
CREATE INDEX IF NOT EXISTS idx_emotes_tags ON public.emotes USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_wallpapers_user_id ON public.wallpapers (user_id);
CREATE INDEX IF NOT EXISTS idx_wallpapers_category ON public.wallpapers (category);
CREATE INDEX IF NOT EXISTS idx_wallpapers_created_at ON public.wallpapers (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallpapers_download_count ON public.wallpapers (download_count DESC);
CREATE INDEX IF NOT EXISTS idx_wallpapers_tags ON public.wallpapers USING GIN (tags);

-- Enable RLS
ALTER TABLE public.emotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for emotes
DROP POLICY IF EXISTS "Anyone can view emotes" ON public.emotes;
CREATE POLICY "Anyone can view emotes" ON public.emotes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create emotes" ON public.emotes;
CREATE POLICY "Users can create emotes" ON public.emotes
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own emotes" ON public.emotes;
CREATE POLICY "Users can update their own emotes" ON public.emotes
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own emotes" ON public.emotes;
CREATE POLICY "Users can delete their own emotes" ON public.emotes
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for wallpapers
DROP POLICY IF EXISTS "Anyone can view wallpapers" ON public.wallpapers;
CREATE POLICY "Anyone can view wallpapers" ON public.wallpapers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create wallpapers" ON public.wallpapers;
CREATE POLICY "Users can create wallpapers" ON public.wallpapers
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own wallpapers" ON public.wallpapers;
CREATE POLICY "Users can update their own wallpapers" ON public.wallpapers
    FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own wallpapers" ON public.wallpapers;
CREATE POLICY "Users can delete their own wallpapers" ON public.wallpapers
    FOR DELETE USING (user_id = auth.uid());

-- Update favorites table to support emotes and wallpapers
ALTER TABLE public.favorites 
ADD COLUMN IF NOT EXISTS emote_id UUID REFERENCES public.emotes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS wallpaper_id UUID REFERENCES public.wallpapers(id) ON DELETE CASCADE;

-- Create indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_favorites_emote_id ON public.favorites (emote_id);
CREATE INDEX IF NOT EXISTS idx_favorites_wallpaper_id ON public.favorites (wallpaper_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_emotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_wallpapers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
DROP TRIGGER IF EXISTS update_emotes_updated_at ON public.emotes;
CREATE TRIGGER update_emotes_updated_at
    BEFORE UPDATE ON public.emotes
    FOR EACH ROW
    EXECUTE FUNCTION update_emotes_updated_at();

DROP TRIGGER IF EXISTS update_wallpapers_updated_at ON public.wallpapers;
CREATE TRIGGER update_wallpapers_updated_at
    BEFORE UPDATE ON public.wallpapers
    FOR EACH ROW
    EXECUTE FUNCTION update_wallpapers_updated_at();
