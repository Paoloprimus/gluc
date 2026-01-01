-- Add media columns for audio/video support
-- Run this migration in Supabase SQL Editor

-- Add media_url column for storing audio/video file URLs
ALTER TABLE links ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Add media_type column for storing MIME type (audio/mp3, video/mp4, etc.)
ALTER TABLE links ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Create media storage bucket (run in Supabase Dashboard > Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Storage policy for media bucket (run after creating bucket)
-- CREATE POLICY "Users can upload media" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.role() = 'anon');
-- CREATE POLICY "Public can read media" ON storage.objects
--   FOR SELECT USING (bucket_id = 'media');

-- Note: You also need to create the 'media' bucket in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket called 'media'
-- 3. Make it public
-- 4. Set file size limit to 50MB (for videos)

