-- Open tasks update (mark as complete/pending/observation) to any authenticated user
DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);