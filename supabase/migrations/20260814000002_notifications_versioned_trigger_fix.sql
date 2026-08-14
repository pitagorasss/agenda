-- ============================================================
-- 1) Versiona a tabela notifications (existia apenas no dashboard)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2) Trigger notify_task_completed corrigido (SECURITY DEFINER)
--    Sem isso, o INSERT em notifications é bloqueado pelo RLS
--    quando outro usuário conclui a tarefa.
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if new.status = 'completed'
     and old.status is distinct from 'completed'
     and new.created_by is not null
     and (new.completed_by is null or new.completed_by <> new.created_by) then
    insert into public.notifications (user_id, task_id, title, actor_id)
    values (new.created_by, new.id, new.title, new.completed_by);
  end if;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS notify_task_completed ON public.tasks;
CREATE TRIGGER notify_task_completed
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_completed();

-- ============================================================
-- 3) RPC de teste de notificação (versionada)
-- ============================================================
CREATE OR REPLACE FUNCTION public.send_test_completion_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if auth.uid() is null then
    raise exception 'Nao autenticado';
  end if;
  insert into public.notifications (user_id, task_id, title, actor_id)
  values (auth.uid(), null, 'Tarefa de teste', null);
end;
$$;

-- ============================================================
-- 4) Policies de notifications com initplan (select auth.uid())
-- ============================================================
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications_insert_own" ON public.notifications;
CREATE POLICY "notifications_insert_own" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);