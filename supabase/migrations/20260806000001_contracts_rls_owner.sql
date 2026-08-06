-- RLS: restringe UPDATE/DELETE de contratos ao criador da linha
-- Espelha a regra existente da tabela tasks (created_by = auth.uid()).

DO $$ BEGIN
  DROP POLICY IF EXISTS "contracts_update" ON contracts;
  CREATE POLICY "contracts_update" ON contracts FOR UPDATE TO authenticated
    USING (created_by = auth.uid());
  DROP POLICY IF EXISTS "contracts_delete" ON contracts;
  CREATE POLICY "contracts_delete" ON contracts FOR DELETE TO authenticated
    USING (created_by = auth.uid());
END $$;

-- contract_categories não possui created_by; verifica o dono do contract pai
DO $$ BEGIN
  DROP POLICY IF EXISTS "contract_categories_update" ON contract_categories;
  CREATE POLICY "contract_categories_update" ON contract_categories FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM contracts c
        WHERE c.id = contract_categories.contract_id AND c.created_by = auth.uid()
      )
    );
  DROP POLICY IF EXISTS "contract_categories_delete" ON contract_categories;
  CREATE POLICY "contract_categories_delete" ON contract_categories FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM contracts c
        WHERE c.id = contract_categories.contract_id AND c.created_by = auth.uid()
      )
    );
END $$;

-- contract_products não possui coluna de dono; herda via contract_categories -> contracts
DO $$ BEGIN
  DROP POLICY IF EXISTS "contract_products_update" ON contract_products;
  CREATE POLICY "contract_products_update" ON contract_products FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM contract_categories cc
        JOIN contracts c ON c.id = cc.contract_id
        WHERE cc.id = contract_products.contract_category_id AND c.created_by = auth.uid()
      )
    );
  DROP POLICY IF EXISTS "contract_products_delete" ON contract_products;
  CREATE POLICY "contract_products_delete" ON contract_products FOR DELETE TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM contract_categories cc
        JOIN contracts c ON c.id = cc.contract_id
        WHERE cc.id = contract_products.contract_category_id AND c.created_by = auth.uid()
      )
    );
END $$;