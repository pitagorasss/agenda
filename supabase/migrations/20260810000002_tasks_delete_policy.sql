-- Allow any authenticated user to delete tasks (UI already controls who sees the delete button)
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (true);
