-- ============================================================
-- OpenClaw Agent Control Center — Supabase Migration
-- Run this in your Supabase SQL editor (Database → SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";  -- optional, for agent_memory embeddings

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS agents (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'generic',
  status      TEXT NOT NULL DEFAULT 'offline'
                CHECK (status IN ('active','idle','error','offline')),
  model       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id    UUID REFERENCES agents(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'todo'
                CHECK (status IN ('todo','doing','needs_input','done')),
  priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high','urgent')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  embedding   vector(1536),   -- nullable; remove if pgvector not available
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS metrics (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id       UUID REFERENCES agents(id) ON DELETE SET NULL,
  tokens_used    INTEGER,
  cost           NUMERIC(10,6),
  execution_time INTEGER,   -- milliseconds
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tasks_agent_id      ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_id  ON agent_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_level     ON agent_logs(level);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created   ON agent_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_type          ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created       ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_agent_id     ON metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_metrics_created      ON metrics(created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE agents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory  ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics       ENABLE ROW LEVEL SECURITY;

-- Dashboard (anon) can read everything
CREATE POLICY "anon read agents"        ON agents        FOR SELECT TO anon USING (true);
CREATE POLICY "anon read tasks"         ON tasks         FOR SELECT TO anon USING (true);
CREATE POLICY "anon read workflow_runs" ON workflow_runs  FOR SELECT TO anon USING (true);
CREATE POLICY "anon read agent_logs"    ON agent_logs    FOR SELECT TO anon USING (true);
CREATE POLICY "anon read events"        ON events        FOR SELECT TO anon USING (true);
CREATE POLICY "anon read agent_memory"  ON agent_memory  FOR SELECT TO anon USING (true);
CREATE POLICY "anon read metrics"       ON metrics       FOR SELECT TO anon USING (true);

-- Service role (OpenClaw API) can do everything (bypasses RLS by default,
-- but explicit policies make intent clear)
CREATE POLICY "service write agents"        ON agents        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write tasks"         ON tasks         FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write workflow_runs" ON workflow_runs  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write agent_logs"    ON agent_logs    FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write events"        ON events        FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write agent_memory"  ON agent_memory  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service write metrics"       ON metrics       FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- REALTIME — add tables to the realtime publication
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_runs;
ALTER PUBLICATION supabase_realtime ADD TABLE agent_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE metrics;

-- ============================================================
-- SEED DATA (optional — remove for production)
-- ============================================================

INSERT INTO agents (name, type, status, model) VALUES
  ('Agent Alpha',   'code',        'active',  'claude-sonnet-4-6'),
  ('Dispatch Bot',  'coordinator', 'active',  'claude-haiku-4-5-20251001'),
  ('Audit Bot',     'quality',     'idle',    'claude-opus-4-6'),
  ('Search Agent',  'retrieval',   'offline', NULL)
ON CONFLICT DO NOTHING;
