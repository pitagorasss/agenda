-- Create storage bucket for contract invoices
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('contracts', 'contracts', true, false, 5242880, '{"application/pdf","image/png","image/jpeg","image/jpg"}')
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "contracts_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contracts');

-- Allow authenticated users to read files
CREATE POLICY "contracts_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contracts');
