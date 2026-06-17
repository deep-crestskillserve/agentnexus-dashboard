-- ============================================================
-- Add subtasks persistence to tasks
-- ============================================================
--
-- The Kanban board's subtask checklist (add/check/delete) was always
-- client-state only — rowToTask() hard-coded `subtasks: []` and
-- persistTask() never included a `subtasks` key in its DB patch,
-- because no prior migration ever created a column for it. Anything
-- added disappeared on refresh and never showed up in the database.
--
-- This adds a JSONB column to actually store it.
-- ============================================================
 
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtasks JSONB NOT NULL DEFAULT '[]'::jsonb;
 
COMMENT ON COLUMN tasks.subtasks IS
  'Array of {id, title, completed} objects rendered as the task''s checklist.';