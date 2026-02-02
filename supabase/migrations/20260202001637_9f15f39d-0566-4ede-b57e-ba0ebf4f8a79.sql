-- Add RUT columns to project_estimates
ALTER TABLE public.project_estimates 
ADD COLUMN IF NOT EXISTS rut_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rut_percent numeric DEFAULT 50;