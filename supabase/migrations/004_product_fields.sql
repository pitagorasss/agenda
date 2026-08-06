-- Add quantity_sold and invoice_url to contract_products
ALTER TABLE contract_products ADD COLUMN IF NOT EXISTS quantity_sold DECIMAL DEFAULT 0;
ALTER TABLE contract_products ADD COLUMN IF NOT EXISTS invoice_url TEXT;
