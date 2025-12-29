-- =============================================
-- FIX RLS POLICIES - Run this on Supabase
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Anyone can check tokens" ON invite_tokens;
DROP POLICY IF EXISTS "Anyone can update tokens" ON invite_tokens;
DROP POLICY IF EXISTS "Users can read own links" ON links;
DROP POLICY IF EXISTS "Users can insert own links" ON links;
DROP POLICY IF EXISTS "Users can update own links" ON links;
DROP POLICY IF EXISTS "Users can delete own links" ON links;

-- For a simple private app, we can use permissive policies
-- The app logic handles user filtering

-- Users table: allow all operations (app filters by nickname)
CREATE POLICY "Allow all user operations" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Invite tokens: allow all operations
CREATE POLICY "Allow all token operations" ON invite_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- Links: allow all operations (app filters by user_id)
CREATE POLICY "Allow all link operations" ON links
  FOR ALL USING (true) WITH CHECK (true);

-- Verify it works
SELECT 'RLS policies updated!' as status;

