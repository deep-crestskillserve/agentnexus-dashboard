-- ============================================================
-- Add users table for recording human user (Deep)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  role        TEXT,
  display_name TEXT,
  email       TEXT,
  phone       TEXT,
  providers   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anon to read users
CREATE POLICY "anon read users" ON users FOR SELECT TO anon USING (true);

-- Allow service_role to write users (bypass RLS by default, but explicit)
CREATE POLICY "service write users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Insert the human record for Deep
INSERT INTO users (name, role) VALUES ('Deep', 'CEO')
ON CONFLICT DO NOTHING;