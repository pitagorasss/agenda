-- Torna o bucket 'contracts' privado
-- Acesso passa a ser feito via URLs assinadas (createSignedUrl).
UPDATE storage.buckets SET public = false WHERE id = 'contracts';

-- Garante que o dono pode ler/atualizar/excluir os objetos que enviou
DO $$ BEGIN
  CREATE POLICY "contracts_select_owner" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'contracts' AND owner = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "contracts_delete_owner" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'contracts' AND owner = auth.uid());
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Remove a policy antiga de leitura pública (substituída pela de owner)
DROP POLICY IF EXISTS "contracts_select" ON storage.objects;