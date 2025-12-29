-- =============================================
-- NUNQ Migration v3 - Add post_type column
-- Run on Supabase SQL Editor
-- =============================================

-- Add post_type column with default 'link' for existing rows
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'link';

-- Add constraint to validate post_type values
ALTER TABLE links 
DROP CONSTRAINT IF EXISTS valid_post_type;

ALTER TABLE links 
ADD CONSTRAINT valid_post_type 
CHECK (post_type IN ('link', 'image', 'text'));

-- Make url nullable (for image/text only posts)
ALTER TABLE links 
ALTER COLUMN url DROP NOT NULL;

SELECT 'Migration v3 complete!' as status;

