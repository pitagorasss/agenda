-- O RPC insere apenas a própria notificação (user_id = auth.uid()),
-- que passa na política notifications_insert_own. Não precisa de SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.send_test_completion_notification()
RETURNS void
LANGUAGE plpgsql
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