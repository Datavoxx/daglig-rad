-- Add new columns to customers table for Bygglet import compatibility
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_number text,
ADD COLUMN IF NOT EXISTS org_number text,
ADD COLUMN IF NOT EXISTS visit_address text,
ADD COLUMN IF NOT EXISTS invoice_address text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS mobile text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS website text;