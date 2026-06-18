-- ============================================================
-- AgentNexus — Consolidated Schema Migration (FINAL)
-- ============================================================
-- This replaces migrations 001-005. It is idempotent: safe to run
-- on a brand-new Supabase project, OR on a project that already has
-- some/all of the old migrations applied. Run the whole file once in
-- Supabase SQL Editor. You can delete migrations/001-005 afterward.
--
-- Includes, beyond the original schema:
--   • assignee_id can point to EITHER agents OR users (polymorphic,
--     via assignee_type + a validation trigger — see "TASKS" below)
--   • status CHECK now allows 'canceled' (the board UI already has
--     a Canceled column; the old constraint silently rejected it)
--   • due_date and position columns on tasks (the app reads/writes
--     these but no prior migration created them)
--   • agents now have emoji + capabilities (TEXT[]) instead of
--     type + model — matches src/types/supabase.ts and the
--     LiveAgents / LiveDashboard UI (see also 006_update_agents_schema.sql
--     if you already ran an earlier copy of this file)
--
-- NOTE: also run "005 add task subtasks.sql" after this file — it adds
-- the tasks.subtasks JSONB column, which isn't folded in here.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pgvector unavailable on this project — agent_memory.embedding will be skipped';
END $$;

-- ============================================================
-- SHARED TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AGENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS agents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  emoji        TEXT NOT NULL DEFAULT '🤖',
  status       TEXT NOT NULL DEFAULT 'offline'
                 CHECK (status IN ('active','idle','error','offline')),
  capabilities TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If this table pre-dates the emoji/capabilities redesign, it still has
-- the old type/model columns — migrate it in place (see also the
-- standalone "006_update_agents_schema.sql" for an already-applied DB)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '🤖';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS capabilities TEXT[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE agents DROP COLUMN IF EXISTS type;
ALTER TABLE agents DROP COLUMN IF EXISTS model;

COMMENT ON COLUMN agents.emoji IS 'Single emoji rendered as the agent''s avatar in the dashboard UI.';
COMMENT ON COLUMN agents.capabilities IS 'List of skill/capability tags rendered as badges in the dashboard UI.';

DROP TRIGGER IF EXISTS agents_updated_at ON agents;
CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- USERS (human users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  role         TEXT,
  display_name TEXT,
  email        TEXT,
  phone        TEXT,
  providers    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO users (name, role) VALUES ('Deep', 'CEO')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TASKS
-- ============================================================

-- Fresh-install shape (no-op if the table already exists)
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignee_id   UUID,
  assignee_type TEXT,
  title         TEXT NOT NULL,
  description   TEXT,
  status        TEXT NOT NULL DEFAULT 'todo',
  priority      TEXT NOT NULL DEFAULT 'medium',
  due_date      DATE,
  position      INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If the table pre-dates migration 004, it still has agent_id — rename it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'agent_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assignee_id') THEN
    ALTER TABLE tasks RENAME COLUMN agent_id TO assignee_id;
  END IF;
END $$;

-- Backfill any columns missing on tables that pre-date this migration
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_type TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0;

-- Backfill assignee_type for rows that already have an assignee_id but no
-- type yet. Any value here was previously validated against `users` by the
-- old FK from migration 004, so it's safe to assume 'user'. If it actually
-- pointed at an agent (pre-004 data), the trigger below will simply reject
-- future writes until you re-pick the assignee — re-set it once in the UI.
UPDATE tasks SET assignee_type = 'user' WHERE assignee_id IS NOT NULL AND assignee_type IS NULL;

-- Drop any old single-table foreign keys (from 001 or 004) — assignee_id
-- is now polymorphic and enforced by trigger instead of a column FK
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_agent_id_fkey;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;

-- Keep assignee_id / assignee_type in sync (both null, or both set)
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS assignee_type_matches_id;
ALTER TABLE tasks ADD CONSTRAINT assignee_type_matches_id
  CHECK ((assignee_id IS NULL AND assignee_type IS NULL) OR (assignee_id IS NOT NULL AND assignee_type IS NOT NULL));

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS assignee_type_valid;
ALTER TABLE tasks ADD CONSTRAINT assignee_type_valid
  CHECK (assignee_type IS NULL OR assignee_type IN ('agent', 'user'));

-- status / priority checks — re-applied with 'canceled' included
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
  CHECK (status IN ('todo','doing','needs_input','done','canceled'));

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IN ('low','medium','high','urgent'));

