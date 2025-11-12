-- Create storage buckets for emotes and wallpapers
-- This migration creates the storage buckets and sets up their policies

-- Insert storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('emotes', 'emotes', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']),
  ('wallpapers', 'wallpapers', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for emotes bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access for emotes" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload emotes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own emotes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own emotes" ON storage.objects;

-- Allow anyone to view emotes
CREATE POLICY "Public Access for emotes"
ON storage.objects FOR SELECT
USING (bucket_id = 'emotes');

-- Allow authenticated users to upload emotes
CREATE POLICY "Authenticated users can upload emotes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'emotes' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own emotes
CREATE POLICY "Users can update their own emotes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'emotes' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'emotes' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own emotes
CREATE POLICY "Users can delete their own emotes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'emotes' AND
  auth.role() = 'authenticated'
);

-- Create storage policies for wallpapers bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access for wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own wallpapers" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own wallpapers" ON storage.objects;

-- Allow anyone to view wallpapers
CREATE POLICY "Public Access for wallpapers"
ON storage.objects FOR SELECT
USING (bucket_id = 'wallpapers');

-- Allow authenticated users to upload wallpapers
CREATE POLICY "Authenticated users can upload wallpapers"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wallpapers' AND
  auth.role() = 'authenticated'
);

-- Allow users to update their own wallpapers
CREATE POLICY "Users can update their own wallpapers"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'wallpapers' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'wallpapers' AND
  auth.role() = 'authenticated'
);

-- Allow users to delete their own wallpapers
CREATE POLICY "Users can delete their own wallpapers"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wallpapers' AND
  auth.role() = 'authenticated'
);

