-- ============================================================
-- 1) Índices em FKs e colunas usadas em filtros/ordenação
-- ============================================================
CREATE INDEX IF NOT EXISTS tasks_date_idx ON public.tasks (date);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_date_idx ON public.tasks (assigned_to, date);
CREATE INDEX IF NOT EXISTS tasks_category_id_idx ON public.tasks (category_id);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON public.tasks (created_by);
CREATE INDEX IF NOT EXISTS tasks_completed_by_idx ON public.tasks (completed_by);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_task_id_idx ON public.notifications (task_id);
CREATE INDEX IF NOT EXISTS notifications_actor_id_idx ON public.notifications (actor_id);

CREATE INDEX IF NOT EXISTS evolution_observations_responsible_id_idx ON public.evolution_observations (responsible_id);
CREATE INDEX IF NOT EXISTS evolution_observations_created_by_idx ON public.evolution_observations (created_by);

CREATE INDEX IF NOT EXISTS routine_slots_user_id_idx ON public.routine_slots (user_id);
CREATE INDEX IF NOT EXISTS routine_slots_created_by_idx ON public.routine_slots (created_by);

CREATE INDEX IF NOT EXISTS routine_slot_completions_user_id_idx ON public.routine_slot_completions (user_id);
CREATE INDEX IF NOT EXISTS routine_slot_completions_user_date_idx ON public.routine_slot_completions (user_id, date);
CREATE INDEX IF NOT EXISTS routine_slot_completions_created_by_idx ON public.routine_slot_completions (created_by);

CREATE INDEX IF NOT EXISTS task_categories_created_by_idx ON public.task_categories (created_by);

-- ============================================================
-- 2) forecast_date / forecast_time: TEXT -> DATE / TIME
--    (dados validados: nenhum valor inválido)
-- ============================================================
ALTER TABLE public.tasks ALTER COLUMN forecast_date TYPE date USING (forecast_date::date);
ALTER TABLE public.tasks ALTER COLUMN forecast_time TYPE time USING (forecast_time::time);

-- ============================================================
-- 3) Remove coluna redundante category_color (join já traz a cor)
-- ============================================================
ALTER TABLE public.tasks DROP COLUMN IF EXISTS category_color;

-- ============================================================
-- 4) RLS initplan em políticas que usam auth.uid() por linha
-- ============================================================
-- task_categories
DROP POLICY IF EXISTS "task_categories_select" ON public.task_categories;
CREATE POLICY "task_categories_select" ON public.task_categories
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "task_categories_insert" ON public.task_categories;
CREATE POLICY "task_categories_insert" ON public.task_categories
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "task_categories_update" ON public.task_categories;
CREATE POLICY "task_categories_update" ON public.task_categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "task_categories_delete" ON public.task_categories;
CREATE POLICY "task_categories_delete" ON public.task_categories
  FOR DELETE TO authenticated USING (true);

-- evolution_observations
DROP POLICY IF EXISTS "evolution_select" ON public.evolution_observations;
CREATE POLICY "evolution_select" ON public.evolution_observations
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "evolution_insert" ON public.evolution_observations;
CREATE POLICY "evolution_insert" ON public.evolution_observations
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "evolution_update" ON public.evolution_observations;
CREATE POLICY "evolution_update" ON public.evolution_observations
  FOR UPDATE TO authenticated USING (created_by = (select auth.uid())) WITH CHECK (created_by = (select auth.uid()));
DROP POLICY IF EXISTS "evolution_delete" ON public.evolution_observations;
CREATE POLICY "evolution_delete" ON public.evolution_observations
  FOR DELETE TO authenticated USING (created_by = (select auth.uid()));

-- routine_slots
DROP POLICY IF EXISTS "routine_slots_select" ON public.routine_slots;
CREATE POLICY "routine_slots_select" ON public.routine_slots
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "routine_slots_insert" ON public.routine_slots;
CREATE POLICY "routine_slots_insert" ON public.routine_slots
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "routine_slots_update" ON public.routine_slots;
CREATE POLICY "routine_slots_update" ON public.routine_slots
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "routine_slots_delete" ON public.routine_slots;
CREATE POLICY "routine_slots_delete" ON public.routine_slots
  FOR DELETE TO authenticated USING (true);

-- routine_slot_completions
DROP POLICY IF EXISTS "routine_slot_completions_select" ON public.routine_slot_completions;
CREATE POLICY "routine_slot_completions_select" ON public.routine_slot_completions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "routine_slot_completions_insert" ON public.routine_slot_completions;
CREATE POLICY "routine_slot_completions_insert" ON public.routine_slot_completions
  FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "routine_slot_completions_update" ON public.routine_slot_completions;
CREATE POLICY "routine_slot_completions_update" ON public.routine_slot_completions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "routine_slot_completions_delete" ON public.routine_slot_completions;
CREATE POLICY "routine_slot_completions_delete" ON public.routine_slot_completions
  FOR DELETE TO authenticated USING (true);