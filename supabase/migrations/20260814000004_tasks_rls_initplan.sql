DROP POLICY IF EXISTS "tasks_update" ON tasks;
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE TO authenticated
  USING (created_by = (select auth.uid()) OR assigned_to = (select auth.uid()))
  WITH CHECK (created_by = (select auth.uid()) OR assigned_to = (select auth.uid()));

DROP POLICY IF EXISTS "tasks_delete" ON tasks;
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE TO authenticated
  USING (created_by = (select auth.uid()) OR assigned_to = (select auth.uid()));