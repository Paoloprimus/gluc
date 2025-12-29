-- =============================================
-- NUNQ Storage Setup - Run on Supabase SQL Editor
-- =============================================

-- Create a storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to thumbnails
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

-- Allow authenticated uploads (we use anon key, so allow all inserts)
CREATE POLICY "Allow uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'thumbnails');

-- Allow delete
CREATE POLICY "Allow delete" ON storage.objects
FOR DELETE USING (bucket_id = 'thumbnails');

SELECT 'Storage bucket created!' as status;

