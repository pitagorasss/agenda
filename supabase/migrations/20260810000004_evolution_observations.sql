-- Espaço de Evolução: observações de melhorias, desempenho e atenção

CREATE TABLE IF NOT EXISTS public.evolution_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('melhoria', 'desempenho', 'atencao')),
  level TEXT NOT NULL CHECK (level IN ('urgente', 'emergente', 'empurravel')),
  description TEXT NOT NULL,
  responsible_id UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.evolution_observations ENABLE ROW LEVEL SECURITY;

-- Select: admin/analista veem todos; usuário comum ve apenas as marcadas para ele
CREATE POLICY "evolution_select" ON public.evolution_observations
  FOR SELECT TO authenticated
  USING (
    responsible_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'analista')
    )
  );

-- Insert: qualquer usuário autenticado pode registrar
CREATE POLICY "evolution_insert" ON public.evolution_observations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Update/Delete: criador ou admin
CREATE POLICY "evolution_update" ON public.evolution_observations
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "evolution_delete" ON public.evolution_observations
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );