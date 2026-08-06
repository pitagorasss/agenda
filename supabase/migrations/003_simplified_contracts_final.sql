-- Drop old contract tables
DROP TABLE IF EXISTS contract_types CASCADE;
DROP TABLE IF EXISTS contract_items CASCADE;
DROP TABLE IF EXISTS contract_categories CASCADE;
DROP TABLE IF EXISTS contract_products CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;

-- Create new simplified contracts system
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  renewal_period TEXT NOT NULL DEFAULT '6months' CHECK (renewal_period IN ('6months', '1year', 'custom')),
  start_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired')),
  custom_period_days INTEGER,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contract_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE contract_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_category_id UUID REFERENCES contract_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_select" ON contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_insert" ON contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contracts_update" ON contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contracts_delete" ON contracts FOR DELETE TO authenticated USING (true);

CREATE POLICY "contract_categories_select" ON contract_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "contract_categories_insert" ON contract_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contract_categories_update" ON contract_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contract_categories_delete" ON contract_categories FOR DELETE TO authenticated USING (true);

CREATE POLICY "contract_products_select" ON contract_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "contract_products_insert" ON contract_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contract_products_update" ON contract_products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "contract_products_delete" ON contract_products FOR DELETE TO authenticated USING (true);

-- Update tasks table: add category_color column for user-typed categories
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_color TEXT;
