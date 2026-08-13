-- Remove role-based access: todos os usuários são 'user'

-- 1. Todos os perfis passam a ser 'user'
UPDATE public.profiles SET role = 'user';

-- 2. evolution_observations: select aberto a todos; update/delete apenas do criador
DROP POLICY IF EXISTS "evolution_select" ON public.evolution_observations;
CREATE POLICY "evolution_select" ON public.evolution_observations
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "evolution_update" ON public.evolution_observations;
CREATE POLICY "evolution_update" ON public.evolution_observations
  FOR UPDATE TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "evolution_delete" ON public.evolution_observations;
CREATE POLICY "evolution_delete" ON public.evolution_observations
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 3. profiles: sem role, remove política de update restrita a admin
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- 4. Remove a coluna role
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;