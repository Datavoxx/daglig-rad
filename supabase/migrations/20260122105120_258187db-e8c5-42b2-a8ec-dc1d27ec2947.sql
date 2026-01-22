-- Add structured address columns to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add structured address columns to customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC;

-- Add structured address columns to project_estimates (for manual estimates)
ALTER TABLE project_estimates
ADD COLUMN IF NOT EXISTS manual_postal_code TEXT,
ADD COLUMN IF NOT EXISTS manual_city TEXT,
ADD COLUMN IF NOT EXISTS manual_latitude NUMERIC,
ADD COLUMN IF NOT EXISTS manual_longitude NUMERIC;