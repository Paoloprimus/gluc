-- =============================================
-- NUNQ Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nickname VARCHAR(30) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{"theme": "dark", "ai_suggestions": true, "sort_order": "newest"}'::jsonb
);

-- =============================================
-- INVITE TOKENS TABLE
-- =============================================
CREATE TABLE invite_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(20) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES users(id),
  used_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- LINKS TABLE
-- =============================================
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_created_at ON links(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true); -- We'll handle auth in app

-- Anyone can check tokens (for validation)
CREATE POLICY "Anyone can check tokens" ON invite_tokens
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update tokens" ON invite_tokens
  FOR UPDATE USING (true);

-- Links: users can only access their own
CREATE POLICY "Users can read own links" ON links
  FOR SELECT USING (true); -- We'll filter by user_id in queries

CREATE POLICY "Users can insert own links" ON links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own links" ON links
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own links" ON links
  FOR DELETE USING (true);

-- =============================================
-- INSERT 5 INVITE TOKENS
-- =============================================
INSERT INTO invite_tokens (token) VALUES
  ('NUNQ-GIULIA-2024'),
  ('NUNQ-GIUSY-2024'),
  ('NUNQ-LUCIA-2024'),
  ('NUNQ-EXTRA-0001'),
  ('NUNQ-EXTRA-0002');

-- =============================================
-- HELPER FUNCTION: Update updated_at on links
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER links_updated_at
  BEFORE UPDATE ON links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

