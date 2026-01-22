-- Make project_id nullable to allow standalone estimates
ALTER TABLE project_estimates 
  ALTER COLUMN project_id DROP NOT NULL;

-- Add columns for manual customer info on standalone estimates
ALTER TABLE project_estimates 
  ADD COLUMN IF NOT EXISTS manual_client_name text,
  ADD COLUMN IF NOT EXISTS manual_address text,
  ADD COLUMN IF NOT EXISTS manual_project_name text;