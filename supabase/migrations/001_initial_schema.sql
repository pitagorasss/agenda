-- 4.1. Tipos de Contrato
CREATE TABLE IF NOT EXISTS contract_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#16A34A',
  default_periodicity TEXT CHECK (default_periodicity IN ('6months', '1year', 'custom')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.2. Itens do Contrato
CREATE TABLE IF NOT EXISTS contract_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type_id UUID REFERENCES contract_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3. Contratos Ativos (instâncias)
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type_id UUID REFERENCES contract_types(id),
  start_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'renewed')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.4. Categorias de Tarefa (Agenda)
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.5. Tarefas da Agenda
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  category_id UUID REFERENCES task_categories(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE contract_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Contract types: all authenticated users can read, only admins can delete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contract_types_select') THEN
    CREATE POLICY "contract_types_select" ON contract_types FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contract_types_insert') THEN
    CREATE POLICY "contract_types_insert" ON contract_types FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contract_types_update') THEN
    CREATE POLICY "contract_types_update" ON contract_types FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contract_types_delete') THEN
    CREATE POLICY "contract_types_delete" ON contract_types FOR DELETE TO authenticated USING (
      EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );
  END IF;
END $$;

-- Contract items: all authenticated users can CRUD
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contract_items_select') THEN
    CREATE POLICY "contract_items_select" ON contract_items FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contract_items_insert') THEN
    CREATE POLICY "contract_items_insert" ON contract_items FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contract_items_update') THEN
    CREATE POLICY "contract_items_update" ON contract_items FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contract_items_delete') THEN
    CREATE POLICY "contract_items_delete" ON contract_items FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Contracts: all authenticated users can CRUD
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contracts_select') THEN
    CREATE POLICY "contracts_select" ON contracts FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contracts_insert') THEN
    CREATE POLICY "contracts_insert" ON contracts FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contracts_update') THEN
    CREATE POLICY "contracts_update" ON contracts FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contracts_delete') THEN
    CREATE POLICY "contracts_delete" ON contracts FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Task categories: all authenticated users can CRUD
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'task_categories_select') THEN
    CREATE POLICY "task_categories_select" ON task_categories FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'task_categories_insert') THEN
    CREATE POLICY "task_categories_insert" ON task_categories FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'task_categories_update') THEN
    CREATE POLICY "task_categories_update" ON task_categories FOR UPDATE TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'task_categories_delete') THEN
    CREATE POLICY "task_categories_delete" ON task_categories FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Tasks: all authenticated users can read, creator or admin can update/delete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tasks_select') THEN
    CREATE POLICY "tasks_select" ON tasks FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tasks_insert') THEN
    CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tasks_update') THEN
    CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (
      created_by = auth.uid() OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'tasks_delete') THEN
    CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated USING (
      created_by = auth.uid() OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'admin')
    );
  END IF;
END $$;
