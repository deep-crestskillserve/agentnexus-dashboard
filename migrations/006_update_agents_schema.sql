-- ============================================================
-- Update AGENTS table to: id, name, emoji, status, capabilities,
-- created_at, updated_at
-- ============================================================
-- The dashboard's agent UI (LiveAgents / LiveDashboard) is moving from
-- a free-text "type" + "model" pair to an emoji avatar plus a list of
-- capability tags. This migration is idempotent — safe to run even if
-- you've already applied it, and safe regardless of whether your
-- agents table still has the original type/model columns.
--
-- Run this in Supabase SQL Editor AFTER 000_base.sql and
-- "005 add task subtasks.sql".
-- ============================================================

-- 1. Add the new columns (defaults keep existing INSERTs from other
--    services working without modification)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '🤖';
ALTER TABLE agents ADD COLUMN IF NOT EXISTS capabilities TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN agents.emoji IS 'Single emoji rendered as the agent''s avatar in the dashboard UI.';
COMMENT ON COLUMN agents.capabilities IS 'List of skill/capability tags rendered as badges in the dashboard UI.';

-- 2. Backfill friendlier values for the known seed agents (no-op for
--    rows that don't match these names, e.g. agents you've added since)
UPDATE agents SET emoji = '🤖',
  capabilities = ARRAY['TypeScript','React','PostgreSQL','Refactoring','Code Review']
  WHERE name = 'Agent Alpha' AND capabilities = '{}'::text[];

UPDATE agents SET emoji = '📋',
  capabilities = ARRAY['Planning','Routing','Prioritization','Scheduling']
  WHERE name = 'Dispatch Bot' AND capabilities = '{}'::text[];

UPDATE agents SET emoji = '🛡️',
  capabilities = ARRAY['Validation','Security','Logging','Policy']
  WHERE name = 'Audit Bot' AND capabilities = '{}'::text[];

UPDATE agents SET emoji = '🔍',
  capabilities = ARRAY['Web Search','Retrieval','Summarization']
  WHERE name = 'Search Agent' AND capabilities = '{}'::text[];

-- 3. Drop the now-superseded columns. Any "type"/"model" data not
--    captured above is intentionally discarded — pull it from
--    Supabase's table editor first if you need to keep it.
ALTER TABLE agents DROP COLUMN IF EXISTS type;
ALTER TABLE agents DROP COLUMN IF EXISTS model;

-- 4. Final shape check (purely informational — view the output in the
--    SQL Editor results pane after running this file)
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'agents' ORDER BY ordinal_position;
