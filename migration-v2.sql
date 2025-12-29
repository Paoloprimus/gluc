-- =============================================
-- NUNQ v2 Migration - Run on Supabase SQL Editor
-- =============================================

-- Add new columns to links table
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS custom_thumbnail TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_type VARCHAR(20) DEFAULT 'original';

-- thumbnail_type can be: 'original', 'custom', 'emoji'
-- status can be: 'draft', 'published'

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_links_click_count ON links(click_count DESC);
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);

-- Verify
SELECT 'Migration v2 completed!' as status;

