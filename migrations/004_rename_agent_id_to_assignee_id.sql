-- ============================================================
-- Rename agent_id to assignee_id in tasks table and reference users table
-- ============================================================

-- Rename the column
ALTER TABLE tasks 
  RENAME COLUMN agent_id TO assignee_id;

-- Drop the old foreign key constraint (if it exists) and add a new one referencing users
-- Note: The constraint name may vary; we attempt to drop by a common pattern.
-- If this fails, you may need to manually drop the constraint using its actual name.
ALTER TABLE tasks 
  DROP CONSTRAINT IF EXISTS tasks_agent_id_fkey,
  ADD CONSTRAINT tasks_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL;