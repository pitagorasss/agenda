-- Add ON DELETE SET NULL to tasks.category_id foreign key
-- This allows deleting a category without failing due to existing tasks
-- Tasks will simply have their category_id set to NULL

ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_category_id_fkey;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES task_categories(id)
  ON DELETE SET NULL;