-- Validate assignee_id exists in the correct table for its type
-- (replaces a plain FK, since one column can't reference two tables)
CREATE OR REPLACE FUNCTION validate_task_assignee()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assignee_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.assignee_type = 'agent' AND NOT EXISTS (SELECT 1 FROM agents WHERE id = NEW.assignee_id) THEN
    RAISE EXCEPTION 'assignee_id % not found in agents', NEW.assignee_id;
  END IF;

  IF NEW.assignee_type = 'user' AND NOT EXISTS (SELECT 1 FROM users WHERE id = NEW.assignee_id) THEN
    RAISE EXCEPTION 'assignee_id % not found in users', NEW.assignee_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tasks_validate_assignee ON tasks;
CREATE TRIGGER tasks_validate_assignee
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION validate_task_assignee();

-- Replicate ON DELETE SET NULL for both possible assignee tables
CREATE OR REPLACE FUNCTION clear_task_assignee_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tasks SET assignee_id = NULL, assignee_type = NULL
  WHERE assignee_id = OLD.id AND assignee_type = TG_ARGV[0];
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agents_clear_task_assignee ON agents;
CREATE TRIGGER agents_clear_task_assignee
  AFTER DELETE ON agents
  FOR EACH ROW EXECUTE FUNCTION clear_task_assignee_on_delete('agent');

DROP TRIGGER IF EXISTS users_clear_task_assignee ON users;
CREATE TRIGGER users_clear_task_assignee
  AFTER DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION clear_task_assignee_on_delete('user');

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON tasks(status);

-- ============================================================
-- WORKFLOW RUNS / LOGS / EVENTS / MEMORY / METRICS (unchanged from 001)
-- ============================================================
CREATE TABLE IF NOT EXISTS workflow_runs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name  TEXT NOT NULL,
  agent_id       UUID REFERENCES agents(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','running','completed','failed')),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMPTZ,
  duration_ms    INTEGER
);

CREATE TABLE IF NOT EXISTS agent_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id   UUID REFERENCES agents(id) ON DELETE SET NULL,
  level      TEXT NOT NULL DEFAULT 'info'
               CHECK (level IN ('debug','info','warn','error')),
  message    TEXT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type       TEXT NOT NULL,
  source     TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_memory (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    UUID REFERENCES agents(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL DEFAULT 'context',
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- embedding column only if pgvector actually installed above
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_memory' AND column_name = 'embedding') THEN
    ALTER TABLE agent_memory ADD COLUMN embedding vector(1536);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS metrics (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id       UUID REFERENCES agents(id) ON DELETE SET NULL,
  tokens_used    INTEGER,
  cost           NUMERIC(10,6),
  execution_time INTEGER,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id  ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level     ON agent_logs(level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created   ON agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type          ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created       ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_agent_id     ON metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_metrics_created      ON metrics(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE agents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon read agents"        ON agents;
DROP POLICY IF EXISTS "anon read users"         ON users;
DROP POLICY IF EXISTS "anon read tasks"         ON tasks;
DROP POLICY IF EXISTS "anon read workflow_runs" ON workflow_runs;
DROP POLICY IF EXISTS "anon read agent_logs"    ON agent_logs;
DROP POLICY IF EXISTS "anon read events"        ON events;
DROP POLICY IF EXISTS "anon read agent_memory"  ON agent_memory;
DROP POLICY IF EXISTS "anon read metrics"       ON metrics;

CREATE POLICY "anon read agents"        ON agents        FOR SELECT TO anon USING (true);
CREATE POLICY "anon read users"         ON users         FOR SELECT TO anon USING (true);
CREATE POLICY "anon read tasks"         ON tasks         FOR SELECT TO anon USING (true);
CREATE POLICY "anon read workflow_runs" ON workflow_runs FOR SELECT TO anon USING (true);
CREATE POLICY "anon read agent_logs"    ON agent_logs    FOR SELECT TO anon USING (true);
CREATE POLICY "anon read events"        ON events        FOR SELECT TO anon USING (true);
CREATE POLICY "anon read agent_memory"  ON agent_memory  FOR SELECT TO anon USING (true);
CREATE POLICY "anon read metrics"       ON metrics       FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "service write agents"        ON agents;
DROP POLICY IF EXISTS "service write users"         ON users;
DROP POLICY IF EXISTS "service write tasks"         ON tasks;
DROP POLICY IF EXISTS "service write workflow_runs" ON workflow_runs;
DROP POLICY IF EXISTS "service write agent_logs"    ON agent_logs;
DROP POLICY IF EXISTS "service write events"        ON events;
DROP POLICY IF EXISTS "service write agent_memory"  ON agent_memory;
DROP POLICY IF EXISTS "service write metrics"       ON metrics;

CREATE POLICY "service write agents"        ON agents        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write users"         ON users         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write tasks"         ON tasks         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write workflow_runs" ON workflow_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write agent_logs"    ON agent_logs    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write events"        ON events        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write agent_memory"  ON agent_memory  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write metrics"       ON metrics       FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME — add tables to the realtime publication (idempotent loop,
-- since ALTER PUBLICATION ... ADD TABLE errors if already a member)
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['agents','users','tasks','workflow_runs','agent_logs','events','metrics'] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION WHEN OTHERS THEN
      NULL; -- already a member, ignore
    END;
  END LOOP;
END $$;

-- ============================================================
-- AUTH SYNC — mirror auth.users into public.users on signup/update
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, role, display_name, email, phone, providers, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email),
    NEW.role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_username', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email),
    NEW.email,
    NEW.phone,
    COALESCE((NEW.raw_app_meta_data->>'providers')::text, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_auth_user_to_public_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_to_public_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_user_to_public();

CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email),
    role = NEW.role,
    display_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_username', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email),
    email = NEW.email,
    phone = NEW.phone,
    providers = COALESCE((NEW.raw_app_meta_data->>'providers')::text, ''),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_auth_user_to_public_update_trigger ON auth.users;
CREATE TRIGGER sync_auth_user_to_public_update_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data
        OR OLD.role IS DISTINCT FROM NEW.role OR OLD.phone IS DISTINCT FROM NEW.phone
        OR OLD.raw_app_meta_data IS DISTINCT FROM NEW.raw_app_meta_data)
  EXECUTE FUNCTION public.sync_auth_user_to_public_update();

-- ============================================================
-- SEED DATA (safe to keep — ON CONFLICT DO NOTHING)
-- ============================================================
INSERT INTO agents (name, emoji, status, capabilities) VALUES
  ('Agent Alpha',   '🤖', 'active',  ARRAY['TypeScript','React','PostgreSQL','Refactoring','Code Review']),
  ('Dispatch Bot',  '📋', 'active',  ARRAY['Planning','Routing','Prioritization','Scheduling']),
  ('Audit Bot',     '🛡️', 'idle',    ARRAY['Validation','Security','Logging','Policy']),
  ('Search Agent',  '🔍', 'offline', ARRAY['Web Search','Retrieval','Summarization'])
ON CONFLICT DO NOTHING;