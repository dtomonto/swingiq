-- ============================================================
-- SwingVantage — Supabase Row Level Security (RLS) Migrations
--
-- Run this file in the Supabase SQL Editor (or via CLI:
--   supabase db push) to enforce per-user data isolation.
--
-- Every table uses a user_id column that must equal auth.uid()
-- for all read and write operations.
-- ============================================================

-- ── golfer_profiles ─────────────────────────────────────────

ALTER TABLE golfer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON golfer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON golfer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON golfer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" ON golfer_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ── clubs ────────────────────────────────────────────────────

ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clubs" ON clubs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clubs" ON clubs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clubs" ON clubs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clubs" ON clubs
  FOR DELETE USING (auth.uid() = user_id);

-- ── sessions ─────────────────────────────────────────────────

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- ── shots ────────────────────────────────────────────────────

ALTER TABLE shots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shots" ON shots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shots" ON shots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shots" ON shots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shots" ON shots
  FOR DELETE USING (auth.uid() = user_id);

-- ── golf_bags ────────────────────────────────────────────────

ALTER TABLE golf_bags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own golf bags" ON golf_bags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own golf bags" ON golf_bags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own golf bags" ON golf_bags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own golf bags" ON golf_bags
  FOR DELETE USING (auth.uid() = user_id);
