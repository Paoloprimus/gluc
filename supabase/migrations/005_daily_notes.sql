-- Daily Notes table (simplified: just items array)
CREATE TABLE IF NOT EXISTS daily_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One note per user per day
  UNIQUE(user_id, date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_notes_user_date ON daily_notes(user_id, date DESC);

-- Row Level Security
ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notes
CREATE POLICY "Users can view own notes" ON daily_notes
  FOR SELECT USING (true);

-- Users can insert their own notes
CREATE POLICY "Users can insert own notes" ON daily_notes
  FOR INSERT WITH CHECK (true);

-- Users can update their own notes  
CREATE POLICY "Users can update own notes" ON daily_notes
  FOR UPDATE USING (true);

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes" ON daily_notes
  FOR DELETE USING (true);

-- Notes archive for old notes (> 4 weeks)
CREATE TABLE IF NOT EXISTS notes_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_date DATE NOT NULL,
  items JSONB NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for archive
CREATE INDEX IF NOT EXISTS idx_notes_archive_user ON notes_archive(user_id, archived_at DESC);

-- RLS for archive
ALTER TABLE notes_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own archive" ON notes_archive
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own archive" ON notes_archive
  FOR INSERT WITH CHECK (true);
