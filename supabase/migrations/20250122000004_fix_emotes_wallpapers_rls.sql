-- Fix RLS policies for emotes and wallpapers tables
-- This ensures authenticated users can insert their own content

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view emotes" ON public.emotes;
DROP POLICY IF EXISTS "Users can create emotes" ON public.emotes;
DROP POLICY IF EXISTS "Users can update their own emotes" ON public.emotes;
DROP POLICY IF EXISTS "Users can delete their own emotes" ON public.emotes;

DROP POLICY IF EXISTS "Anyone can view wallpapers" ON public.wallpapers;
DROP POLICY IF EXISTS "Users can create wallpapers" ON public.wallpapers;
DROP POLICY IF EXISTS "Users can update their own wallpapers" ON public.wallpapers;
DROP POLICY IF EXISTS "Users can delete their own wallpapers" ON public.wallpapers;

-- Recreate RLS policies for emotes
-- Anyone can view emotes
CREATE POLICY "Anyone can view emotes" ON public.emotes
    FOR SELECT USING (true);

-- Authenticated users can create emotes (user_id must match auth.uid())
CREATE POLICY "Users can create emotes" ON public.emotes
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = auth.uid()
    );

-- Users can update their own emotes
CREATE POLICY "Users can update their own emotes" ON public.emotes
    FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own emotes
CREATE POLICY "Users can delete their own emotes" ON public.emotes
    FOR DELETE USING (user_id = auth.uid());

-- Recreate RLS policies for wallpapers
-- Anyone can view wallpapers
CREATE POLICY "Anyone can view wallpapers" ON public.wallpapers
    FOR SELECT USING (true);

-- Authenticated users can create wallpapers (user_id must match auth.uid())
CREATE POLICY "Users can create wallpapers" ON public.wallpapers
    FOR INSERT 
    WITH CHECK (
        auth.uid() IS NOT NULL AND
        user_id = auth.uid()
    );

-- Users can update their own wallpapers
CREATE POLICY "Users can update their own wallpapers" ON public.wallpapers
    FOR UPDATE 
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own wallpapers
CREATE POLICY "Users can delete their own wallpapers" ON public.wallpapers
    FOR DELETE USING (user_id = auth.uid());

