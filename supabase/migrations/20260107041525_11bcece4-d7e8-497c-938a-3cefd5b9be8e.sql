-- Add start_date column to project_plans table
ALTER TABLE public.project_plans 
ADD COLUMN start_date DATE;