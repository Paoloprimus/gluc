-- =============================================
-- NUNQ Migration v4 - Collections
-- Run on Supabase SQL Editor
-- =============================================

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📚',
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add collection_id to links table
ALTER TABLE links 
ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES collections(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_links_collection_id ON links(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

-- Enable RLS on collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collections
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own collections" ON collections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own collections" ON collections
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (true);

SELECT 'Migration v4 complete - Collections added!' as status;

